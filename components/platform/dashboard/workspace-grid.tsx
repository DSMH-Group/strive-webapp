// app/(platform)/(dashboard)/dashboard/components/workspace-grid.tsx
"use client"; // Ensure this is marked as a client component if using window.location

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Dumbbell, ShieldAlert, Users } from "lucide-react";
import { PrismaMembershipDto, Role } from "@/db/types"; // Adjust import path if needed

export function WorkspaceGrid({ memberships }: { memberships: PrismaMembershipDto[] }) {

    // Helper to determine the highest authority role for the primary CTA
    const getPrimaryAction = (roles: { role: Role }[], domain: string | null | undefined, slug: string) => {
        const roleArray = roles.map(r => r.role);

        // 1. Extract the base URL from your environment variables safely
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const parsedUrl = new URL(appUrl);

        // 2. Determine the tenant prefix. You mentioned 'domain' holds "gymname".
        // We fallback to 'slug' just in case domain is null for older records.
        const tenantIdentifier = domain || slug;

        // 3. Construct the dynamic base URL.
        let baseUrl = "";
        if (tenantIdentifier.includes(".")) {
            // Handle Premium Whitelabel Domains (e.g., 'app.partner-gym.com')
            baseUrl = `${parsedUrl.protocol}//${tenantIdentifier}`;
        } else {
            // Handle Standard Subdomains (e.g., 'gymname.stride.local:3000' or 'gymname.dsmhgroup.com')
            baseUrl = `${parsedUrl.protocol}//${tenantIdentifier}.${parsedUrl.host}`;
        }

        // 4. Route to the correct application vertical based on RBAC
        if (roleArray.includes("ORG_ADMIN") || roleArray.includes("MANAGER")) {
            return { label: "Manage Workspace", url: `${baseUrl}/console`, icon: ShieldAlert, variant: "default" as const };
        }
        if (roleArray.includes("TRAINER")) {
            return { label: "Staff Roster", url: `${baseUrl}/staff`, icon: Users, variant: "secondary" as const };
        }
        return { label: "Member Hub", url: `${baseUrl}/app`, icon: Dumbbell, variant: "outline" as const };
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold italic uppercase tracking-tighter border-b border-border pb-2 text-foreground">
                Your Workspaces
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memberships.map((membership) => {
                    const action = getPrimaryAction(membership.roles, membership.tenant.domain, membership.tenant.slug);
                    const ActionIcon = action.icon;

                    return (
                        <Card key={membership.id} className="bg-card border-border p-5 flex flex-col justify-between gap-6 group hover:border-primary/50 transition-colors relative overflow-hidden">
                            {membership.status !== 'ACTIVE' && (
                                <div className="absolute top-0 right-0 bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-md">
                                    {membership.status}
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-md bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Building size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-lg leading-tight uppercase tracking-tight text-foreground truncate">
                                        {membership.tenant.name}
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {membership.roles.map(r => (
                                            <span key={r.id} className="text-[9px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                                                {r.role.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant={action.variant}
                                className="w-full h-10 text-xs font-bold uppercase tracking-wider justify-between"
                                onClick={() => window.location.href = action.url}
                            >
                                <span className="flex items-center gap-2"><ActionIcon size={14}/> {action.label}</span>
                                <ArrowRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}