// components/tenant/admin/settings/ProgramTemplates.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Loader2, Plus, Trash2, X, Sparkles, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SectionHeader } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import { cn } from "@/lib/utils";

interface ProgramTemplatesProps {
    tenantId: string;
    onComplete: () => void;
}

interface ExerciseItem {
    name: string;
    sets: number;
    reps: number;
    muscleGroup: string;
}

interface RoutineItem {
    dayName: string;
    exercises: ExerciseItem[];
}

interface TemplateFormData {
    id?: string;
    name: string;
    goal: string;
    totalWeeks: number;
    routines: RoutineItem[];
}

export function ProgramTemplates({ tenantId, onComplete }: ProgramTemplatesProps) {
    const queryClient = useQueryClient();

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        name: "",
        goal: "",
        totalWeeks: 12,
        routines: [{ dayName: "Day 1", exercises: [{ name: "", sets: 3, reps: 10, muscleGroup: "All" }] }]
    });

    const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
        queryKey: ["programTemplates", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/program-templates", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        }
    });

    const saveTemplateMutation = useMutation({
        mutationFn: async (data: TemplateFormData) => {
            const headers = { "X-Tenant-ID": tenantId, "Content-Type": "application/json" };
            const isEdit = !!data.id;
            const url = isEdit ? `/api/v1/program-templates/${data.id}` : `/api/v1/program-templates`;

            const res = await striveClientFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers,
                body: JSON.stringify({
                    name: data.name,
                    goal: data.goal,
                    totalWeeks: data.totalWeeks,
                    routines: data.routines.map((r, idx) => ({
                        id: `routine-${idx}`,
                        dayName: r.dayName,
                        exercises: r.exercises.filter(ex => ex.name.trim() !== "").map(ex => ({
                            name: ex.name,
                            sets: ex.sets,
                            reps: ex.reps,
                            muscleGroup: ex.muscleGroup || "All"
                        }))
                    }))
                })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast.success(`Program template ${formData.id ? "updated" : "created"} successfully.`);
            queryClient.invalidateQueries({ queryKey: ["programTemplates", tenantId] });
            setIsSidebarOpen(false);
        },
        onError: (err: any) => toast.error(`Failed to save program template: ${err.message}`)
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            const headers = { "X-Tenant-ID": tenantId };
            const res = await striveClientFetch(`/api/v1/program-templates/${templateId}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error("Failed to delete template");
        },
        onSuccess: () => {
            toast.success("Program template deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["programTemplates", tenantId] });
        },
        onError: (err: any) => toast.error(`Failed to delete template: ${err.message}`)
    });

    // --- Handlers ---

    const openSidebarForAdd = () => {
        setFormData({
            name: "",
            goal: "",
            totalWeeks: 12,
            routines: [{ dayName: "Day 1", exercises: [{ name: "", sets: 3, reps: 10, muscleGroup: "All" }] }]
        });
        setIsSidebarOpen(true);
    };

    const openSidebarForEdit = (template: any) => {
        let routinesList: RoutineItem[] = [];
        try {
            routinesList = typeof template.routines === "string" 
                ? JSON.parse(template.routines) 
                : template.routines || [];
        } catch {
            routinesList = [];
        }

        if (routinesList.length === 0) {
            routinesList = [{ dayName: "Day 1", exercises: [{ name: "", sets: 3, reps: 10, muscleGroup: "All" }] }];
        }

        setFormData({
            id: template.id,
            name: template.name,
            goal: template.goal,
            totalWeeks: template.totalWeeks,
            routines: routinesList
        });
        setIsSidebarOpen(true);
    };

    const handleAddRoutineDay = () => {
        setFormData(prev => ({
            ...prev,
            routines: [...prev.routines, { dayName: `Day ${prev.routines.length + 1}`, exercises: [{ name: "", sets: 3, reps: 10, muscleGroup: "All" }] }]
        }));
    };

    const handleRemoveRoutineDay = (rIdx: number) => {
        setFormData(prev => ({
            ...prev,
            routines: prev.routines.filter((_, idx) => idx !== rIdx)
        }));
    };

    const handleAddExerciseRow = (rIdx: number) => {
        setFormData(prev => {
            const nextRoutines = [...prev.routines];
            nextRoutines[rIdx].exercises.push({ name: "", sets: 3, reps: 10, muscleGroup: "All" });
            return { ...prev, routines: nextRoutines };
        });
    };

    const handleRemoveExerciseRow = (rIdx: number, eIdx: number) => {
        setFormData(prev => {
            const nextRoutines = [...prev.routines];
            nextRoutines[rIdx].exercises = nextRoutines[rIdx].exercises.filter((_, idx) => idx !== eIdx);
            return { ...prev, routines: nextRoutines };
        });
    };

    const handleExerciseChange = (rIdx: number, eIdx: number, field: keyof ExerciseItem, value: any) => {
        setFormData(prev => {
            const nextRoutines = [...prev.routines];
            nextRoutines[rIdx].exercises[eIdx] = {
                ...nextRoutines[rIdx].exercises[eIdx],
                [field]: value
            };
            return { ...prev, routines: nextRoutines };
        });
    };

    const handleRoutineDayChange = (rIdx: number, value: string) => {
        setFormData(prev => {
            const nextRoutines = [...prev.routines];
            nextRoutines[rIdx].dayName = value;
            return { ...prev, routines: nextRoutines };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Please provide a template name.");
            return;
        }
        if (!formData.goal.trim()) {
            toast.error("Please provide a program goal.");
            return;
        }
        saveTemplateMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader title="Workout Program Templates" desc="Manage reusable multi-week program structures that trainers can assign to clients." />
                <Button onClick={openSidebarForAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 gap-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Program Blueprint
                </Button>
            </div>

            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                {templatesLoading ? (
                    <div className="p-12 flex justify-center items-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm font-medium">
                        No program blueprints created yet. Set up workout structures for your team to use.
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/15 border-b border-border">
                            <TableRow>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3 pl-4">Program Blueprint</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3">Goal</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3">Duration</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3">Workout Schedule</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3 text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {templates.map((tpl) => {
                                const routinesList = typeof tpl.routines === "string" ? JSON.parse(tpl.routines) : tpl.routines || [];
                                return (
                                    <TableRow key={tpl.id} className="hover:bg-muted/5 transition-colors">
                                        <TableCell className="font-bold text-foreground py-4 pl-4 text-sm">{tpl.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4">{tpl.goal}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4 font-mono font-bold">{tpl.totalWeeks} Weeks</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4 max-w-md">
                                            <div className="flex flex-wrap gap-2">
                                                {routinesList.map((r: any, rIdx: number) => (
                                                    <div key={rIdx} className="bg-secondary/40 border border-border/60 px-2.5 py-1 rounded-lg">
                                                        <span className="font-bold text-[10px] text-primary block mb-0.5">{r.dayName}</span>
                                                        <span className="text-[9px] font-medium text-muted-foreground">
                                                            {r.exercises?.length || 0} exercises
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button onClick={() => openSidebarForEdit(tpl)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button onClick={() => deleteTemplateMutation.mutate(tpl.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Sidebar Slide-Over form */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border-l border-border w-full max-w-xl h-full flex flex-col p-6 shadow-2xl relative animate-in slide-in-from-right duration-300">
                        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1 mb-6">
                            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-1.5">
                                <ClipboardList className="w-4.5 h-4.5 text-primary" /> {formData.id ? "Edit Program Blueprint" : "Create Program Blueprint"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Define routine splits, targets, and exercise goals to save as a reusable catalog template.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                            <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-bold">Program Name</Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Strength Blast"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-background border-border h-10 text-sm rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-bold">Goal</Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Hypertrophy"
                                            value={formData.goal}
                                            onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                            className="bg-background border-border h-10 text-sm rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-bold">Duration (Weeks)</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.totalWeeks}
                                            onChange={(e) => setFormData(prev => ({ ...prev, totalWeeks: Number(e.target.value) || 12 }))}
                                            className="bg-background border-border h-10 text-sm rounded-md font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground font-bold">RoutinesSplit & Days</Label>
                                        <Button type="button" onClick={handleAddRoutineDay} variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase tracking-wider border-border bg-card hover:bg-accent text-primary px-2.5 rounded">
                                            + Add Workout Day
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.routines.map((routine, rIdx) => (
                                            <div key={rIdx} className="p-4 bg-muted/15 border border-border rounded-xl space-y-3">
                                                <div className="flex justify-between items-center gap-4">
                                                    <input
                                                        type="text"
                                                        value={routine.dayName}
                                                        onChange={(e) => handleRoutineDayChange(rIdx, e.target.value)}
                                                        className="bg-transparent border-b border-border/80 text-sm font-bold text-primary focus-visible:outline-none w-48 pb-0.5"
                                                        placeholder="e.g. Day 1: Legs"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleAddExerciseRow(rIdx)}
                                                            className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/60 hover:bg-accent/40 bg-card rounded-md px-2"
                                                        >
                                                            + Add Exercise
                                                        </Button>
                                                        {formData.routines.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => handleRemoveRoutineDay(rIdx)}
                                                                className="h-7 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 rounded-md px-2"
                                                            >
                                                                Remove Day
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {routine.exercises.map((ex, eIdx) => (
                                                        <div key={eIdx} className="grid grid-cols-12 gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Exercise Name"
                                                                value={ex.name}
                                                                onChange={(e) => handleExerciseChange(rIdx, eIdx, "name", e.target.value)}
                                                                className="col-span-6 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold focus-visible:outline-primary"
                                                                required
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Sets"
                                                                value={ex.sets}
                                                                onChange={(e) => handleExerciseChange(rIdx, eIdx, "sets", Number(e.target.value) || 0)}
                                                                className="col-span-2 h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono font-bold text-center focus-visible:outline-primary"
                                                                required
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Reps"
                                                                value={ex.reps}
                                                                onChange={(e) => handleExerciseChange(rIdx, eIdx, "reps", Number(e.target.value) || 0)}
                                                                className="col-span-2 h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono font-bold text-center focus-visible:outline-primary"
                                                                required
                                                            />
                                                            <div className="col-span-2 text-right">
                                                                {routine.exercises.length > 1 && (
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => handleRemoveExerciseRow(rIdx, eIdx)}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 px-2 rounded-lg"
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 mt-auto flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsSidebarOpen(false)} className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saveTemplateMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl gap-2">
                                    {saveTemplateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Save Blueprint
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
