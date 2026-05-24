// app/login/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {ArrowLeft, CreditCard, Dumbbell, Loader2, QrCode, ShieldAlert, TrendingUp, Webcam} from "lucide-react";
import {authClient} from "@/lib/auth-client";

type AuthError = {
    type: "credentials" | "network" | "server" | "unknown";
    message: string;
    detail?: string;
};

export default function LoginPage() {
    const [mounted, setMounted] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<AuthError | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const executeLoginPipeline = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await authClient.signIn.email({
                email,
                password,
            });

            if (result?.error) {
                if (typeof result.error === "object" && "message" in result.error) {
                    setError({type: "credentials", message: String(result.error.message)});
                } else {
                    setError({type: "credentials", message: "Invalid email or password"});
                }
                return;
            }

            window.location.href = "/dashboard";
        } catch (err) {
            setError({type: "unknown", message: "An unexpected network error occurred."});
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
            });
        } catch (err) {
            setError({type: "unknown", message: "Could not start Google sign in."});
        }
    };

    return (
        // 💡 FIX 1: Suppress proxy layout hydration warnings
        <div
            suppressHydrationWarning
            className="relative min-h-screen w-full bg-background overflow-hidden flex flex-col lg:grid lg:grid-cols-2 text-foreground"
        >

            {/* LEFT SIDE: MARKETING PANEL */}
            <div className="relative flex flex-col p-8 lg:p-16 h-full border-r border-border bg-background">
                <div className="absolute inset-0 z-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--muted-foreground) / 0.1) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}/>
                <div
                    className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-primary/10 to-transparent z-0 pointer-events-none"/>

                <Link href="/"
                      className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-20">
                    <ArrowLeft className="w-3 h-3"/> Back to Stride
                </Link>

                <div className="relative z-10 mt-auto space-y-10">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 bg-primary/10 border border-primary/40 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-primary font-black text-2xl italic">FF</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Stride</h2>
                            <p className="text-xs text-muted-foreground">Colombo&apos;s Premier Training Facility</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-foreground">
                            Track every lift.<br/>Hit every goal.
                        </h1>
                        <p className="text-lg text-muted-foreground font-light leading-relaxed">
                            Workouts, progress and membership — all in one place for Stride members.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pb-20">
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <span className="text-primary flex items-center"><Dumbbell
                                className="w-3 h-3"/></span> Workout plans
                        </div>
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <span className="text-primary flex items-center"><QrCode className="w-3 h-3"/></span> QR
                            check-in
                        </div>
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <span className="text-primary flex items-center"><TrendingUp
                                className="w-3 h-3"/></span> Progress
                        </div>
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <span className="text-primary flex items-center"><CreditCard
                                className="w-3 h-3"/></span> Membership
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">
                    Powered by stride
                </div>
            </div>

            {/* RIGHT SIDE: FORM WRAPPER */}
            <div className="relative flex flex-col items-center justify-center p-8 lg:p-12 bg-background">
                <div className="absolute top-8 right-8 text-xs text-muted-foreground">
                    New to Stride?{" "}
                    <Link href="/register" className="text-primary font-bold hover:underline transition-all">
                        Create an account
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-6 px-4">
                    <div className="space-y-2 text-center lg:text-left">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">Access Stride Workspace</h3>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials or use an authorized partner profile.
                        </p>
                    </div>

                    {error && (
                        <div className="flex gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-destructive"/>
                            <p className="text-xs font-semibold text-destructive">{error.message}</p>
                        </div>
                    )}

                    {/* 💡 FIX 2: Render form frame instantly, just keep button un-clickable until hydrated */}
                    <form onSubmit={executeLoginPipeline} className="space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="email"
                                   className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading || !mounted}
                                className="w-full h-11 px-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password"
                                       className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                    Password
                                </label>
                                <Link href="/forgot-password"
                                      className="text-xs text-primary hover:underline font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading || !mounted}
                                className="w-full h-11 px-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !mounted}
                            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-sm tracking-tight transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Sign In with Password"}
                        </button>

                        <div className="relative flex items-center justify-center my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/60"/>
                            </div>
                            <span
                                className="relative px-3 bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground z-10">
                                Or continuous access via
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={isLoading || !mounted}
                            onClick={handleGoogleLogin}
                            className="w-full h-11 bg-card border border-border rounded-xl hover:bg-accent hover:text-accent-foreground text-foreground flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Webcam className="w-4 h-4 text-red-500"/>
                            Continue with Google
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}