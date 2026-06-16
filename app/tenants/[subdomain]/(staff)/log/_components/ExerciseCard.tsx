"use client";

import React, { useMemo } from "react";
import {
    Control,
    Controller,
    UseFormRegister,
    useFieldArray,
    useWatch,
} from "react-hook-form";
import { AnimatePresence, motion, type DragControls } from "framer-motion";
import { GripVertical, Plus, Trash2, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExerciseCombobox } from "./ExerciseCombobox";
import { SetRow } from "./SetRow";
import { LogFormValues, MOCK_PREVIOUS, makeEmptySet } from "../exercise-data";

interface ExerciseCardProps {
    control: Control<LogFormValues>;
    register: UseFormRegister<LogFormValues>;
    exerciseIndex: number;
    dragControls: DragControls;
    onRemove: () => void;
}

function ExerciseCardImpl({
    control,
    register,
    exerciseIndex,
    dragControls,
    onRemove,
}: ExerciseCardProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `exercises.${exerciseIndex}.sets`,
    });

    // Scoped watch on just this exercise's name so the previous-session lookup
    // updates without re-rendering sibling cards.
    const name = useWatch({ control, name: `exercises.${exerciseIndex}.name` });

    const previous = useMemo(
        () => (name ? MOCK_PREVIOUS[name] : undefined),
        [name]
    );

    const lastSummary = previous
        ? `${previous[0].weight}kg × ${previous.map((p) => p.reps).join(", ")}`
        : null;

    return (
        <motion.div
            layout
            className="rounded-xl border border-border bg-card/40 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border/60 p-3">
                <button
                    type="button"
                    aria-label="drag to reorder exercise"
                    onPointerDown={(e) => dragControls.start(e)}
                    className="flex h-8 w-6 cursor-grab touch-none items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                    <Controller
                        control={control}
                        name={`exercises.${exerciseIndex}.name`}
                        render={({ field }) => (
                            <ExerciseCombobox value={field.value ?? ""} onChange={field.onChange} />
                        )}
                    />
                    {lastSummary && (
                        <div className="mt-1 flex items-center gap-1.5 pl-1 text-[11px] text-muted-foreground">
                            <History className="h-3 w-3" />
                            <span>Last: {lastSummary}</span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    aria-label="remove exercise"
                    onClick={onRemove}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Sets */}
            <div className="px-3 pb-3 pt-1">
                <div className="grid grid-cols-[28px_1fr_1fr_64px_28px] gap-2.5 px-1 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    <span>Set</span>
                    <span className="text-center">Weight</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">Last</span>
                    <span />
                </div>

                <AnimatePresence initial={false}>
                    {fields.map((setField, setIndex) => (
                        <SetRow
                            key={setField.id}
                            control={control}
                            exerciseIndex={exerciseIndex}
                            setIndex={setIndex}
                            setNumber={setIndex + 1}
                            previous={previous?.[setIndex]}
                            canRemove={fields.length > 1}
                            onRemove={() => remove(setIndex)}
                        />
                    ))}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => append(makeEmptySet())}
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                    <Plus className="h-3.5 w-3.5 text-primary" /> Add set
                </button>

                {/* Notes — uncontrolled register, so typing never re-renders the card */}
                <Input
                    {...register(`exercises.${exerciseIndex}.notes`)}
                    placeholder="Notes (tempo, cues, how it felt…)"
                    className="mt-2.5 h-9 border-border bg-background/60 text-sm placeholder:text-muted-foreground/40"
                />
            </div>
        </motion.div>
    );
}

export const ExerciseCard = React.memo(ExerciseCardImpl);
