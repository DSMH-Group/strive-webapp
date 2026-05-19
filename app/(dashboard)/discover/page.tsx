"use client";

import React, { useState, useDeferredValue } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client"; // Native better-auth frontend client export
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // Modern shadcn/ui requirement
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

interface StriveTenant {
    id: string;
    name: string;
    subdomain: string;
    vertical: "High Performance" | "CrossFit" | "Wellness" | "Combat Sports" | "Traditional Gym";
    location: string;
    accentColor: string;
    membershipStatus: "ACTIVE" | "GRACE_PERIOD" | "PENDING" | "SUSPENDED" | "NONE";
}

const CATEGORIES = ["All", "High Performance", "CrossFit", "Wellness", "Traditional Gym"];
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function DiscoverGymsPage() {
    // Native better-auth React 18/19 reactive hook structure
    const { data: sessionData } = authClient.useSession();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Defer input analysis to prevent thread blocking on 4G networks
    const deferredSearchQuery = useDeferredValue(searchQuery);

    // 1. Live Catalog Query built natively using Web Fetch API
    const { data: gyms, isLoading, isError, error } = useQuery<StriveTenant[]>({
        queryKey: ["tenants", deferredSearchQuery, selectedCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (deferredSearchQuery) params.append("search", deferredSearchQuery);
            if (selectedCategory !== "All") params.append("vertical", selectedCategory);

            const res = await fetch(`${BASE_URL}/api/v1/tenants?${params.toString()}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${sessionData?.session?.token}`,
                    "Content-Type": "application/json",
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Boundary response failure during tenant scanning.");
            }

            return res.json();
        },
        enabled: !!sessionData?.session?.token,
        staleTime: 1000 * 60 * 5,
    });

    // 2. Profile Link Mutation built natively using Web Fetch API
    const linkMembershipMutation = useMutation({
        mutationFn: async ({ tenantId }: { tenantId: string; subdomain: string }) => {
            const res = await fetch(`${BASE_URL}/api/v1/members`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${sessionData?.session?.token}`,
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: sessionData?.user?.id,
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
            // Modern native sonner deployment pattern
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header branding block */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Compass size={12} className="animate-spin-slow"/> Global Fitness Directory
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Find Your Space
                </h1>
                <p className="text-sm text-zinc-400 max-w-xl">
                    Discover Strive-powered gyms and training facilities across Sri Lanka. Seamlessly connect your
                    global profile with a single tap.
                </p>
            </div>

            {/* Ingress Search Mechanics */}
            <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                    <input
                        type="text"
                        placeholder="Search gyms by name or location (e.g., Colombo)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-sm placeholder-zinc-500 text-white focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <Button variant="outline" className="rounded-xl border-white/5 bg-zinc-950 hover:bg-zinc-900 gap-2 text-zinc-400">
                    <SlidersHorizontal size={14}/> Filters
                </Button>
            </div>

            {/* Taxonomy Navigation Belt */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {CATEGORIES.map((category) => (
                    <Button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight uppercase border whitespace-nowrap transition-all duration-200 ${
                            selectedCategory === category
                                ? "bg-primary border-primary text-black"
                                : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Asynchronous Thread Management Views */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs text-zinc-500 tracking-widest uppercase font-bold">Scanning platform ledger...</p>
                </div>
            )}

            {isError && (
                <div className="rounded-[2rem] border border-red-500/10 bg-red-500/5 p-8 text-center max-w-md mx-auto space-y-3">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <h3 className="font-bold text-white text-lg">Platform Handshake Disrupted</h3>
                    <p className="text-xs text-zinc-400">{error.message}</p>
                </div>
            )}

            {/* Interactive Data Matrix Layout */}
            {!isLoading && !isError && (gyms && gyms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gyms.map((gym) => (
                        <div
                            key={gym.id}
                            className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-1 group flex flex-col justify-between"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${gym.accentColor || "from-zinc-800/20 to-zinc-900/10"} opacity-40 transition-opacity group-hover:opacity-60`}/>

                            <div className="relative p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="border-white/10 bg-white/5 uppercase tracking-wider text-[9px] font-black italic text-primary">
                                        {gym.vertical || "General Fitness"}
                                    </Badge>
                                    <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                                        <MapPin size={10}/> {gym.location || "Sri Lanka"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-xl font-black italic text-zinc-300 tracking-tighter">
                                        {gym.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                                            {gym.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 font-mono tracking-tighter">
                                            {gym.subdomain}.stride.lk
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-white/5">
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
                                            <span className="text-zinc-500 flex items-center gap-1">
                                                <Building2 size={12}/> Target Environment
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleGymAction(gym)}
                                        disabled={linkMembershipMutation.isPending}
                                        variant={gym.membershipStatus === "NONE" ? "outline" : "default"}
                                        className={`rounded-xl px-4 py-2 h-9 text-xs font-bold uppercase tracking-tight ${
                                            gym.membershipStatus === "NONE"
                                                ? "border-white/10 bg-zinc-950 hover:bg-zinc-900 text-white hover:text-primary"
                                                : "bg-white text-black hover:bg-zinc-200"
                                        }`}
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
                <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mx-auto">
                        <Dumbbell size={20}/>
                    </div>
                    <h3 className="font-bold text-white text-lg">No facilities found</h3>
                    <p className="text-xs text-zinc-500">
                        We couldn&apos;t find any partner spaces matching &ldquo;{searchQuery}&rdquo; in this category.
                    </p>
                </div>
            ))}
        </div>
    );
}