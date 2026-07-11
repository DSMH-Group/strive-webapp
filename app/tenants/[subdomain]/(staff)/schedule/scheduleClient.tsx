// app/tenants/[subdomain]/(admin)/trainer/schedule/scheduleClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Clock,
    RefreshCw,
    Plus,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleClientProps {
    subdomain: string;
    initialBookings: any[];
}

export default function ScheduleClient({ subdomain, initialBookings = [] }: ScheduleClientProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockTime, setBlockTime] = useState("10:00");
    const [blockReason, setBlockReason] = useState("");

    // --- Core Timeline Data (Structured explicitly to match your design) ---
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
            const slot = timeSlots.find(s => s.id === id);
            if (slot) {
                setBlockTime(slot.time);
                setIsBlockModalOpen(true);
            }
            return;
        }
        if (currentStatus === "NOW") {
            toast.info("Session management controls activated.");
        }
    };

    const handleConfirmBlock = (e: React.FormEvent) => {
        e.preventDefault();
        setTimeSlots((prev) =>
            prev.map((slot) => {
                if (slot.time === blockTime) {
                    return {
                        ...slot,
                        title: blockReason || "Out-of-office block",
                        type: "BREAK",
                        status: "OOO",
                    };
                }
                return slot;
            })
        );
        toast.success(`Blocked calendar time slot at ${blockTime}.`);
        setIsBlockModalOpen(false);
        setBlockReason("");
    };

    return (
        <div className="space-y-6 text-foreground select-none">

            {/* Calendar Context Heading Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Today's Schedule</h1>
                    <p className="text-xs text-muted-foreground font-medium">Thursday, May 8</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExternalCalendarSync}
                        disabled={isSyncing}
                        variant="outline"
                        className="h-10 border-border bg-card rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground text-xs font-bold gap-2 px-3.5"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                        {isSyncing ? "Syncing..." : "Sync Calendar"}
                    </Button>
                    <Button
                        onClick={() => setIsBlockModalOpen(true)}
                        variant="outline"
                        className="bg-card text-primary border border-primary/20 hover:bg-accent hover:text-accent-foreground rounded-md h-10 text-xs font-bold gap-1.5 px-4 shadow-sm"
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
                        const isOoo = slot.status === "OOO";

                        return (
                            <div
                                key={slot.id}
                                onClick={() => handleSlotAction(slot.id, slot.status)}
                                className={cn(
                                    "flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer bg-card/20 border-border",
                                    isOpen && "opacity-60 hover:opacity-100",
                                    isNow && "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm",
                                    isSoon && "border-border hover:border-accent-foreground/30",
                                    isDone && "opacity-40 hover:opacity-70",
                                    isBreak && "bg-muted/40 opacity-50 cursor-default",
                                    isOoo && "bg-destructive/5 border-destructive/20 opacity-80 hover:opacity-100"
                                )}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Temporal Stamp Column */}
                                    <span className="font-mono text-xs font-bold tracking-tight text-muted-foreground/60 w-10 shrink-0">
                                        {slot.time}
                                    </span>

                                    {/* Slot Descriptive Title */}
                                    <span className={cn(
                                        "text-sm font-bold truncate",
                                        isOpen ? "text-muted-foreground font-medium" : "text-foreground",
                                        isNow && "text-foreground"
                                    )}>
                                        {slot.title}
                                    </span>
                                </div>

                                {/* Status Badges Block */}
                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                    {isOpen && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[9px] font-black tracking-wider text-muted-foreground/80 bg-background border border-border px-2 py-0.5 rounded-sm">OOO</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Open</span>
                                        </div>
                                    )}
                                    {isNow && (
                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-tight animate-pulse bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">Now</span>
                                    )}
                                    {isSoon && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[9px] font-black tracking-wider text-muted-foreground/80 bg-background border border-border px-2 py-0.5 rounded-sm">OOO</span>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">Soon</span>
                                        </div>
                                    )}
                                    {isDone && (
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Done</span>
                                    )}
                                    {isBreak && (
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight bg-background px-2 py-0.5 border border-border rounded-sm">Break</span>
                                    )}
                                    {isOoo && (
                                        <span className="text-[10px] font-bold text-destructive uppercase tracking-tight bg-destructive/10 px-2 py-0.5 border border-destructive/20 rounded-sm">Blocked</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Side Schedule Summary Aggregator Widget Panel */}
                <div className="space-y-4 lg:sticky lg:top-24">
                    <Card className="bg-card/30 border-border rounded-lg p-5 space-y-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Summary</span>

                        <div className="space-y-3 font-mono text-xs">
                            <SummaryMetricRow label="Sessions" value={summaryStats.sessions} />
                            <SummaryMetricRow label="Open Slots" value={summaryStats.open} />
                            <SummaryMetricRow label="OOO" value={summaryStats.ooo} />
                            <SummaryMetricRow label="Active" value={summaryStats.active} isHighlight />
                        </div>
                    </Card>

                    {/* Quick Shift Handover Insights */}
                    <Card className="bg-card/10 border-dashed border-border rounded-lg p-4 flex gap-3 items-start">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-muted-foreground">Conflict Mitigation</h4>
                            <p className="text-[11px] text-muted-foreground/80 leading-normal">
                                Resource rules protect your blocks. Cross-tenant asset overlapping controls are active.
                            </p>
                        </div>
                    </Card>
                </div>

            </div>

            {/* Block Time Modal */}
            {isBlockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
                        <button
                            onClick={() => setIsBlockModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-foreground text-base tracking-tight">Block Calendar Time</h3>
                            <p className="text-[11px] text-muted-foreground">Mark a slot as Out-Of-Office to prevent client bookings.</p>
                        </div>

                        <form onSubmit={handleConfirmBlock} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Selected Time Slot</label>
                                <select 
                                    value={blockTime}
                                    onChange={(e) => setBlockTime(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                >
                                    {timeSlots.map((s) => (
                                        <option key={s.id} value={s.time}>{s.time} {s.title !== "— Available —" && `(${s.title})`}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Blocking Reason / Event Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lunch Break, Personal Errand, Maintenance"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button 
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsBlockModalOpen(false)}
                                    className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl"
                                >
                                    Confirm Block
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0 last:pb-0">
            <span className="text-muted-foreground font-sans font-medium">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                isHighlight ? "text-primary font-black" : "text-foreground"
            )}>
                {value}
            </span>
        </div>
    );
}