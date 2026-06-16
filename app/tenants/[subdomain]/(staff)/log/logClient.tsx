"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { Plus, Send, Check, CloudCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExerciseCard } from "./_components/ExerciseCard";
import { SessionSummary } from "./_components/SessionSummary";
import {
    LogFormValues,
    SESSION_TYPES,
    buildExerciseFromTemplate,
    templateToExercises,
} from "./exercise-data";

interface LogClientProps {
    subdomain: string;
    assignedClients: { id: string; name: string }[];
}

type SavePhase = "idle" | "saving" | "done";

// Memoized so a parent re-render (e.g. the autosave tick) never re-renders an
// untouched exercise. Drag is handle-driven via per-item drag controls.
const ReorderableExercise = React.memo(function ReorderableExercise({
    id,
    index,
    control,
    register,
    onRemove,
}: {
    id: string;
    index: number;
    control: Control<LogFormValues>;
    register: UseFormRegister<LogFormValues>;
    onRemove: (id: string) => void;
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
            />
        </Reorder.Item>
    );
});

export default function LogClient({ subdomain, assignedClients = [] }: LogClientProps) {
    const clients =
        assignedClients.length > 0
            ? assignedClients
            : [
                  { id: "c1", name: "Amara Silva" },
                  { id: "c2", name: "Dilshan Raj" },
                  { id: "c3", name: "Kasun Mendis" },
                  { id: "c4", name: "Ruwani Jayawardena" },
              ];

    const STORAGE_KEY = `strive:logdraft:${subdomain}`;

    const { control, register, handleSubmit, reset, watch, getValues } =
        useForm<LogFormValues>({
            defaultValues: {
                memberId: clients[0]?.id ?? "",
                sessionType: SESSION_TYPES[0],
                date: new Date().toISOString().slice(0, 10),
                exercises: templateToExercises(SESSION_TYPES[0]),
            },
        });

    const { fields, append, remove, replace } = useFieldArray({ control, name: "exercises" });

    // Visual order is kept separate from the RHF field-array indices so that
    // dragging never re-indexes the array (which would remount inputs and lose
    // focus / uncontrolled state). We reconcile ids on add/remove/reset.
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced autosave to localStorage via a subscription (does not re-render).
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const sub = watch((value) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                    setSavedAt(Date.now());
                } catch {
                    /* storage full / unavailable */
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

    const handleApplyTemplate = useCallback(() => {
        const type = getValues("sessionType");
        const next = templateToExercises(type);
        if (next.length === 0) {
            toast.error("No template defined for this session type.");
            return;
        }
        replace(next);
        toast.success(`Loaded the ${type} template.`);
    }, [getValues, replace]);

    const buildPayload = (values: LogFormValues) => {
        // Emit exercises in the on-screen (dragged) order, not array order.
        const ordered = order
            .map((id) => fields.findIndex((f) => f.id === id))
            .filter((i) => i >= 0)
            .map((i) => values.exercises[i])
            .filter(Boolean);

        return {
            metricType: "WORKOUT_LOG",
            membershipId: values.memberId,
            data: {
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
        handleSubmit((values) => {
            if (!values.date) {
                toast.error("Please set a session date.");
                return;
            }
            const payload = buildPayload(values);
            // eslint-disable-next-line no-console
            console.log("Strive WORKOUT_LOG payload:", payload);

            if (notify) {
                setSavePhase("saving");
                setTimeout(() => {
                    setSavePhase("done");
                    toast.success("Session saved. Member notified via Text.lk.");
                    setTimeout(() => setSavePhase("idle"), 1600);
                }, 650);
            } else {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
                    setSavedAt(Date.now());
                } catch {
                    /* ignore */
                }
                toast.success("Draft saved.");
            }
        })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto max-w-3xl space-y-5 text-foreground"
        >
            {/* Heading */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Log session</h1>
                    <p className="text-sm text-muted-foreground">
                        Track sets, reps and load — saved automatically as you go.
                    </p>
                </div>
            </div>

            {/* Config bar */}
            <div className="rounded-xl border border-border bg-card/40 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Member
                        </Label>
                        <Controller
                            control={control}
                            name="memberId"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? field.value)}>
                                    <SelectTrigger className="h-10 w-full border-border bg-background text-sm font-semibold">
                                        <SelectValue placeholder="Select member" />
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

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Session type
                            </Label>
                            <button
                                type="button"
                                onClick={handleApplyTemplate}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-opacity hover:opacity-80"
                            >
                                <Sparkles className="h-3 w-3" /> Apply template
                            </button>
                        </div>
                        <Controller
                            control={control}
                            name="sessionType"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? field.value)}>
                                    <SelectTrigger className="h-10 w-full border-border bg-background text-sm font-semibold">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SESSION_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Date
                        </Label>
                        <Input
                            type="date"
                            {...register("date")}
                            className="h-10 border-border bg-background text-sm font-mono"
                        />
                    </div>
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
        </motion.div>
    );
}
