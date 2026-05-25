// types/dashboard.ts (or at the top of your client file)
export type Role = "ORG_ADMIN" | "MANAGER" | "TRAINER" | "MEMBER";

export interface PrismaTenantDto {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
}

export interface PrismaMembershipRoleDto {
    id: string;
    role: Role;
}

export interface PrismaMembershipDto {
    id: string;
    tenantId: string;
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    tenant: PrismaTenantDto;
    roles: PrismaMembershipRoleDto[];
}

export interface GlobalUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    memberships: PrismaMembershipDto[];
}