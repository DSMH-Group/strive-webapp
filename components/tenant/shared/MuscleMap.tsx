// app/tenants/[subdomain]/(admin)/member/progress/components/MuscleMap.tsx
"use client";

import React, { useMemo } from "react";
import Body, { type ExtendedBodyPart, type Slug } from "react-muscle-highlighter";

interface MuscleMapProps {
    view: "anterior" | "posterior";
    activatedZones: string[]; // Receives string slugs like ["chest", "quadriceps", "abs"]
    onHover: (muscleName: string | null) => void;
}

/**
 * Structural mapper translating Stride incoming data string tokens
 * to the exact strict type definitions of react-muscle-highlighter
 */
const STRIDE_TO_LIBRARY_SLUG_MAP: Record<string, Slug> = {
    chest: "chest",
    shoulders: "deltoids",
    quads: "quadriceps",
    lats: "upper-back", // Mapped to library's back wing geometry
    hamstrings: "hamstring",
    abs: "abs",
    triceps: "triceps",
    biceps: "biceps",
    forearms: "forearm",
    calves: "calves",
    obliques: "obliques",
    lowerback: "lower-back",
    traps: "trapezius"
};

export function MuscleMap({ view, activatedZones = [], onHover }: MuscleMapProps) {

    // Process input data array into type-safe ExtendedBodyPart matrix configurations
    const highlightedParts: readonly ExtendedBodyPart[] = useMemo(() => {
        return activatedZones
            .map((zone) => zone.toLowerCase().trim())
            .filter((zone) => !!STRIDE_TO_LIBRARY_SLUG_MAP[zone])
            .map((zone) => ({
                slug: STRIDE_TO_LIBRARY_SLUG_MAP[zone],
                // Inherits Strive layout token styling hooks dynamically
                color: "var(--primary)",
                styles: {
                    fill: "var(--primary)",
                    stroke: "none"
                }
            }));
    }, [activatedZones]);

    // Translate component structural properties to library side keys
    const componentSide = view === "anterior" ? "front" : "back";

    return (
        <div className="w-full max-w-[240px] aspect-[1/2] mx-auto p-4 bg-zinc-950/20 border border-white/5 rounded-2xl relative flex items-center justify-center group transition-all duration-300 hover:border-white/10">
            <Body
                data={highlightedParts}
                side={componentSide}
                gender="male" // Change dynamically to "female" based on user profile context if necessary
                scale={1.3}
                defaultFill="#18181b" // Custom background layer color matching your high-contrast theme
                border="#27272a" // Clean contour line separation
                defaultStrokeWidth={0.5}
                onBodyPartPress={(part) => {
                    if (part.slug) {
                        // Humanize the string slug format before lifting state back to tracking HUD
                        const labelText = part.slug.replace(/-/g, ' ').toUpperCase();
                        onHover(labelText);
                    }
                }}
            />
        </div>
    );
}