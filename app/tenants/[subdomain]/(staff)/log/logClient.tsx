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
    FileText,
    UserCheck,
    Save,
    Dumbbell
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
    // --- Safe Mock Ingestion falling back exactly to your Layout's state data ---
    const clients = assignedClients.length > 0 ? assignedClients : [
        { id: "c1", name: "Amara Silva" },
        { id: "c2", name: "Dilshan Raj" },
        { id: "c3", name: "Kasun Mendis" },
        { id: "c4", name: "Ruwani Jayawardena" }
    ];

    const [selectedMember, setSelectedMember] = useState("c1");
    const [sessionType, setSessionType] = useState("Push Day");
    const [logDate, setLogDate] = useState("");

    // Dynamic Tracking State representing your layout grid layout rows
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
        // Enforces client-side semantic checks mapping to validation boundaries
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
        <div className="space-y-6 text-white select-none max-w-5xl mx-auto">

            {/* Log Section Heading Title */}
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">Log Session</h1>
            </div>

            {/* Core Configuration Metadata Bar Controls */}
            <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Member</Label>
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            className="w-full h-10 bg-zinc-950 border border-white/5 rounded-xl px-3 text-sm text-zinc-200 font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                        >
                            {clients.map(c => <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Session Type</Label>
                        <select
                            value={sessionType}
                            onChange={(e) => setSessionType(e.target.value)}
                            className="w-full h-10 bg-zinc-950 border border-white/5 rounded-xl px-3 text-sm text-zinc-200 font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                        >
                            <option value="Push Day" className="bg-zinc-950 text-white">Push Day</option>
                            <option value="Pull Volume" className="bg-zinc-950 text-white">Pull Volume</option>
                            <option value="Leg Conditioning" className="bg-zinc-950 text-white">Leg Conditioning</option>
                            <option value="Cardio Mesh" className="bg-zinc-950 text-white">Cardio Mesh</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</Label>
                        <Input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="bg-zinc-950 border-white/5 h-10 rounded-xl text-xs font-mono text-zinc-300 focus-visible:ring-primary/20 inverted-colors-picker"
                        />
                    </div>
                </div>
            </Card>

            {/* Matrix Sheet Container for Input Rows */}
            <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block border-b border-white/5 pb-2">Exercises</span>

                {/* Horizontal Label Alignment Matrix Column Header Descriptions */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-4">Exercise</div>
                    <div className="col-span-1 text-center">Sets</div>
                    <div className="col-span-1 text-center">Reps</div>
                    <div className="col-span-2 text-center">Weight</div>
                    <div className="col-span-3">Notes</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="space-y-3">
                    {exercises.map((row) => (
                        <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-950/40 p-3 md:p-0 md:bg-transparent rounded-xl border border-white/5 md:border-0 items-center">

                            {/* Exercise Label Box field */}
                            <div className="col-span-4 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-zinc-600 uppercase">Exercise</span>
                                <Input
                                    value={row.name}
                                    placeholder="e.g. Bench Press"
                                    onChange={(e) => handleFieldChange(row.id, "name", e.target.value)}
                                    className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Sets input item */}
                            <div className="col-span-1 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-zinc-600 uppercase">Sets</span>
                                <Input
                                    type="number"
                                    value={row.sets}
                                    placeholder="4"
                                    onChange={(e) => handleFieldChange(row.id, "sets", e.target.value)}
                                    className="bg-zinc-950 border-white/5 h-10 text-center text-sm font-mono rounded-xl"
                                />
                            </div>

                            {/* Reps input item */}
                            <div className="col-span-1 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-zinc-600 uppercase">Reps</span>
                                <Input
                                    type="number"
                                    value={row.reps}
                                    placeholder="6"
                                    onChange={(e) => handleFieldChange(row.id, "reps", e.target.value)}
                                    className="bg-zinc-950 border-white/5 h-10 text-center text-sm font-mono rounded-xl"
                                />
                            </div>

                            {/* Weight metric entry with metric conversion logic formatting markers */}
                            <div className="col-span-2 space-y-1 md:space-y-0 relative">
                                <span className="block md:hidden text-[9px] font-bold text-zinc-600 uppercase">Weight</span>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={row.weight}
                                        placeholder="80"
                                        onChange={(e) => handleFieldChange(row.id, "weight", e.target.value)}
                                        className="bg-zinc-950 border-white/5 h-10 pl-3 pr-8 text-sm font-mono rounded-xl"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-600 font-sans pointer-events-none">kg</span>
                                </div>
                            </div>

                            {/* Content Notes Box area fields */}
                            <div className="col-span-3 space-y-1 md:space-y-0">
                                <span className="block md:hidden text-[9px] font-bold text-zinc-600 uppercase">Notes</span>
                                <Input
                                    value={row.notes}
                                    placeholder="notes"
                                    onChange={(e) => handleFieldChange(row.id, "notes", e.target.value)}
                                    className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Removal Trigger button items row */}
                            <div className="col-span-1 text-right">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveExerciseRow(row.id)}
                                    className="h-10 w-full md:w-10 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors border border-dashed border-white/5 md:border-0"
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
                        variant="ghost"
                        className="h-9 text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-dashed border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl px-4 gap-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Exercise
                    </Button>
                </div>
            </Card>

            {/* Operational Commit Controls Bottom Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                    onClick={() => handleSavePayload(false)}
                    variant="outline"
                    className="h-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-white/5 text-xs font-bold rounded-xl px-5 transition-colors"
                >
                    Save Draft
                </Button>
                <Button
                    onClick={() => handleSavePayload(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl h-10 px-5 gap-1.5 transition-all shadow-md shadow-amber-500/5"
                >
                    <UserCheck className="w-3.5 h-3.5" /> Save & Notify Member
                </Button>
            </div>

        </div>
    );
}