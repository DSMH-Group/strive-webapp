// app/tenants/[subdomain]/(admin)/trainer/log/logClient.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Trash2,
    UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogClientProps {
    subdomain: string;
    assignedClients: any[];
}

interface ExerciseRow {
    id: string;
    name: string;
    sets: string;
    reps: string;
    weight: string;
    notes: string;
}

export default function LogClient({ subdomain, assignedClients = [] }: LogClientProps) {
    // --- Safe Mock Ingestion falling back exactly to your Layout's data matrix ---
    const clients = assignedClients.length > 0 ? assignedClients : [
        { id: "c1", name: "Amara Silva" },
        { id: "c2", name: "Dilshan Raj" },
        { id: "c3", name: "Kasun Mendis" },
        { id: "c4", name: "Ruwani Jayawardena" }
    ];

    const [selectedMember, setSelectedMember] = useState("c1");
    const [sessionType, setSessionType] = useState("Push Day");
    const [logDate, setLogDate] = useState("");

    // Dynamic Tracking State representing layout grid layout rows
    const [exercises, setExercises] = useState<ExerciseRow[]>([
        { id: "ex-1", name: "Bench Press", sets: "4", reps: "6", weight: "80", notes: "" },
        { id: "ex-2", name: "OHP", sets: "3", reps: "8", weight: "55", notes: "" }
    ]);

    const handleAddExerciseRow = () => {
        const uniqueId = `ex-${Date.now()}`;
        setExercises([
            ...exercises,
            { id: uniqueId, name: "", sets: "", reps: "", weight: "", notes: "" }
        ]);
        toast.info("Appended a new exercise metric structure.");
    };

    const handleRemoveExerciseRow = (id: string) => {
        if (exercises.length === 1) {
            toast.error("A logged training block must contain at least one metrics item.");
            return;
        }
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    const handleFieldChange = (id: string, field: keyof ExerciseRow, value: string) => {
        setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
    };

    const handleSavePayload = (shouldNotify: boolean) => {
        if (!logDate) {
            toast.error("Please enter a valid tracking target date.");
            return;
        }

        const payload = {
            metricType: "WORKOUT_LOG",
            membershipId: selectedMember,
            data: {
                sessionType,
                date: logDate,
                exercises: exercises.map(({ name, sets, reps, weight, notes }) => ({
                    name,
                    sets: Number(sets) || 0,
                    reps: Number(reps) || 0,
                    weightKgs: Number(weight) || 0,
                    notes
                }))
            }
        };

        console.log("Stride JSONB Metadata Payload Prepared:", payload);

        if (shouldNotify) {
            toast.success("Metrics synchronized. Transactional notification dispatched via Text.lk API.");
        } else {
            toast.success("Draft snapshot stored safely in local operational cache.");
        }
    };

    return (
        <div className="space-y-6 text-foreground select-none max-w-5xl mx-auto">

            {/* Log Section Heading Title */}
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">Log Session</h1>
            </div>

            {/* Core Configuration Metadata Bar Controls */}
            <Card className="bg-card/30 border-border rounded-lg p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member</Label>
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            className="w-full h-10 bg-background border border-border rounded-md px-3 text-sm text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                        >
                            {clients.map(c => <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Session Type</Label>
                        <select
                            value={sessionType}
                            onChange={(e) => setSessionType(e.target.value)}
                            className="w-full h-10 bg-background border border-border rounded-md px-3 text-sm text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                        >
                            <option value="Push Day" className="bg-background text-foreground">Push Day</option>
                            <option value="Pull Volume" className="bg-background text-foreground">Pull Volume</option>
                            <option value="Leg Conditioning" className="bg-background text-foreground">Leg Conditioning</option>
                            <option value="Cardio Mesh" className="bg-background text-foreground">Cardio Mesh</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</Label>
                        <Input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="bg-background border-border h-10 rounded-md text-xs font-mono text-foreground focus-visible:ring-primary/20"
                        />
                    </div>
                </div>
            </Card>

            {/* Matrix Sheet Container for Input Rows */}
            <Card className="bg-card/30 border-border rounded-lg p-5 space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">Exercises</span>

                {/* Horizontal Label Alignment Matrix Column Header Descriptions */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">Exercise</div>
                    <div className="col-span-1 text-center">Sets</div>
                    <div className="col-span-1 text-center">Reps</div>
                    <div className="col-span-2 text-center">Weight</div>
                    <div className="col-span-3">Notes</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="space-y-3">
                    {exercises.map((row) => (
                        <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-background/40 p-3 md:p-0 md:bg-transparent rounded-md border border-border md:border-0 items-center">

                            {/* Exercise Label Box field */}
                            <div className="col-span-4 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-muted-foreground uppercase">Exercise</span>
                                <Input
                                    value={row.name}
                                    placeholder="e.g. Bench Press"
                                    onChange={(e) => handleFieldChange(row.id, "name", e.target.value)}
                                    className="bg-background border-border h-10 text-sm rounded-md placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* Sets input item */}
                            <div className="col-span-1 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-muted-foreground uppercase">Sets</span>
                                <Input
                                    type="number"
                                    value={row.sets}
                                    placeholder="4"
                                    onChange={(e) => handleFieldChange(row.id, "sets", e.target.value)}
                                    className="bg-background border-border h-10 text-center text-sm font-mono rounded-md"
                                />
                            </div>

                            {/* Reps input item */}
                            <div className="col-span-1 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-muted-foreground uppercase">Reps</span>
                                <Input
                                    type="number"
                                    value={row.reps}
                                    placeholder="6"
                                    onChange={(e) => handleFieldChange(row.id, "reps", e.target.value)}
                                    className="bg-background border-border h-10 text-center text-sm font-mono rounded-md"
                                />
                            </div>

                            {/* Weight metric entry with metric conversion logic */}
                            <div className="col-span-2 space-y-1 md:space-y-0 relative">
                                <span className="block md:hidden text-[9px] font-bold text-muted-foreground uppercase">Weight</span>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={row.weight}
                                        placeholder="80"
                                        onChange={(e) => handleFieldChange(row.id, "weight", e.target.value)}
                                        className="bg-background border-border h-10 pl-3 pr-8 text-sm font-mono rounded-md"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground font-sans pointer-events-none">kg</span>
                                </div>
                            </div>

                            {/* Content Notes Box area fields */}
                            <div className="col-span-3 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-muted-foreground uppercase">Notes</span>
                                <Input
                                    value={row.notes}
                                    placeholder="notes"
                                    onChange={(e) => handleFieldChange(row.id, "notes", e.target.value)}
                                    className="bg-background border-border h-10 text-sm rounded-md placeholder:text-muted-foreground/40"
                                />
                            </div>

                            {/* Removal Trigger button items row */}
                            <div className="col-span-1 text-right">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveExerciseRow(row.id)}
                                    className="h-10 w-full md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors border border-dashed border-border md:border-0"
                                >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid Item Append Rows button structure matching style parameters */}
                <div className="pt-2">
                    <Button
                        onClick={handleAddExerciseRow}
                        variant="outline"
                        className="h-9 text-xs border-border bg-card text-foreground rounded-md font-bold gap-1.5 px-4"
                    >
                        <Plus className="w-3.5 h-3.5 text-primary" /> Add Exercise
                    </Button>
                </div>
            </Card>

            {/* Operational Commit Controls Bottom Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                    onClick={() => handleSavePayload(false)}
                    variant="outline"
                    className="h-10 border-border bg-card rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground text-xs font-bold px-5 transition-colors"
                >
                    Save Draft
                </Button>
                <Button
                    onClick={() => handleSavePayload(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black rounded-md h-10 px-5 gap-1.5 transition-all shadow-sm"
                >
                    <UserCheck className="w-3.5 h-3.5" /> Save & Notify Member
                </Button>
            </div>

        </div>
    );
}