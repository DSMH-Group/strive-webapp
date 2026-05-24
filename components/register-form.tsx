// src/components/platform/register-form.tsx
"use client";

import * as React from "react";
import {authClient} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ArrowRight, CheckCircle2, Loader2, ShieldAlert} from "lucide-react";
import {useRouter} from "next/navigation";

export function RegisterForm() {
    const router = useRouter();

    // Form Wizard Step State Control (1: Core Account, 2: Optional Gym Metrics)
    const [step, setStep] = React.useState(1);

    // Core Schema Account Inputs
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    // Optional UI-only parameters (Never sent to DB)
    const [age, setAge] = React.useState("");
    const [fitnessGoal, setFitnessGoal] = React.useState("");
    const [activityLevel, setActivityLevel] = React.useState("");

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError("Please complete all required fields.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleFinalRegistration = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Drop optional client states (age, fitnessGoal, activityLevel) right here!
            // This maintains pristine compatibility with your backend 'auth' tables schema constraints.
            const {error: signUpError} = await authClient.signUp.email({
                email,
                password,
                name,
                callbackURL: "/dashboard",
            });

            if (signUpError) {
                setError(signUpError.message || "An identity collision error occurred.");
                setIsLoading(false);
            } else {
                // Better-Auth triggers autoSignIn by default. Route straight into workspace.
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Authentication gateway context timed out.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-6 px-4">
            <div className="space-y-2 text-center lg:text-left">
                <h3 className="text-2xl font-black tracking-tight">Create Global Identity</h3>
                <p className="text-sm text-muted-foreground">
                    {step === 1
                        ? "Define your primary system access credentials."
                        : "Optional: Customize your studio platform tracking profile."}
                </p>
            </div>

            {error && (
                <div
                    className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-xs text-destructive-foreground font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* STEP 1: STRICT DATA CONTRACT HANDLING */}
            {step === 1 && (
                <form onSubmit={handleNextStep}
                      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <Label htmlFor="reg-name"
                               className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full
                            Name</Label>
                        <Input
                            id="reg-name"
                            type="text"
                            required
                            placeholder="John Perera"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 bg-muted/40 border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-email"
                               className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email
                            Address</Label>
                        <Input
                            id="reg-email"
                            type="email"
                            required
                            placeholder="name@example.lk"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 bg-muted/40 border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-password"
                               className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secure
                            Password</Label>
                        <Input
                            id="reg-password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 bg-muted/40 border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                    </div>

                    <Button type="submit"
                            className="w-full h-11 rounded-xl text-sm font-bold tracking-tight gap-2 group">
                        Configure Metrics <ArrowRight
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
                    </Button>
                </form>
            )}

            {/* STEP 2: OPTIONAL GYM INSIGHTS ONBOARDING FLOW */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                        <Label htmlFor="on-age"
                               className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age <span
                            className="text-[10px] lowercase text-muted-foreground/60">(Optional)</span></Label>
                        <Input
                            id="on-age"
                            type="number"
                            placeholder="24"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="h-11 bg-muted/40 border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary
                            Fitness Goal <span
                                className="text-[10px] lowercase text-muted-foreground/60">(Optional)</span></Label>
                        <Select value={fitnessGoal}
                                onValueChange={(val) => setFitnessGoal(val ?? "")} // 👈 Type-safe wrapper
                        >
                            <SelectTrigger
                                className="h-11 bg-muted/40 border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/30">
                                <SelectValue placeholder="Select primary focus"/>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="hypertrophy">Muscle Building (Hypertrophy)</SelectItem>
                                <SelectItem value="fat-loss">Weight Loss / Conditioning</SelectItem>
                                <SelectItem value="strength">Powerlifting & Strength</SelectItem>
                                <SelectItem value="endurance">Cardio & Athletic Endurance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current
                            Weekly Activity <span
                                className="text-[10px] lowercase text-muted-foreground/60">(Optional)</span></Label>
                        <Select value={activityLevel}
                                onValueChange={(val) => setFitnessGoal(val ?? "")} // 👈 Type-safe wrapper
                        >
                            <SelectTrigger
                                className="h-11 bg-muted/40 border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/30">
                                <SelectValue placeholder="Select activity tier"/>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="sedentary">Sedentary (Desk Job, Minimal Training)</SelectItem>
                                <SelectItem value="moderate">Light/Moderate (1-3 sessions per week)</SelectItem>
                                <SelectItem value="active">Highly Active (4-6 intense sessions per week)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                            className="h-11 rounded-xl border-border bg-transparent text-xs"
                        >
                            Back
                        </Button>
                        <Button
                            type="button"
                            onClick={handleFinalRegistration}
                            disabled={isLoading}
                            className="flex-1 h-11 rounded-xl text-sm font-bold tracking-tight gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                                <>
                                    <CheckCircle2 className="w-4 h-4"/> Complete Registration
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <p className="text-[10px] text-center text-muted-foreground/40 leading-relaxed">
                By creating an identity signature, you agree to global multi-tenant schema terms of application routing.
            </p>
        </div>
    );
}