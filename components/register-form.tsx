"use client";

import React, {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {authClient} from "@/lib/auth-client"; // Adjust path to your Better-Auth client
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {toast} from "sonner";
import {Loader2, Lock, Mail, User} from "lucide-react";
import {cn} from "@/lib/utils";

export function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Extract URL Parameters
    const inviteToken = searchParams.get("inviteToken");
    const targetEmail = searchParams.get("email");
    const tenantDomain = searchParams.get("domain");

    // 2. Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 3. Pre-fill data if arriving from an invitation
    useEffect(() => {
        if (targetEmail) {
            setEmail(targetEmail);
        }
    }, [targetEmail]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName || !lastName || !email || !password) {
            toast.error("Please fill out all registration fields.");
            return;
        }

        setIsLoading(true);

        try {
            // 4. Create the identity via Better-Auth
            const {data, error} = await authClient.signUp.email({
                email: email,
                password: password,
                name: `${firstName} ${lastName}`,
                // Pass the invite token into Better-Auth metadata so your webhook can process it!
                fetchOptions: {
                    body: {
                        inviteToken: inviteToken || undefined
                    }
                }
            });

            if (error) {
                toast.error(`Registration failed: ${error.message}`);
                setIsLoading(false);
                return;
            }

            toast.success("Account created securely!");

            // 5. Dynamic Routing Hook
            // If they registered via a gym invite link, redirect them straight to that gym's domain!
            if (inviteToken && tenantDomain) {
                // Introduce a tiny delay to give your background Webhook time to link the membership in NestJS
                toast.info("Connecting to your workspace...");
                setTimeout(() => {
                    window.location.href = `https://${tenantDomain}/console`;
                }, 1500);
            } else {
                // Standard organic registration -> Go to platform dashboard
                router.push("/dashboard");
            }

        } catch (err: any) {
            toast.error("A critical network fault occurred during signup.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">Create your account</h2>
                {inviteToken ? (
                    <p className="text-sm text-primary font-bold">You are accepting a workspace invitation.</p>
                ) : (
                    <p className="text-sm text-muted-foreground">Enter your details to initialize your global
                        profile.</p>
                )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First
                            Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                            <Input
                                type="text"
                                placeholder="Johann"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="pl-9 bg-card border-border h-11"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last
                            Name</label>
                        <Input
                            type="text"
                            placeholder="Test"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-card border-border h-11"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email
                        Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={!!targetEmail} // Lock the field if they are redeeming a strict invite
                            className={cn(
                                "pl-9 h-11 border-border",
                                targetEmail ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-card"
                            )}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure
                        Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-9 bg-card border-border h-11"
                            required
                            minLength={8}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs mt-2 hover:bg-primary/90 transition-all"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Verifying...</span>
                    ) : (
                        "Initialize Profile"
                    )}
                </Button>
            </form>
        </div>
    );
}