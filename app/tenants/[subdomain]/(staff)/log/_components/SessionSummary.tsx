"use client";

import React, { useMemo } from "react";
import { Control, useWatch } from "react-hook-form";
import { LogFormValues } from "../exercise-data";

interface SessionSummaryProps {
    control: Control<LogFormValues>;
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {label}
            </div>
            <div className="text-sm font-semibold tabular-nums text-foreground">{value}</div>
        </div>
    );
}

// Isolated subscriber: this is the only component that re-renders as set values
// change, keeping the live volume tally cheap.
function SessionSummaryImpl({ control }: SessionSummaryProps) {
    const exercises = useWatch({ control, name: "exercises" });

    const { volume, totalSets, doneSets } = useMemo(() => {
        let volume = 0;
        let totalSets = 0;
        let doneSets = 0;
        for (const ex of exercises ?? []) {
            for (const s of ex.sets ?? []) {
                totalSets += 1;
                if (s.done) doneSets += 1;
                volume += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
            }
        }
        return { volume, totalSets, doneSets };
    }, [exercises]);

    return (
        <div className="flex gap-2">
            <Stat label="Exercises" value={String(exercises?.length ?? 0)} />
            <Stat label="Sets done" value={`${doneSets} / ${totalSets}`} />
            <Stat label="Volume" value={`${Math.round(volume).toLocaleString()} kg`} />
        </div>
    );
}

export const SessionSummary = React.memo(SessionSummaryImpl);
