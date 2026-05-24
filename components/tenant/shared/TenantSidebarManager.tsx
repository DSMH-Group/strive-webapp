// src/components/tenant/TenantSidebarManager.tsx
import {getMembershipRole} from "@/lib/membership";
import {TenantAdminSidebar} from "@/components/tenant/admin/TenantAdminSidebar";
import {TenantStaffSidebar} from "@/components/tenant/staff/TenantStaffSidebar";
import {TenantMemberSidebar} from "@/components/tenant/member/TenantMemberSidebar";

interface SidebarManagerProps {
    user: { id: string; name: string };
    tenantId: string;
    config: any;
}

export async function TenantSidebarManager({user, tenantId, config}: SidebarManagerProps) {
    const role = await getMembershipRole(tenantId);

    const tenantName = config?.name || "Workspace";
    const logoUrl = config?.themeConfig?.logoUrl;

    switch (role) {
        case 'ADMIN':
            return <TenantAdminSidebar tenantName={tenantName} logoUrl={logoUrl} />;
        case 'STAFF':
            return <TenantStaffSidebar tenantName={tenantName} logoUrl={logoUrl} />;
        default:
            return <TenantMemberSidebar tenantName={tenantName} logoUrl={logoUrl} />;
    }
}