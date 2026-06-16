"use client";

import React from "react";
import { Control, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { Check, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogFormValues, REPS_STEP, WEIGHT_STEP } from "../exercise-data";

interface SetRowProps {
    control: Control<LogFormValues>;
    exerciseIndex: number;
    setIndex: number;
    setNumber: number;
    previous?: { weight: number; reps: number };
    canRemove: boolean;
    onRemove: () => void;
}

function clampNumber(raw: string, delta: number): string {
    const next = Math.max(0, (parseFloat(raw) || 0) + delta);
    // String() already drops the trailing ".0" (85) while keeping 82.5.
    return String(next);
}

interface StepperProps {
    value: string;
    onChange: (v: string) => void;
    step: number;
    placeholder: string;
    ariaLabel: string;
    active: boolean;
}

function Stepper({ value, onChange, step, placeholder, ariaLabel, active }: StepperProps) {
    return (
        <div
            className={cn(
                "flex items-center overflow-hidden rounded-md border bg-background transition-all",
                active
                    ? "border-primary ring-3 ring-primary/20"
                    : "border-border"
            )}
        >
            <button
                type="button"
                aria-label={`decrease ${ariaLabel}`}
                onClick={() => onChange(clampNumber(value, -step))}
                className="flex h-10 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <input
                inputMode="decimal"
                value={value}
                placeholder={placeholder}
                aria-label={ariaLabel}
                onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
                className="h-10 w-full min-w-0 bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            <button
                type="button"
                aria-label={`increase ${ariaLabel}`}
                onClick={() => onChange(clampNumber(value, step))}
                className="flex h-10 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function SetRowImpl({
    control,
    exerciseIndex,
    setIndex,
    setNumber,
    previous,
    canRemove,
    onRemove,
}: SetRowProps) {
    const base = `exercises.${exerciseIndex}.sets.${setIndex}` as const;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="grid grid-cols-[28px_1fr_1fr_64px_28px] items-center gap-2.5 overflow-hidden py-1"
        >
            {/* Done toggle / set number */}
            <Controller
                control={control}
                name={`${base}.done`}
                render={({ field }) => (
                    <button
                        type="button"
                        aria-label={field.value ? "mark set incomplete" : "mark set complete"}
                        aria-pressed={!!field.value}
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all active:scale-90",
                            field.value
                                ? "bg-primary text-primary-foreground"
                                : "border border-border text-muted-foreground hover:border-primary/50"
                        )}
                    >
                        {field.value ? <Check className="h-3.5 w-3.5" /> : setNumber}
                    </button>
                )}
            />

            {/* Weight */}
            <Controller
                control={control}
                name={`${base}.weight`}
                render={({ field }) => (
                    <Stepper
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        step={WEIGHT_STEP}
                        placeholder={previous ? String(previous.weight) : "kg"}
                        ariaLabel="weight in kilograms"
                        active={!!field.value}
                    />
                )}
            />

            {/* Reps */}
            <Controller
                control={control}
                name={`${base}.reps`}
                render={({ field }) => (
                    <Stepper
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        step={REPS_STEP}
                        placeholder={previous ? String(previous.reps) : "reps"}
                        ariaLabel="repetitions"
                        active={!!field.value}
                    />
                )}
            />

            {/* Previous-session reference */}
            <span className="text-center text-[11px] font-medium tabular-nums text-muted-foreground/70">
                {previous ? `${previous.weight}×${previous.reps}` : "—"}
            </span>

            {/* Remove set */}
            <button
                type="button"
                aria-label="remove set"
                disabled={!canRemove}
                onClick={onRemove}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-destructive disabled:opacity-25 disabled:hover:text-muted-foreground/60"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    );
}

export const SetRow = React.memo(SetRowImpl);
