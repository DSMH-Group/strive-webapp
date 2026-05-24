// src/components/tenant/MobileNavManager.tsx
import {getMembershipRole} from "@/lib/membership";
import {Calendar, CreditCard, Dumbbell, Home, LayoutDashboard, Settings, Users} from "lucide-react";

interface MobileNavProps {
    tenantId: string;
}

export async function MobileNavManager({tenantId}: MobileNavProps) {
    const role = await getMembershipRole(tenantId);

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-popover/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-6 z-50">
            {role === 'ADMIN' && (
                <>
                    <MobileNavItem icon={<LayoutDashboard size={20}/>} label="Home" active/>
                    <MobileNavItem icon={<Users size={20}/>} label="Members"/>
                    <MobileNavItem icon={<Settings size={20}/>} label="Settings"/>
                </>
            )}
            {role === 'STAFF' && (
                <>
                    <MobileNavItem icon={<Users size={20}/>} label="Clients" active/>
                    <MobileNavItem icon={<Calendar size={20}/>} label="Schedule"/>
                    <MobileNavItem icon={<Settings size={20}/>} label="Settings"/>
                </>
            )}
            {role === 'MEMBER' && (
                <>
                    <MobileNavItem icon={<Home size={20}/>} label="Dashboard" active/>
                    <MobileNavItem icon={<Dumbbell size={20}/>} label="Workouts"/>
                    <MobileNavItem icon={<CreditCard size={20}/>} label="Payments"/>
                </>
            )}
        </nav>
    );
}

function MobileNavItem({icon, label, active = false}: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div
            className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-zinc-500 hover:text-zinc-400'}`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </div>
    );
}