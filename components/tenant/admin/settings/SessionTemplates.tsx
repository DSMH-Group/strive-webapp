// components/tenant/admin/settings/SessionTemplates.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Loader2, Plus, Trash2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SectionHeader } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import { cn } from "@/lib/utils";
import { ExerciseCombobox } from "@/app/tenants/[subdomain]/(staff)/log/_components/ExerciseCombobox";

interface SessionTemplatesProps {
    tenantId: string;
    onComplete: () => void;
}

interface ExerciseItem {
    name: string;
    sets: number;
}

interface TemplateFormData {
    id?: string;
    name: string;
    exercises: ExerciseItem[];
}

export function SessionTemplates({ tenantId, onComplete }: SessionTemplatesProps) {
    const queryClient = useQueryClient();

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({ name: "", exercises: [{ name: "", sets: 3 }] });

    // --- API Interactions ---

    // Get Exercise Bank library
    const { data: dbExercises = [] } = useQuery<any[]>({
        queryKey: ["settingsExerciseBank", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/exercises", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    const exerciseLibraryNames = React.useMemo(() => {
        return dbExercises.map((ex: any) => ex.name);
    }, [dbExercises]);

    const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
        queryKey: ["sessionTemplates", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/session-templates", {
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
            const url = isEdit ? `/api/v1/session-templates/${data.id}` : `/api/v1/session-templates`;

            const res = await striveClientFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers,
                body: JSON.stringify({
                    name: data.name,
                    exercises: data.exercises.filter(ex => ex.name.trim() !== "")
                })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast.success(`Template ${formData.id ? "updated" : "created"} successfully.`);
            queryClient.invalidateQueries({ queryKey: ["sessionTemplates", tenantId] });
            setIsSidebarOpen(false);
        },
        onError: (err: any) => toast.error(`Failed to save template: ${err.message}`)
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            const headers = { "X-Tenant-ID": tenantId };
            const res = await striveClientFetch(`/api/v1/session-templates/${templateId}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error("Failed to delete template");
        },
        onSuccess: () => {
            toast.success("Template deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["sessionTemplates", tenantId] });
        },
        onError: (err: any) => toast.error(`Failed to delete template: ${err.message}`)
    });

    // --- Handlers ---

    const openSidebarForAdd = () => {
        setFormData({ name: "", exercises: [{ name: "", sets: 3 }] });
        setIsSidebarOpen(true);
    };

    const openSidebarForEdit = (template: any) => {
        let exercisesList: ExerciseItem[] = [];
        try {
            exercisesList = typeof template.exercises === "string" 
                ? JSON.parse(template.exercises) 
                : template.exercises || [];
        } catch {
            exercisesList = [];
        }

        if (exercisesList.length === 0) {
            exercisesList = [{ name: "", sets: 3 }];
        }

        setFormData({
            id: template.id,
            name: template.name,
            exercises: exercisesList
        });
        setIsSidebarOpen(true);
    };

    const handleAddExerciseRow = () => {
        setFormData(prev => ({
            ...prev,
            exercises: [...prev.exercises, { name: "", sets: 3 }]
        }));
    };

    const handleRemoveExerciseRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            exercises: prev.exercises.filter((_, idx) => idx !== index)
        }));
    };

    const handleExerciseChange = (index: number, field: keyof ExerciseItem, value: any) => {
        setFormData(prev => {
            const nextExercises = [...prev.exercises];
            nextExercises[index] = {
                ...nextExercises[index],
                [field]: value
            };
            return {
                ...prev,
                exercises: nextExercises
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Please provide a template name.");
            return;
        }
        if (formData.exercises.filter(ex => ex.name.trim() !== "").length === 0) {
            toast.error("Please add at least one exercise.");
            return;
        }
        saveTemplateMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader title="Session Templates" desc="Manage reusable workout blueprints that trainers can apply instantly during PT sessions." />
                <Button onClick={openSidebarForAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 gap-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Template
                </Button>
            </div>

            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                {templatesLoading ? (
                    <div className="p-12 flex justify-center items-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm font-medium">
                        No session templates created yet. Set up workout structures for your trainers to use.
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/15 border-b border-border">
                            <TableRow>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3 pl-4">Template Name</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3">Exercises Included</TableHead>
                                <TableHead className="text-xs font-extrabold text-muted-foreground uppercase py-3 text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {templates.map((tpl) => {
                                const exercisesList = typeof tpl.exercises === "string" ? JSON.parse(tpl.exercises) : tpl.exercises || [];
                                return (
                                    <TableRow key={tpl.id} className="hover:bg-muted/5 transition-colors">
                                        <TableCell className="font-bold text-foreground py-4 pl-4 text-sm">{tpl.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-4 max-w-md">
                                            <div className="flex flex-wrap gap-1.5">
                                                {exercisesList.map((ex: any, idx: number) => (
                                                    <span key={idx} className="bg-secondary/40 border border-border px-2 py-0.5 rounded text-[10px] font-semibold text-foreground">
                                                        {ex.name} ({ex.sets} sets)
                                                    </span>
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
                    <div className="bg-card border-l border-border w-full max-w-md h-full flex flex-col p-6 shadow-2xl relative animate-in slide-in-from-right duration-300">
                        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1 mb-6">
                            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-1.5">
                                <Sparkles className="w-4.5 h-4.5 text-primary" /> {formData.id ? "Edit Workout Template" : "New Session Template"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Scaffold exercises and target set counts that trainers can load in a single click.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                            <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">Template Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Arms Blast, Leg Focus"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-background border-border h-10 text-sm rounded-md"
                                        required
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground font-bold">Exercise Configuration</Label>
                                        <Button type="button" onClick={handleAddExerciseRow} variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase tracking-wider border-border bg-card hover:bg-accent text-primary px-2.5 rounded">
                                            Add Exercise
                                        </Button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {formData.exercises.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border">
                                                <div className="flex-1 space-y-1.5">
                                                    <ExerciseCombobox
                                                        value={item.name}
                                                        onChange={(v) => handleExerciseChange(index, "name", v)}
                                                        placeholder="Exercise name"
                                                        library={exerciseLibraryNames}
                                                    />
                                                </div>
                                                <div className="w-18 shrink-0">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={20}
                                                        placeholder="Sets"
                                                        value={item.sets}
                                                        onChange={(e) => handleExerciseChange(index, "sets", Number(e.target.value) || 3)}
                                                        className="bg-background border-border h-8 text-xs rounded text-center font-mono"
                                                        required
                                                    />
                                                </div>
                                                {formData.exercises.length > 1 && (
                                                    <Button type="button" onClick={() => handleRemoveExerciseRow(index)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
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
                                    Save Template
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
