// app/(platform)/register/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Dumbbell, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";
import {RegisterForm} from "@/components/register-form";

export const metadata: Metadata = {
    title: "Create Account | Stride",
    description: "Join Stride workspace — initialize your metrics and setup your global account.",
};

export default function RegisterPage() {
    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden flex flex-col lg:grid lg:grid-cols-2 text-foreground">

            {/* LEFT SIDE: INSPIRATIONAL BRAND PANEL */}
            <div className="relative flex flex-col p-8 lg:p-16 h-full border-r border-border">
                <div className="absolute inset-0 z-0 opacity-20"
                     style={{ backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--muted-foreground) / 0.1) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-primary/10 to-transparent z-0 pointer-events-none" />

                <Link href="/login" className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-20">
                    <ArrowLeft className="w-3 h-3" /> Existing member? Sign In
                </Link>

                <div className="relative z-10 mt-auto space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 border border-primary/40 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-primary font-black text-2xl italic">S.</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Stride Ecosystem</h2>
                            <p className="text-xs text-muted-foreground">Decoupled Unified Fitness Platform</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
                            Your fitness journey,<br/>
                            fully digital.
                        </h1>
                        <p className="text-lg text-muted-foreground font-light leading-relaxed">
                            Create a global account to track workouts, access your membership cards, and securely connect to partner facilities.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pb-20">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <HeartPulse className="w-3 h-3 text-primary" /> Multi-Gym Sync
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-card text-[11px] font-medium text-muted-foreground shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-primary" /> Encrypted Credentials
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: INTERACTIVE REGISTRATION ENGINE */}
            <div className="relative flex items-center justify-center p-8 lg:p-12 bg-background">
                <RegisterForm />
            </div>
        </div>
    );
}