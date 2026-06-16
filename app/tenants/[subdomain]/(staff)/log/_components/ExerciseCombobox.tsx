"use client";

import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { EXERCISE_LIBRARY } from "../exercise-data";
import { cn } from "@/lib/utils";

interface ExerciseComboboxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

// Lightweight autocomplete over EXERCISE_LIBRARY. Free text is always allowed
// (trainers can log anything); suggestions just speed up the common case.
function ExerciseComboboxImpl({ value, onChange, placeholder }: ExerciseComboboxProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const matches = useMemo(() => {
        const q = value.trim().toLowerCase();
        const pool = q
            ? EXERCISE_LIBRARY.filter((e) => e.toLowerCase().includes(q))
            : EXERCISE_LIBRARY;
        // Hide the list when the only match is an exact echo of what's typed.
        if (pool.length === 1 && pool[0].toLowerCase() === q) return [];
        return pool.slice(0, 6);
    }, [value]);

    const commit = (val: string) => {
        onChange(val);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || matches.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % matches.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            commit(matches[activeIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            <Input
                value={value}
                placeholder={placeholder ?? "e.g. Bench Press"}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                    setActiveIndex(0);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    // Delay so an onMouseDown selection on an option lands first.
                    blurTimer.current = setTimeout(() => setOpen(false), 120);
                }}
                onKeyDown={handleKeyDown}
                className="h-10 bg-background border-border text-sm font-medium"
                autoComplete="off"
            />

            {open && matches.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md ring-1 ring-foreground/10"
                >
                    {matches.map((name, i) => (
                        <li key={name} role="option" aria-selected={i === activeIndex}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (blurTimer.current) clearTimeout(blurTimer.current);
                                    commit(name);
                                }}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={cn(
                                    "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                                    i === activeIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "text-foreground"
                                )}
                            >
                                {name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export const ExerciseCombobox = React.memo(ExerciseComboboxImpl);
