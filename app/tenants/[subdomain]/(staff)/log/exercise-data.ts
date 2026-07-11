// Static data + types for the trainer workout Log page.
// Kept framework-free so both the server page and client components can import it.

export interface SetEntry {
    weight: string;
    reps: string;
    done: boolean;
}

export interface ExerciseEntry {
    name: string;
    notes: string;
    sets: SetEntry[];
}

export interface LogFormValues {
    memberId: string;
    sessionType: string;
    date: string;
    exercises: ExerciseEntry[];
    sessionNote?: string;
}

// Common exercises powering the name autocomplete. Grouped loosely by pattern
// so the combobox suggestions feel curated rather than alphabetical noise.
export const EXERCISE_LIBRARY: string[] = [
    "Bench Press",
    "Incline Dumbbell Press",
    "Overhead Press",
    "Push Press",
    "Dips",
    "Cable Fly",
    "Lateral Raise",
    "Triceps Pushdown",
    "Pull-up",
    "Lat Pulldown",
    "Barbell Row",
    "Seated Cable Row",
    "Face Pull",
    "Barbell Curl",
    "Hammer Curl",
    "Back Squat",
    "Front Squat",
    "Romanian Deadlift",
    "Deadlift",
    "Leg Press",
    "Walking Lunge",
    "Leg Curl",
    "Leg Extension",
    "Calf Raise",
    "Plank",
    "Hanging Leg Raise",
    "Treadmill Intervals",
    "Rowing Erg",
];

// Pre-built session blueprints. Selecting a session type can seed these rows.
// `sets` is how many empty sets to scaffold for that movement.
export const SESSION_TEMPLATES: Record<string, { name: string; sets: number }[]> = {
    "Push Day": [
        { name: "Bench Press", sets: 4 },
        { name: "Overhead Press", sets: 3 },
        { name: "Incline Dumbbell Press", sets: 3 },
        { name: "Triceps Pushdown", sets: 3 },
    ],
    "Pull Volume": [
        { name: "Barbell Row", sets: 4 },
        { name: "Lat Pulldown", sets: 3 },
        { name: "Seated Cable Row", sets: 3 },
        { name: "Barbell Curl", sets: 3 },
    ],
    "Leg Conditioning": [
        { name: "Back Squat", sets: 5 },
        { name: "Romanian Deadlift", sets: 3 },
        { name: "Leg Press", sets: 3 },
        { name: "Calf Raise", sets: 4 },
    ],
    "Cardio Mesh": [
        { name: "Rowing Erg", sets: 3 },
        { name: "Treadmill Intervals", sets: 4 },
        { name: "Plank", sets: 3 },
    ],
};

export const SESSION_TYPES = Object.keys(SESSION_TEMPLATES);

// Mock "last session" history keyed by exercise name. Until the backend
// /metrics history endpoint is wired up, this powers the ghosted reference
// values (e.g. "last: 80kg x 6") that make progression obvious at a glance.
export const MOCK_PREVIOUS: Record<string, { weight: number; reps: number }[]> = {
    "Bench Press": [{ weight: 80, reps: 6 }, { weight: 80, reps: 6 }, { weight: 80, reps: 5 }],
    "Overhead Press": [{ weight: 55, reps: 8 }, { weight: 55, reps: 7 }, { weight: 50, reps: 8 }],
    "Incline Dumbbell Press": [{ weight: 30, reps: 10 }, { weight: 30, reps: 9 }],
    "Triceps Pushdown": [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }],
    "Back Squat": [{ weight: 110, reps: 5 }, { weight: 110, reps: 5 }, { weight: 110, reps: 4 }],
    "Romanian Deadlift": [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }],
    "Barbell Row": [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }],
    "Lat Pulldown": [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }],
};

export const WEIGHT_STEP = 2.5;
export const REPS_STEP = 1;

export function makeEmptySet(): SetEntry {
    return { weight: "", reps: "", done: false };
}

export function buildExerciseFromTemplate(name: string, setCount: number): ExerciseEntry {
    return {
        name,
        notes: "",
        sets: Array.from({ length: setCount }, makeEmptySet),
    };
}

export function templateToExercises(sessionType: string): ExerciseEntry[] {
    const template = SESSION_TEMPLATES[sessionType];
    if (!template) return [];
    return template.map((t) => buildExerciseFromTemplate(t.name, t.sets));
}
