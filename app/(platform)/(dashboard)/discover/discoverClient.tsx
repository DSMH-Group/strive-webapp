// app/tenants/[subdomain]/(admin)/discover/DiscoverGymsClient.tsx
"use client";

import React, { useState, useDeferredValue } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Building2,
    CheckCircle2,
    Compass,
    Dumbbell,
    MapPin,
    Search,
    SlidersHorizontal,
    Loader2,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StriveTenant {
    id: string;
    name: string;
    subdomain: string;
    vertical: "High Performance" | "CrossFit" | "Wellness" | "Combat Sports" | "Traditional Gym";
    location: string;
    accentColor: string;
    membershipStatus: "ACTIVE" | "GRACE_PERIOD" | "PENDING" | "SUSPENDED" | "NONE";
}

interface DiscoverGymsClientProps {
    initialToken: string;
    globalUser: {
        id: string;
        name?: string | null;
        email?: string | null;
    };
}

const CATEGORIES = ["All", "High Performance", "CrossFit", "Wellness", "Traditional Gym"];
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function DiscoverGymsClient({ initialToken, globalUser }: DiscoverGymsClientProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Defer complex multi-node lookups to protect 4G thread-cycles
    const deferredSearchQuery = useDeferredValue(searchQuery);

    // 1. Live Catalog Query utilizing passed native Token
    const { data: gyms, isLoading, isError, error } = useQuery<StriveTenant[]>({
        queryKey: ["tenants", deferredSearchQuery, selectedCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (deferredSearchQuery) params.append("search", deferredSearchQuery);
            if (selectedCategory !== "All") params.append("vertical", selectedCategory);

            const res = await fetch(`${BASE_URL}/api/v1/tenants?${params.toString()}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Boundary response failure during tenant scanning.");
            }

            return res.json();
        },
        enabled: !!initialToken,
        staleTime: 1000 * 60 * 5,
    });

    // 2. Single-Tap Environment Link Mutation
    const linkMembershipMutation = useMutation({
        mutationFn: async ({ tenantId }: { tenantId: string; subdomain: string }) => {
            const res = await fetch(`${BASE_URL}/api/v1/members`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: globalUser.id,
                    initialRole: "MEMBER",
                    rfidTag: `AUTO-${Math.random().toString(16).substring(2, 8).toUpperCase()}`
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Ledger writing validation fault.");
            }

            return res.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Space Connected Successfully!", {
                description: "Synchronizing platform identity parameters... routing to workspace.",
                duration: 2000,
            });

            queryClient.invalidateQueries({ queryKey: ["tenants"] });

            setTimeout(() => {
                window.location.href = `https://${variables.subdomain}.stride.lk/dashboard`;
            }, 1200);
        },
        onError: (err: Error) => {
            toast.error("Identity Binding Fault", {
                description: err.message,
            });
        }
    });

    const handleGymAction = (tenant: StriveTenant) => {
        if (tenant.membershipStatus === "NONE") {
            linkMembershipMutation.mutate({ tenantId: tenant.id, subdomain: tenant.subdomain });
        } else {
            window.location.href = `https://${tenant.subdomain}.stride.lk/dashboard`;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-foreground">
            {/* Header branding block */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Compass size={12} /> Global Fitness Directory
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Find Your Space
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl">
                    Discover Strive-powered gyms and training facilities across Sri Lanka. Seamlessly connect your
                    global profile with a single tap.
                </p>
            </div>

            {/* Ingress Search Mechanics */}
            <div className="flex flex-col sm:flex-row gap-3 bg-card/50 p-3 rounded-lg border border-border backdrop-blur-md">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input
                        type="text"
                        placeholder="Search gyms by name or location (e.g., Colombo)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-border rounded-md pl-11 pr-4 py-2.5 text-sm placeholder-muted-foreground/50 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <Button variant="outline" className="rounded-md border-border bg-background hover:bg-accent hover:text-accent-foreground gap-2 text-muted-foreground">
                    <SlidersHorizontal size={14}/> Filters
                </Button>
            </div>

            {/* Taxonomy Navigation Belt */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {CATEGORIES.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "px-4 py-1.5 rounded-sm text-xs font-bold tracking-tight uppercase whitespace-nowrap transition-all duration-200 h-auto",
                            selectedCategory === category
                                ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-card border-border text-muted-foreground hover:border-accent-foreground"
                        )}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Asynchronous Feedback Rendering Engine */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Scanning platform ledger...</p>
                </div>
            )}

            {isError && (
                <div className="rounded-lg border border-destructive/10 bg-destructive/5 p-8 text-center max-w-md mx-auto space-y-3">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                    <h3 className="font-bold text-foreground text-lg">Platform Handshake Disrupted</h3>
                    <p className="text-xs text-muted-foreground">{error.message}</p>
                </div>
            )}

            {/* Data Matrix */}
            {!isLoading && !isError && (gyms && gyms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gyms.map((gym) => (
                        <div
                            key={gym.id}
                            className="relative overflow-hidden rounded-lg border border-border bg-card p-1 group flex flex-col justify-between"
                        >
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-60", gym.accentColor || "from-border to-background")}/>

                            <div className="relative p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="border-border bg-background uppercase tracking-wider text-[9px] font-black italic text-primary">
                                        {gym.vertical || "General Fitness"}
                                    </Badge>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                        <MapPin size={10}/> {gym.location || "Sri Lanka"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-md bg-background border border-border flex items-center justify-center text-xl font-black italic text-muted-foreground tracking-tighter">
                                        {gym.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {gym.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono tracking-tighter">
                                            {gym.subdomain}.stride.lk
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-border">
                                    <div className="text-xs">
                                        {gym.membershipStatus === "ACTIVE" && (
                                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                                <CheckCircle2 size={12}/> Active Member
                                            </span>
                                        )}
                                        {gym.membershipStatus === "GRACE_PERIOD" && (
                                            <span className="text-amber-500 flex items-center gap-1 font-bold animate-pulse">
                                                ⚠️ Overdue
                                            </span>
                                        )}
                                        {gym.membershipStatus === "NONE" && (
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Building2 size={12}/> Target Environment
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleGymAction(gym)}
                                        disabled={linkMembershipMutation.isPending}
                                        variant={gym.membershipStatus === "NONE" ? "outline" : "default"}
                                        className={cn(
                                            "rounded-md px-4 py-2 h-9 text-xs font-bold uppercase tracking-tight",
                                            gym.membershipStatus === "NONE"
                                                ? "border-border bg-background hover:bg-accent text-foreground hover:text-accent-foreground"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {linkMembershipMutation.isPending && linkMembershipMutation.variables?.tenantId === gym.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                        ) : null}
                                        {gym.membershipStatus === "NONE" ? "Connect Space" : "Enter Portal"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-border p-12 text-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-muted-foreground mx-auto">
                        <Dumbbell size={20}/>
                    </div>
                    <h3 className="font-bold text-foreground text-lg">No facilities found</h3>
                    <p className="text-xs text-muted-foreground">
                        We couldn&apos;t find any partner spaces matching &ldquo;{searchQuery}&rdquo; in this category.
                    </p>
                </div>
            ))}
        </div>
    );
}