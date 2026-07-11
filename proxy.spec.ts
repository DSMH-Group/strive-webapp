import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from './proxy';

// Mock NextResponse methods to trace behavior
vi.mock('next/server', async (importOriginal) => {
    const original = await importOriginal<typeof import('next/server')>();
    return {
        ...original,
        NextResponse: {
            next: vi.fn().mockImplementation(() => ({
                headers: new Headers(),
                status: 200,
            })),
            rewrite: vi.fn().mockImplementation((url, init) => ({
                status: 200,
                headers: init?.request?.headers || new Headers(),
                rewrittenUrl: url.toString(),
            })),
        },
    };
});

describe('Edge Routing Middleware (proxy.ts)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://backend.strive.com');
        vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should bypass rewrite and return NextResponse.next() for static assets and login page', async () => {
        const req = new NextRequest('http://localhost:3000/login');
        const res = await proxy(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.rewrite).not.toHaveBeenCalled();
    });

    it('should bypass rewrite for platform root apex domain (localhost)', async () => {
        const req = new NextRequest('http://localhost:3000/dashboard', {
            headers: { host: 'localhost:3000' }
        });
        const res = await proxy(req);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.rewrite).not.toHaveBeenCalled();
    });

    it('should extract tenant subdomain and perform resolution fetch and rewrite path', async () => {
        const mockTenantData = { id: 'tenant-uuid-123', name: 'Gold Gym' };
        
        // Mock global fetch response
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockTenantData),
            } as Response)
        );

        const req = new NextRequest('http://test.localhost:3000/console', {
            headers: { host: 'test.localhost:3000' }
        });

        const res = (await proxy(req)) as any;

        // Verify resolution endpoint is queried with correct mapping (test.dsmhgroup.com)
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://backend.strive.com/api/v1/meta/resolve?domain=test.dsmhgroup.com',
            expect.objectContaining({
                headers: {
                    'x-internal-secret': 'test-internal-secret',
                },
            })
        );

        // Verify rewritten path
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/tenants/test/console',
            }),
            expect.any(Object)
        );

        // Verify header injection
        expect(res.headers.get('x-tenant-id')).toBe('tenant-uuid-123');
    });

    it('should handle subdomain extraction for production domain suffixes', async () => {
        const mockTenantData = { id: 'tenant-uuid-456', name: 'Fitness Plus' };
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockTenantData),
            } as Response)
        );

        const req = new NextRequest('https://gymone.dsmhgroup.com/overview', {
            headers: { host: 'gymone.dsmhgroup.com' }
        });

        const res = (await proxy(req)) as any;

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://backend.strive.com/api/v1/meta/resolve?domain=gymone.dsmhgroup.com',
            expect.any(Object)
        );

        expect(NextResponse.rewrite).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/tenants/gymone/overview',
            }),
            expect.any(Object)
        );

        expect(res.headers.get('x-tenant-id')).toBe('tenant-uuid-456');
    });
});
