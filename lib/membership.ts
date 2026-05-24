// src/lib/membership.ts

export function parseMembershipRole(userProfile: any, tenantId: string): 'ADMIN' | 'STAFF' | 'MEMBER' {
    if (!userProfile || !userProfile.memberships) {
        return 'MEMBER';
    }

    // Isolate the correct membership block matching this active tenant context
    const activeMembership = userProfile.memberships.find(
        (m: any) => m.tenantId === tenantId || m.tenant?.id === tenantId
    );

    if (!activeMembership) {
        console.warn(`[Membership Hook] No matching membership found for tenantId: ${tenantId}`);
        return 'MEMBER';
    }

    // Extract role strings out of the matched object block cleanly
    const roles = activeMembership.roles?.map((r: any) => r.role) || [];
    console.log(`[Membership Hook] Server-side parsed roles:`, roles);

    if (roles.includes('ORG_ADMIN')) return 'ADMIN';
    if (roles.includes('MANAGER') || roles.includes('TRAINER')) return 'STAFF';

    return 'MEMBER';
}