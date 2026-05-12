import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Dumbbell, QrCode, TrendingUp, CreditCard } from "lucide-react";
import {LoginForm} from "@/components/login-form";

export const metadata: Metadata = {
    title: "Sign In | Stride",
    description: "Workouts, progress and membership — all in one place for Stride members.",
};

export default function LoginPage() {
    return (
        <div className="relative min-h-screen w-full bg-zinc-950 overflow-hidden flex flex-col lg:grid lg:grid-cols-2">

            {/* LEFT SIDE: BRANDED MARKETING SECTION */}
            <div className="relative flex flex-col p-8 lg:p-16 h-full border-r border-white/5">
                {/* Visual Background: Grid + Subtle Radial Gradient */}
                <div className="absolute inset-0 z-0 opacity-20"
                     style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-orange-500/10 to-transparent z-0 pointer-events-none" />

                {/* Back to Stride Link */}
                <Link href="/" className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-20">
                    <ArrowLeft className="w-3 h-3" /> Back to Stride
                </Link>

                <div className="relative z-10 mt-auto space-y-10">
                    {/* Gym Logo & Identity */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-900/30 border border-orange-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                            <span className="text-orange-500 font-black text-2xl italic">FF</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Stride</h2>
                            <p className="text-xs text-muted-foreground">Colombo&apos;s Premier Training Facility</p>
                        </div>
                    </div>

                    {/* Branded Value Proposition [cite: 15, 62] */}
                    <div className="space-y-4 max-w-md">
                        <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-white">
                            Track every lift.<br/>
                            Hit every goal.
                        </h1>
                        <p className="text-lg text-muted-foreground font-light leading-relaxed">
                            Workouts, progress and membership — all in one place for Stride members.
                        </p>
                    </div>

                    {/* Feature Pills [cite: 51, 57, 66] */}
                    <div className="flex flex-wrap gap-3 pb-20">
                        <FeaturePill icon={<Dumbbell className="w-3 h-3" />} text="Workout plans" />
                        <FeaturePill icon={<QrCode className="w-3 h-3" />} text="QR check-in" />
                        <FeaturePill icon={<TrendingUp className="w-3 h-3" />} text="Progress" />
                        <FeaturePill icon={<CreditCard className="w-3 h-3" />} text="Membership" />
                    </div>
                </div>

                {/* Powered by Stride */}
                <div className="relative z-10 text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">
                    Powered by stride
                </div>
            </div>

            {/* RIGHT SIDE: AUTHENTICATION FORM */}
            <div className="relative flex items-center justify-center p-8 lg:p-12 bg-zinc-950">
                <LoginForm />
            </div>
        </div>
    );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[11px] font-medium text-muted-foreground shadow-sm">
            <span className="text-primary">{icon}</span>
            {text}
        </div>
    );
}