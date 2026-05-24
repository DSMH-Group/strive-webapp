import Link from "next/link";
import { Activity, LayoutDashboard, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserAccountNav } from "./user-account-nav";

export async function Header() {
    // Fetch session on the server
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <header className=" fixed top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
                <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white italic">
                    <Activity className="w-6 h-6 text-primary" />
                    Stride.
                </Link>

                <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
                    <Link href="#roi" className="hover:text-primary transition-colors">ROI</Link>
                    <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
                </nav>

                <div className="flex items-center gap-4">
                    {session ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                            {/* Pass the user data to our client-side dropdown */}
                            <UserAccountNav user={session.user} />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Sign In
                            </Link>
                            <Link href="/book-demo" className="px-5 py-2.5 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(251,146,60,0.2)]">
                                Book a Demo
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}