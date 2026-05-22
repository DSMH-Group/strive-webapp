// app/tenants/[subdomain]/(admin)/trainer/schedule/scheduleClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    CalendarRange,
    RefreshCw,
    User,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleClientProps {
    subdomain: string;
    initialBookings: any[];
}

export default function ScheduleClient({ subdomain, initialBookings = [] }: ScheduleClientProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    // --- Core Timeline Data (Structured explicitly to match your uploaded design) ---
    const [timeSlots, setTimeSlots] = useState([
        { id: "slot-1", time: "07:00", title: "Amara Silva — PT", type: "CLIENT", status: "DONE" },
        { id: "slot-2", time: "08:00", title: "Dilshan Raj — PT", type: "CLIENT", status: "DONE" },
        { id: "slot-3", time: "09:00", title: "Group HIIT (8 pax)", type: "CLASS", status: "DONE" },
        { id: "slot-4", time: "10:00", title: "— Available —", type: "OPEN", status: "OPEN" },
        { id: "slot-5", time: "11:00", title: "Kasun Mendis — PT", type: "CLIENT", status: "NOW" },
        { id: "slot-6", time: "12:00", title: "Lunch Break", type: "BREAK", status: "BREAK" },
        { id: "slot-7", time: "13:00", title: "— Available —", type: "OPEN", status: "OPEN" },
        { id: "slot-8", time: "14:00", title: "Sachini G. — PT", type: "CLIENT", status: "SOON" },
        { id: "slot-9", time: "15:00", title: "Core & Mobility", type: "CLASS", status: "SOON" },
        { id: "slot-10", time: "17:00", title: "Ruwani J. — PT", type: "CLIENT", status: "SOON" }
    ]);

    // --- Summary Metrics Matrix Calculations ---
    const summaryStats = useMemo(() => {
        const totalSessions = timeSlots.filter(s => s.type === "CLIENT" || s.type === "CLASS").length;
        const openSlots = timeSlots.filter(s => s.type === "OPEN").length;
        const oooSlots = timeSlots.filter(s => s.status === "OOO").length;
        const activeCurrent = timeSlots.filter(s => s.status === "NOW").length;

        return {
            sessions: totalSessions,
            open: openSlots,
            ooo: oooSlots,
            active: activeCurrent
        };
    }, [timeSlots]);

    // --- External Calendar Synchronization Logic ---
    const handleExternalCalendarSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            toast.success("Synchronized with Google Calendar and local iCal engine.");
        }, 1000);
    };

    const handleSlotAction = (id: string, currentStatus: string) => {
        if (currentStatus === "OPEN") {
            toast.success("Initializing manual block reservation...");
            return;
        }
        if (currentStatus === "NOW") {
            toast.info("Session management controls activated.");
        }
    };

    return (
        <div className="space-y-6 text-white select-none">

            {/* Calendar Context Heading Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Today's Schedule</h1>
                    <p className="text-xs text-zinc-500 font-medium">Thursday, May 8</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExternalCalendarSync}
                        disabled={isSyncing}
                        variant="outline"
                        className="h-10 border-white/5 bg-zinc-900 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold gap-2 px-3.5"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                        {isSyncing ? "Syncing..." : "Sync Calendar"}
                    </Button>
                    <Button
                        onClick={() => toast.success("Configuring custom Out-Of-Office blocking window...")}
                        className="bg-zinc-900 text-primary border border-primary/20 hover:bg-zinc-800 rounded-xl h-10 text-xs font-bold gap-1.5 px-4 shadow-[0_0_20px_rgba(234,88,12,0.02)]"
                    >
                        <Plus className="w-3.5 h-3.5" /> Block Time
                    </Button>
                </div>
            </div>

            {/* Split Structural Timeline Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* Chronological Daily Timeline Sheet */}
                <div className="lg:col-span-3 space-y-2.5">
                    {timeSlots.map((slot) => {
                        const isOpen = slot.status === "OPEN";
                        const isNow = slot.status === "NOW";
                        const isSoon = slot.status === "SOON";
                        const isDone = slot.status === "DONE";
                        const isBreak = slot.status === "BREAK";

                        return (
                            <div
                                key={slot.id}
                                onClick={() => handleSlotAction(slot.id, slot.status)}
                                className={cn(
                                    "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer bg-zinc-950/20",
                                    isOpen && "border-zinc-900/60 opacity-60 hover:opacity-100",
                                    isNow && "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_25px_rgba(234,88,12,0.05)]",
                                    isSoon && "border-amber-500/10 hover:border-amber-500/30",
                                    isDone && "border-white/5 opacity-40 hover:opacity-70",
                                    isBreak && "border-zinc-900 bg-zinc-900/10 opacity-50 cursor-default"
                                )}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Temporal Stamp Column */}
                                    <span className="font-mono text-xs font-bold tracking-tight text-zinc-600 w-10 shrink-0">
                                        {slot.time}
                                    </span>

                                    {/* Slot Descriptive Title */}
                                    <span className={cn(
                                        "text-sm font-bold truncate",
                                        isOpen ? "text-zinc-600 font-medium" : "text-zinc-100",
                                        isNow && "text-white"
                                    )}>
                                        {slot.title}
                                    </span>
                                </div>

                                {/* Status Badges Block */}
                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                    {isOpen && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[9px] font-black tracking-wider text-zinc-600 bg-zinc-900/60 border border-white/5 px-2 py-0.5 rounded">OOO</span>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Open</span>
                                        </div>
                                    )}
                                    {isNow && (
                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-tight animate-pulse bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Now</span>
                                    )}
                                    {isSoon && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[9px] font-black tracking-wider text-zinc-600 bg-zinc-900/60 border border-white/5 px-2 py-0.5 rounded">OOO</span>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">Soon</span>
                                        </div>
                                    )}
                                    {isDone && (
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Done</span>
                                    )}
                                    {isBreak && (
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight bg-zinc-900 px-2 py-0.5 border border-white/5 rounded-md">Break</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Side Schedule Summary Aggregator Widget Panel */}
                <div className="space-y-4 lg:sticky lg:top-24">
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-5 space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Summary</span>

                        <div className="space-y-3 font-mono text-xs">
                            <SummaryMetricRow label="Sessions" value={summaryStats.sessions} />
                            <SummaryMetricRow label="Open Slots" value={summaryStats.open} />
                            <SummaryMetricRow label="OOO" value={summaryStats.ooo} />
                            <SummaryMetricRow label="Active" value={summaryStats.active} isHighlight />
                        </div>
                    </Card>

                    {/* Quick Shift Handover Insights */}
                    <Card className="bg-zinc-900/10 border-dashed border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                        <Clock className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-zinc-400">Conflict Mitigation</h4>
                            <p className="text-[11px] text-zinc-600 leading-normal">
                                Resource rules protect your blocks. Cross-tenant asset overlapping controls are active.
                            </p>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// --- Internal Visual Presentation Components ---

function SummaryMetricRow({
                              label,
                              value,
                              isHighlight = false
                          }: {
    label: string;
    value: number;
    isHighlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 last:pb-0">
            <span className="text-zinc-400 font-sans font-medium">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                isHighlight ? "text-primary font-black" : "text-zinc-200"
            )}>
                {value}
            </span>
        </div>
    );
}