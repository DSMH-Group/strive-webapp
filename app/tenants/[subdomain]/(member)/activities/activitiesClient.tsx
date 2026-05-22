// app/tenants/[subdomain]/(admin)/member/activities/activitiesClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, ShieldAlert, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActivitiesClientProps {
    subdomain: string;
    initialActivitiesData: any;
}

type RoutineDayFilter = "MON" | "WED" | "FRI";

export default function ActivitiesClient({ subdomain, initialActivitiesData }: ActivitiesClientProps) {
    const [activeTab, setActiveTab] = useState<RoutineDayFilter>("FRI");

    // --- Extensible Data Mapping Framework (Sourcing fallback items tailored to your mockup UI) ---
    const activityMeta = useMemo(() => {
        if (initialActivitiesData) return initialActivitiesData;
        return {
            programName: "Strength Builder",
            scheduleContext: "Week 3 of 8 · Muscle Gain",
            completionPercentage: 38,
            exercises: {
                MON: [
                    { name: "Bench Press", target: "Chest", sets: 4, reps: 6, weight: "80 kg", rest: "3 min", status: "DONE" },
                    { name: "Incline Dumbbell Flyes", target: "Chest", sets: 3, reps: 10, weight: "24 kg", rest: "90 s", status: "DONE" }
                ],
                WED: [
                    { name: "Barbell Rows", target: "Back", sets: 4, reps: 8, weight: "70 kg", rest: "2 min", status: "DONE" },
                    { name: "Lat Pulldowns", target: "Lats", sets: 3, reps: 12, weight: "60 kg", rest: "60 s", status: "DONE" }
                ],
                FRI: [
                    { name: "Squat", target: "Quads", sets: 4, reps: 6, weight: "100 kg", rest: "3 min", status: "DONE" },
                    { name: "Romanian DL", target: "Hamstrings", sets: 3, reps: 8, weight: "80 kg", rest: "2 min", status: "DONE" },
                    { name: "Leg Press", target: "Quads", sets: 3, reps: 12, weight: "150 kg", rest: "90 s", status: "PENDING" },
                    { name: "Calf Raises", target: "Calves", sets: 4, reps: 20, weight: "40 kg", rest: "60 s", status: "PENDING" }
                ]
            }
        };
    }, [initialActivitiesData]);

    const activeList = activityMeta.exercises[activeTab] || [];

    const handleRowInteraction = (name: string, currentStatus: string) => {
        toast.info(`Activity target context: ${name} is marked as ${currentStatus.toLowerCase()}.`);
    };

    return (
        <div className="space-y-6 text-white select-none animate-in fade-in duration-500">

            {/* Header Content Section Title */}
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">My Activities</h1>
            </div>

            {/* Dynamic Core Program High-Contrast Tracker Panel Card */}
            <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-black text-white tracking-tight">{activityMeta.programName}</h2>
                        <p className="text-xs text-zinc-500 font-medium">{activityMeta.scheduleContext}</p>
                    </div>
                    <div className="text-2xl font-black text-primary font-mono tracking-tight">
                        {activityMeta.completionPercentage}%
                    </div>
                </div>
                {/* Custom Styled Progress Track Bar Element */}
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
                        style={{ width: `${activityMeta.completionPercentage}%` }}
                    />
                </div>
            </Card>

            {/* Extensible Segmented Navigation Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <RoutineSelectorTab label="Mon - Push" active={activeTab === "MON"} onClick={() => setActiveTab("MON")} />
                <RoutineSelectorTab label="Wed - Pull" active={activeTab === "WED"} onClick={() => setActiveTab("WED")} />
                <RoutineSelectorTab label="Fri - Legs" active={activeTab === "FRI"} onClick={() => setActiveTab("FRI")} />
            </div>

            {/* Primary Activities Allocation Data Grid Sheet */}
            <Card className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-950/80 border-b border-white/5">
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4 pl-6">Exercise</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4">Target</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4 text-center">Sets</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4 text-center">Reps</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4">Weight / Load</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4">Rest Interval</TableHead>
                            <TableHead className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase py-4 pr-6 text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeList.map((row: any, idx: number) => {
                            const isDone = row.status === "DONE";
                            return (
                                <TableRow
                                    key={idx}
                                    className="border-b border-white/5 hover:bg-zinc-900/40 group cursor-pointer transition-colors"
                                    onClick={() => handleRowInteraction(row.name, row.status)}
                                >
                                    {/* Action Core Label Box item row element */}
                                    <TableCell className="py-4 pl-6 font-bold text-sm text-zinc-100 group-hover:text-primary transition-colors">
                                        {row.name}
                                    </TableCell>

                                    {/* Target Category Taxonomy Tag Block */}
                                    <TableCell className="py-4">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2.5 py-0.5 rounded border tracking-wide",
                                            row.target === "Quads" && "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
                                            row.target === "Hamstrings" && "bg-amber-500/5 text-amber-400 border-amber-500/10",
                                            row.target === "Calves" && "bg-zinc-800 text-zinc-400 border-white/5",
                                            row.target !== "Quads" && row.target !== "Hamstrings" && row.target !== "Calves" && "bg-primary/5 text-primary border-primary/10"
                                        )}>
                                            {row.target}
                                        </span>
                                    </TableCell>

                                    {/* Quantified System Track Weights */}
                                    <TableCell className="text-center font-mono text-sm text-zinc-300 py-4">
                                        {row.sets}
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-sm text-zinc-300 py-4">
                                        {row.reps}
                                    </TableCell>

                                    {/* Load Target Metrics */}
                                    <TableCell className="font-mono text-sm font-black text-white py-4">
                                        {row.weight}
                                    </TableCell>

                                    {/* Duration Interval Variables */}
                                    <TableCell className="text-zinc-400 text-xs font-medium font-mono py-4">
                                        {row.rest}
                                    </TableCell>

                                    {/* Execution State Status Modifiers */}
                                    <TableCell className="py-4 pr-6 text-right">
                                        <span className={cn(
                                            "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-tight",
                                            isDone
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                        )}>
                                            {isDone ? "Done" : "Pending"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

// --- Local Tab Sub-componentPresentation Element Helpers ---

function RoutineSelectorTab({
                                label,
                                active,
                                onClick
                            }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 h-9 rounded-xl text-xs font-bold transition-all whitespace-nowrap border border-transparent text-zinc-400 hover:text-zinc-200 bg-zinc-900/40",
                active && "bg-zinc-950 text-amber-500 border-amber-500/20 shadow-md font-black"
            )}
        >
            {label}
        </button>
    );
}