import {Sidebar} from "@/components/dashboard/Sidebar";


export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-950 text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-zinc-950 sticky top-0 h-screen">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader />
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-6 z-50">
                <MobileNavItem icon={<LayoutDashboard size={20} />} label="Home" active />
                <MobileNavItem icon={<Search size={20} />} label="Discover" />
                <MobileNavItem icon={<Wallet size={20} />} label="Wallet" />
                <MobileNavItem icon={<Settings size={20} />} label="Settings" />
            </nav>
        </div>
    );
}

// Quick helper for Mobile Nav
import { LayoutDashboard, Search, Wallet, Settings } from "lucide-react";
import {DashboardHeader} from "@/components/dashboard/Header";
function MobileNavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-zinc-500'}`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </div>
    );
}