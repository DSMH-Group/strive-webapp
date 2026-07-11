import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TenantLayout from './layout';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: (key: string) => {
            if (key === 'x-tenant-id') return 'tenant-123';
            return null;
        }
    })
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn().mockImplementation((url) => {
        const err = new Error('NEXT_REDIRECT');
        (err as any).digest = `NEXT_REDIRECT;307;${url};`;
        throw err;
    })
}));

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue({
                user: { id: 'user-123', name: 'Nimal Silva', email: 'nimal@strive.com' }
            })
        }
    }
}));

vi.mock('@/components/platform/dashboard/Header', () => ({
    DashboardHeader: () => <div data-testid="dashboard-header" />
}));

vi.mock('@/components/tenant/shared/TenantSidebarManager', () => ({
    TenantSidebarManager: () => <div data-testid="sidebar-manager" />
}));

vi.mock('@/components/tenant/shared/MobileNavManager', () => ({
    MobileNavManager: () => <div data-testid="mobile-nav" />
}));

describe('TenantLayout Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://backend.strive.com');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should redirect if x-tenant-id is missing', async () => {
        const headersMock = vi.mocked(headers);
        headersMock.mockResolvedValueOnce({
            get: () => null
        } as any);

        await expect(
            TenantLayout({
                children: <div data-testid="child">Content</div>,
                params: Promise.resolve({ subdomain: 'testsub' })
            })
        ).rejects.toThrow('NEXT_REDIRECT');

        expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/explore'));
    });

    it('should redirect if session is missing', async () => {
        const getSessionMock = vi.mocked(auth.api.getSession);
        getSessionMock.mockResolvedValueOnce(null);

        await expect(
            TenantLayout({
                children: <div data-testid="child">Content</div>,
                params: Promise.resolve({ subdomain: 'testsub' })
            })
        ).rejects.toThrow('NEXT_REDIRECT');

        expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });

    it('should fetch tenant configuration and inject branding style variables', async () => {
        const mockTenantConfig = {
            id: 'tenant-123',
            name: 'Elite Archery',
            themeConfig: {
                primaryColor: '#00ff00', // Neon green
                radius: 0.75,
                themeMode: 'midnight',
                sidebarTheme: 'brand',
                fontFamily: 'poppins',
            }
        };

        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockTenantConfig),
            } as Response)
        );

        const vdom = await TenantLayout({
            children: <div data-testid="child">Gym Dashboard Content</div>,
            params: Promise.resolve({ subdomain: 'testsub' })
        });

        // Verify fetch was called with correct tenantId
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://backend.strive.com/api/v1/tenants/tenant-123',
            expect.objectContaining({
                headers: { 'X-Tenant-ID': 'tenant-123' },
            })
        );

        // Verify return output contains the dynamic stylesheet
        const styleElement = vdom.props.children[0];
        expect(styleElement.type).toBe('style');
        
        const styleContent = styleElement.props.dangerouslySetInnerHTML.__html;
        
        // Green hex #00ff00 translates to HSL '120 100% 50%'
        expect(styleContent).toContain('--primary: 120 100% 50%');
        expect(styleContent).toContain('--radius: 0.75rem');
        // Midnight bg is '0 0% 0%'
        expect(styleContent).toContain('--background: 0 0% 0%');
        expect(styleContent).toContain('font-family: var(--font-poppins)');
    });
});
