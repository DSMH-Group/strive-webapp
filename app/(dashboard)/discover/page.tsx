"use client";

import React, {useState, useTransition} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Building2, CheckCircle2, Compass, Dumbbell, MapPin, Search, SlidersHorizontal} from "lucide-react";

// 1. Contract matching our future global tenant directory endpoint
interface TenantDirectoryItem {
    id: string;
    name: string;
    subdomain: string;
    vertical: "High Performance" | "CrossFit" | "Wellness" | "Combat Sports" | "Traditional Gym";
    location: string;
    distance: string;
    status: "ACTIVE" | "GRACE_PERIOD" | "NONE"; // Does the current user belong here?
    accentColor: string;
    imageUrl?: string;
}

// 2. Mock dataset mirroring local Sri Lankan fitness hubs on Strive
const MOCK_PARTNER_GYMS: TenantDirectoryItem[] = [
    {
        id: "tass-colombo-uuid",
        name: "TASS Colombo",
        subdomain: "tass",
        vertical: "High Performance",
        location: "Colombo 07",
        distance: "1.2 km",
        status: "ACTIVE",
        accentColor: "from-blue-600/20 to-cyan-600/10",
    },
    {
        id: "the-box-sl-uuid",
        name: "The Box SL",
        subdomain: "thebox",
        vertical: "CrossFit",
        location: "Colombo 05",
        distance: "3.8 km",
        status: "NONE",
        accentColor: "from-orange-600/20 to-amber-600/10",
    },
    {
        id: "yoga-soul-uuid",
        name: "Yoga Soul",
        subdomain: "yogasoul",
        vertical: "Wellness",
        location: "Negombo",
        distance: "0.5 km",
        status: "NONE",
        accentColor: "from-purple-600/20 to-pink-600/10",
    },
    {
        id: "power-world-gym-uuid",
        name: "Power World Gyms",
        subdomain: "powerworld",
        vertical: "Traditional Gym",
        location: "Kandy",
        distance: "12.4 km",
        status: "GRACE_PERIOD",
        accentColor: "from-red-600/20 to-rose-600/10",
    },
];

const CATEGORIES = ["All", "High Performance", "CrossFit", "Wellness", "Traditional Gym"];

export default function DiscoverGymsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isPending, startTransition] = useTransition();

    // Filtering engine
    const filteredGyms = MOCK_PARTNER_GYMS.filter((gym) => {
        const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gym.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || gym.vertical === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleGymAction = (subdomain: string, currentStatus: string) => {
        startTransition(() => {
            if (currentStatus === "ACTIVE" || currentStatus === "GRACE_PERIOD") {
                // Route directly to their tenant space
                window.location.href = `https://${subdomain}.stride.lk/dashboard`;
            } else {
                // Trigger profile linker orchestration flow
                window.location.href = `https://${subdomain}.stride.lk/onboarding/link-profile`;
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section matching Dashboard style */}
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

            {/* Sticky Search & Filter Belt */}
            <div
                className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
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
                <Button variant="outline"
                        className="rounded-xl border-white/5 bg-zinc-950 hover:bg-zinc-900 gap-2 text-zinc-400">
                    <SlidersHorizontal size={14}/> Filters
                </Button>
            </div>

            {/* Quick-pill Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight uppercase border whitespace-nowrap transition-all duration-200 ${
                            selectedCategory === category
                                ? "bg-primary border-primary text-black"
                                : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Gyms Result Grid */}
            {filteredGyms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGyms.map((gym) => (
                        <div
                            key={gym.id}
                            className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-1 group flex flex-col justify-between"
                        >
                            {/* Accent backdrop mapping to custom brand configurations */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${gym.accentColor} opacity-40 transition-opacity group-hover:opacity-60`}/>

                            <div className="relative p-6 space-y-6">
                                {/* Vertical + Distance Header */}
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline"
                                           className="border-white/10 bg-white/5 uppercase tracking-wider text-[9px] font-black italic text-primary">
                                        {gym.vertical}
                                    </Badge>
                                    <span
                                        className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                                        <MapPin size={10}/> {gym.distance} away
                                    </span>
                                </div>

                                {/* Main Title / Brand Row */}
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-xl font-black italic text-zinc-300 tracking-tighter">
                                        {gym.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                                            {gym.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 font-medium">{gym.location}</p>
                                    </div>
                                </div>

                                {/* Status indicators linked to core user engine state */}
                                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <div className="text-xs">
                                        {gym.status === "ACTIVE" && (
                                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                                <CheckCircle2 size={12}/> Active Member
                                            </span>
                                        )}
                                        {gym.status === "GRACE_PERIOD" && (
                                            <span
                                                className="text-amber-500 flex items-center gap-1 font-bold animate-pulse">
                                                ⚠️ Action Required
                                            </span>
                                        )}
                                        {gym.status === "NONE" && (
                                            <span className="text-zinc-500 flex items-center gap-1">
                                                <Building2 size={12}/> Available Space
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleGymAction(gym.subdomain, gym.status)}
                                        disabled={isPending}
                                        variant={gym.status === "NONE" ? "outline" : "default"}
                                        className={`rounded-xl px-4 py-2 h-9 text-xs font-bold uppercase tracking-tight ${
                                            gym.status === "NONE"
                                                ? "border-white/10 bg-zinc-950 hover:bg-zinc-900 text-white"
                                                : "bg-white text-black hover:bg-zinc-200"
                                        }`}
                                    >
                                        {gym.status === "NONE" ? "Connect Space" : "Enter Portal"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center max-w-md mx-auto space-y-3">
                    <div
                        className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mx-auto">
                        <Dumbbell size={20}/>
                    </div>
                    <h3 className="font-bold text-white text-lg">No facilities found</h3>
                    <p className="text-xs text-zinc-500">
                        We couldn&apos;t find any partner spaces matching &ldquo;{searchQuery}&rdquo; in this category.
                        Try adjusting your search query.
                    </p>
                </div>
            )}
        </div>
    );
}