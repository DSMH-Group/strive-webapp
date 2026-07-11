// app/tenants/[subdomain]/(staff)/log/logClient.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useForm, useFieldArray, Controller, type UseFormRegister, type Control } from "react-hook-form";
import {
    Reorder,
    useDragControls,
    AnimatePresence,
    motion,
    type DragControls,
} from "framer-motion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Send, Check, CloudCheck, Sparkles, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ExerciseCard } from "./_components/ExerciseCard";
import { SessionSummary } from "./_components/SessionSummary";
import { cn } from "@/lib/utils";
import {
    LogFormValues,
    buildExerciseFromTemplate,
} from "./exercise-data";
import { useQuery } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";

interface LogClientProps {
    subdomain: string;
    tenantId: string;
    assignedClients: { id: string; name: string }[];
}

type SavePhase = "idle" | "saving" | "done";

const ReorderableExercise = React.memo(function ReorderableExercise({
    id,
    index,
    control,
    register,
    onRemove,
    library,
}: {
    id: string;
    index: number;
    control: Control<LogFormValues>;
    register: UseFormRegister<LogFormValues>;
    onRemove: (id: string) => void;
    library?: string[];
}) {
    const dragControls = useDragControls();
    const handleRemove = useCallback(() => onRemove(id), [onRemove, id]);

    return (
        <Reorder.Item
            value={id}
            dragListener={false}
            dragControls={dragControls}
            layout
            className="list-none"
        >
            <ExerciseCard
                control={control}
                register={register}
                exerciseIndex={index}
                dragControls={dragControls as DragControls}
                onRemove={handleRemove}
                library={library}
            />
        </Reorder.Item>
    );
});

