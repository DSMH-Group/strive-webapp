"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [authError, setAuthError] = React.useState<string | null>(null);

    /**
     * Senior Note: By wrapping this in a form 'onSubmit', we automatically
     * enable the "Enter" key for submission, matching modern usability standards.
     */
    const handleStrideLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation before hitting the server
        if (!email || !email.includes("@")) {
            setAuthError("Please enter a valid email address.");
            return;
        }

        setAuthError(null);
        setIsLoading(true);

        try {
            await authClient.signIn.social({
                provider: "keycloak",
                callbackURL: "/dashboard",
                // Note: Better Auth handles the OIDC redirect.
                // Any extra params should be configured at the plugin level in auth.ts
            }, {
                // Better Auth v0.4+ error handling callback
                onError: (ctx) => {
                    setAuthError(ctx.error.message || "Connection to Stride Identity failed.");
                    setIsLoading(false);
                },
                onSuccess: () => {
                    // Handled by the redirect, but good for local cleanup
                    setIsLoading(false);
                }
            });
        } catch (err: any) {
            console.error("Auth Exception:", err);
            setAuthError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleStrideLogin}
            className="w-full max-w-sm flex flex-col items-start text-left space-y-8"
        >
            <div className="space-y-1">
                <h3 className="text-4xl font-bold tracking-tight text-white">Sign in</h3>
                <p className="text-muted-foreground font-light italic">Welcome back to Stride</p>
            </div>

            <div className="space-y-6 w-full">
                {/* Error Display - Crucial for "Handling Objections" gracefully */}
                {authError && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 py-3 rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs font-medium ml-2">
                            {authError}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3 w-full">
                    <Label
                        htmlFor="email"
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 ml-1"
                    >
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (authError) setAuthError(null);
                        }}
                        placeholder="name@gym.com"
                        className="w-full h-14 bg-zinc-900/50 border-white/10 rounded-xl text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-white/20 transition-all"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-bold text-lg rounded-xl transition-all active:scale-[0.98] shadow-xl"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-5 w-5" />
                        Verifying...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        Continue with Stride <Zap className="w-4 h-4 fill-current" />
                    </span>
                )}
            </Button>

            <p className="text-[10px] text-muted-foreground/40 text-center w-full uppercase tracking-widest">
                Unified Fitness Identity Layer [cite: 151]
            </p>
        </form>
    );
}