export default function LogClient({ subdomain, tenantId, assignedClients = [] }: LogClientProps) {
    // --- DB CONNECTIVITY: Active Clients list ---
    const { data: members = [] } = useQuery<any[]>({
        queryKey: ["membersListLog", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members?role=MEMBER", { tenantId });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    // --- DB CONNECTIVITY: Get Exercise Bank library ---
    const { data: dbExercises = [] } = useQuery<any[]>({
        queryKey: ["logExerciseBank", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/exercises", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    const exerciseLibraryNames = useMemo(() => {
        return dbExercises.map((ex: any) => ex.name);
    }, [dbExercises]);

    const clients = useMemo(() => {
        if (members.length > 0) {
            return members.map((m: any) => ({
                id: m.id,
                name: `${m.user?.firstName || "Strive"} ${m.user?.lastName || "Member"}`
            }));
        }
        return assignedClients.length > 0
            ? assignedClients
            : [
                  { id: "c1", name: "Amara Silva" },
                  { id: "c2", name: "Dilshan Raj" },
                  { id: "c3", name: "Kasun Mendis" },
                  { id: "c4", name: "Ruwani Jayawardena" },
              ];
    }, [members, assignedClients]);

    // --- DB CONNECTIVITY: Bookings List to Log Against Pre-existing sessions ---
    const { data: dbBookings = [] } = useQuery<any[]>({
        queryKey: ["allBookingsForLog", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/scheduling/bookings", { tenantId });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    // --- DB CONNECTIVITY: Get custom session templates ---
    const { data: dbTemplates = [], refetch: refetchTemplates } = useQuery<any[]>({
        queryKey: ["logSessionTemplates", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/session-templates", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    const sessionTemplatesMap = useMemo(() => {
        const merged: Record<string, { name: string; sets: number }[]> = {};
        
        dbTemplates.forEach((tpl: any) => {
            let exercisesList: any[] = [];
            try {
                exercisesList = typeof tpl.exercises === "string" 
                    ? JSON.parse(tpl.exercises) 
                    : tpl.exercises || [];
            } catch {
                exercisesList = [];
            }
            merged[tpl.name] = exercisesList;
        });

        return merged;
    }, [dbTemplates]);

    const sessionTypes = useMemo(() => {
        return Object.keys(sessionTemplatesMap);
    }, [sessionTemplatesMap]);

    const STORAGE_KEY = `strive:logdraft:${subdomain}`;

    const { control, register, handleSubmit, reset, watch, getValues, setValue } =
        useForm<LogFormValues>({
            defaultValues: {
                memberId: clients[0]?.id ?? "",
                sessionType: "",
                date: new Date().toISOString().slice(0, 10),
                exercises: [],
            },
        });

    const selectedMemberId = watch("memberId");
    const selectedSessionType = watch("sessionType");
    const { fields, append, remove, replace } = useFieldArray({ control, name: "exercises" });

    // Set initial sessionType once templates finish loading
    useEffect(() => {
        const currentType = getValues("sessionType");
        if (!currentType && sessionTypes.length > 0) {
            setValue("sessionType", sessionTypes[0]);
        }
    }, [sessionTypes, getValues, setValue]);

    // Automatically load exercises when sessionType updates
    const lastSessionTypeRef = useRef("");
    useEffect(() => {
        if (selectedSessionType === "CUSTOM") {
            if (lastSessionTypeRef.current !== "CUSTOM") {
                lastSessionTypeRef.current = "CUSTOM";
                replace([]);
            }
            return;
        }
        if (!selectedSessionType) return;
        if (selectedSessionType === lastSessionTypeRef.current) return;
        lastSessionTypeRef.current = selectedSessionType;
        
        const template = sessionTemplatesMap[selectedSessionType];
        if (template && template.length > 0) {
            const next = template.map((t: any) => buildExerciseFromTemplate(t.name, t.sets));
            replace(next);
        }
    }, [selectedSessionType, sessionTemplatesMap, replace]);

    // Filter sessions matching selected client
    const memberBookings = useMemo(() => {
        if (!selectedMemberId) return [];
        return dbBookings.filter((b: any) => b.membershipId === selectedMemberId);
    }, [dbBookings, selectedMemberId]);

    const [selectedBookingId, setSelectedBookingId] = useState<string>("NEW");
    const [isCustomSessionType, setIsCustomSessionType] = useState(false);
    const [customSessionTypeVal, setCustomSessionTypeVal] = useState("");

    // Reset target session if selected member changes
    useEffect(() => {
        setSelectedBookingId("NEW");
    }, [selectedMemberId]);

    const [order, setOrder] = useState<string[]>(() => fields.map((f) => f.id));
    useEffect(() => {
        const ids = fields.map((f) => f.id);
        setOrder((prev) => {
            const kept = prev.filter((id) => ids.includes(id));
            const added = ids.filter((id) => !prev.includes(id));
            const next = [...kept, ...added];
            const same = next.length === prev.length && next.every((v, i) => v === prev[i]);
            return same ? prev : next;
        });
    }, [fields]);

    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [savePhase, setSavePhase] = useState<SavePhase>("idle");

    // Hydrate any in-progress draft once on mount.
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                reset(JSON.parse(raw));
                toast.info("Restored your in-progress draft.");
            }
        } catch {
            /* ignore malformed drafts */
        }
    }, [reset, STORAGE_KEY]);

    // Debounced autosave to localStorage
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const sub = watch((value) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                    setSavedAt(Date.now());
                } catch {
                    /* ignore */
                }
            }, 600);
        });
        return () => {
            clearTimeout(timer);
            sub.unsubscribe();
        };
    }, [watch, STORAGE_KEY]);

    const handleAddExercise = useCallback(() => {
        append(buildExerciseFromTemplate("", 3));
    }, [append]);

    const handleRemoveExercise = useCallback(
        (id: string) => {
            const idx = fields.findIndex((f) => f.id === id);
            if (idx >= 0) remove(idx);
        },
        [fields, remove]
    );



    const buildPayload = (values: LogFormValues) => {
        const ordered = order
            .map((id) => fields.findIndex((f) => f.id === id))
            .filter((i) => i >= 0)
            .map((i) => values.exercises[i])
            .filter(Boolean);

        return {
            metricType: "WORKOUT_LOG",
            membershipId: values.memberId,
            data: {
                bookingId: selectedBookingId !== "NEW" ? selectedBookingId : undefined,
                sessionType: values.sessionType,
                date: values.date,
                exercises: ordered.map((ex) => ({
                    name: ex.name,
                    notes: ex.notes,
                    sets: ex.sets.map((s) => ({
                        weightKgs: Number(s.weight) || 0,
                        reps: Number(s.reps) || 0,
                        completed: s.done,
                    })),
                })),
            },
        };
    };

    const submit = (notify: boolean) =>
        handleSubmit(async (values) => {
            if (!values.date) {
                toast.error("Please set a session date.");
                return;
            }
            const payload = buildPayload(values);

            if (notify) {
                setSavePhase("saving");
                try {
                    const res = await striveClientFetch("/api/v1/metrics", {
                        method: "POST",
                        tenantId,
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        throw new Error("Could not log performance metrics database entry.");
                    }

                    setSavePhase("done");
                    toast.success("Workout logged and metrics persisted on database ledger.");
                    localStorage.removeItem(STORAGE_KEY);
                    
                    // Reset to defaults
                    reset({
                        memberId: clients[0]?.id ?? "",
                        sessionType: sessionTypes[0] || "",
                        date: new Date().toISOString().slice(0, 10),
                        exercises: [],
                    });
                    setSelectedBookingId("NEW");
                    setIsCustomSessionType(false);
                    setCustomSessionTypeVal("");
                    refetchTemplates();
                    setTimeout(() => setSavePhase("idle"), 1600);
                } catch (err: any) {
                    setSavePhase("idle");
                    toast.error(err.message || "Failed to persist metric log.");
                }
            } else {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
                    setSavedAt(Date.now());
                } catch {
                    /* ignore */
                }
                toast.success("Draft saved locally.");
            }
        })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto max-w-7xl space-y-5 text-foreground"
        >
            {/* Heading */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Log Session</h1>
                    <p className="text-sm text-muted-foreground">
                        Track sets, reps and load — saved automatically as you go.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <div className="lg:col-span-3 space-y-5">

                    {/* Card 1: Session Details */}
                    <div className="rounded-xl border border-border bg-card/40 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            
                            {/* Member Selector */}
                            <div className="space-y-1.5 col-span-1 text-left">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Member
                                </Label>
                                <Controller
                                    control={control}
                                    name="memberId"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={(v) => field.onChange(v ?? field.value)}>
                                            <SelectTrigger className="h-10 w-full border-border bg-background text-sm font-semibold justify-between flex">
                                                <span>
                                                    {clients.find(c => c.id === field.value)?.name || "Select member"}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Session Selector (Pre-existing vs New) */}
                            <div className="space-y-1.5 col-span-1 text-left">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Target Session
                                </Label>
                                <Select 
                                    value={selectedBookingId} 
                                    onValueChange={(v) => {
                                        setSelectedBookingId(v ?? "NEW");
                                        if (v && v !== "NEW") {
                                            const booking = memberBookings.find((b: any) => b.id === v);
                                            if (booking) {
                                                const dateStr = new Date(booking.startTime).toISOString().slice(0, 10);
                                                setValue("date", dateStr);
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-10 w-full border-border bg-background text-sm font-semibold justify-between flex">
                                        <span>
                                            {(() => {
                                                if (selectedBookingId === "NEW") return "New Session...";
                                                const booking = memberBookings.find((b: any) => b.id === selectedBookingId);
                                                if (booking) {
                                                    const dateStr = new Date(booking.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                    const timeStr = new Date(booking.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                                                    const noteLabel = booking.resource?.name ? ` - ${booking.resource.name}` : "";
                                                    return `PT Session (${dateStr} @ ${timeStr})${noteLabel}`;
                                                }
                                                return "Select session";
                                            })()}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New Session...</SelectItem>
                                        {memberBookings.map((b: any) => {
                                            const start = new Date(b.startTime);
                                            const dateStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                            const timeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                                            const noteLabel = b.resource?.name ? ` - ${b.resource.name}` : "";
                                            return (
                                                <SelectItem key={b.id} value={b.id}>
                                                    PT Session ({dateStr} @ {timeStr}){noteLabel}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Picker */}
                            <div className="space-y-1.5 col-span-1 text-left">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Date
                                </Label>
                                <Input
                                    type="date"
                                    disabled={selectedBookingId !== "NEW"}
                                    {...register("date")}
                                    className="h-10 border-border bg-background text-sm font-mono disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Workout Template */}
                    <div className="rounded-xl border border-border bg-card/40 p-4">
                        <div className={cn(
                            "grid grid-cols-1 gap-4",
                            isCustomSessionType ? "md:grid-cols-2" : "md:grid-cols-1"
                        )}>
                            
                            {/* Session type */}
                            <div className="space-y-1.5 col-span-1 text-left">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Session type
                                    </Label>
                                    <Link
                                        href="/settings?view=TEMPLATES"
                                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-opacity hover:opacity-80 font-semibold"
                                    >
                                        <Sparkles className="h-3 w-3" /> Manage Templates
                                    </Link>
                                </div>
                                <Controller
                                    control={control}
                                    name="sessionType"
                                    render={({ field }) => (
                                        <Select 
                                            value={isCustomSessionType ? "CUSTOM" : field.value} 
                                            onValueChange={(v) => {
                                                if (v === "CUSTOM") {
                                                    setIsCustomSessionType(true);
                                                    field.onChange("");
                                                } else {
                                                    setIsCustomSessionType(false);
                                                    field.onChange(v ?? field.value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-10 w-full border-border bg-background text-sm font-semibold justify-between flex">
                                                <span>
                                                    {isCustomSessionType ? "-- Custom Type --" : field.value || "Select type"}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sessionTypes.map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="CUSTOM">-- Custom... --</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Custom Session Type */}
                            {isCustomSessionType && (
                                <div className="space-y-1.5 col-span-1 text-left">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Custom Session Type
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Rehab PT"
                                        value={customSessionTypeVal}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomSessionTypeVal(val);
                                            setValue("sessionType", val);
                                        }}
                                        className="h-10 border-border bg-background text-sm"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live summary */}
                    <SessionSummary control={control} />

                    {/* Exercise list (drag to reorder) */}
                    <Reorder.Group
                        axis="y"
                        values={order}
                        onReorder={setOrder}
                        className="space-y-3"
                    >
                        <AnimatePresence initial={false}>
                            {order.map((id) => {
                                const index = fields.findIndex((f) => f.id === id);
                                if (index === -1) return null;
                                return (
                                    <ReorderableExercise
                                        key={id}
                                        id={id}
                                        index={index}
                                        control={control}
                                        register={register}
                                        onRemove={handleRemoveExercise}
                                        library={exerciseLibraryNames}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </Reorder.Group>

                    <button
                        type="button"
                        onClick={handleAddExercise}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-card/40"
                    >
                        <Plus className="h-4 w-4 text-primary" /> Add exercise
                    </button>

                    {/* Action bar */}
                    <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                        <span className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
                            <CloudCheck className="h-3.5 w-3.5" />
                            {savedAt ? "Draft saved" : "Autosave on"}
                        </span>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => submit(false)}
                            className="h-10 px-4 text-xs font-bold"
                        >
                            Save draft
                        </Button>

                        <Button
                            type="button"
                            onClick={() => submit(true)}
                            disabled={savePhase === "saving"}
                            className="h-10 min-w-[168px] gap-1.5 px-5 text-xs font-bold"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {savePhase === "saving" ? (
                                    <motion.span
                                        key="saving"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                                    </motion.span>
                                ) : savePhase === "done" ? (
                                    <motion.span
                                        key="done"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Check className="h-3.5 w-3.5" /> Sent
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Send className="h-3.5 w-3.5" /> Save &amp; notify
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>

                {/* Right Column - Informational Sidebar */}
                <div className="space-y-4 lg:sticky lg:top-24">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Session Logger</span>
                            <h3 className="text-sm font-extrabold text-foreground">How It Works</h3>
                            <p className="text-xs text-muted-foreground leading-normal mt-2">
                                Use this portal to log real-time performance datasets for clients. Saving a session updates their anatomical muscle maps and progression heatmaps immediately.
                            </p>
                        </div>

                        <div className="h-[1px] bg-border" />

                        <div className="space-y-3.5">
                            <div className="flex gap-2.5 items-start">
                                <span className="text-xs shrink-0 mt-0.5">💾</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-foreground leading-none">Draft Autosave</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                                        Your in-progress entries are saved locally. You won't lose data even if you refresh.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2.5 items-start">
                                <span className="text-xs shrink-0 mt-0.5">🔄</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-foreground leading-none">Drag to Reorder</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                                        Grab the left drag handles on the exercise cards to sequence the workout structure.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2.5 items-start">
                                <span className="text-xs shrink-0 mt-0.5">✨</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-foreground leading-none">Load Templates</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                                        Click "Apply Template" to instantly populate default exercises for the selected program type.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
