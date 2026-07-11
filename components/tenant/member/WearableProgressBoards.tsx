// components/tenant/member/WearableProgressBoards.tsx
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { striveClientFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
    AreaChart, Area, ReferenceLine, LineChart, Line 
} from 'recharts';
import { 
    type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent 
} from '@/components/ui/chart';
import { Footprints, Heart, Flame, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WearableProgressBoardsProps {
    tenantId: string;
}

const configSteps = {
    steps: {
        label: "Steps",
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig;

const configHR = {
    hr: {
        label: "Heart Rate (BPM)",
        color: "hsl(262.1 83.3% 57.8%)", // Premium Indigo/Violet
    }
} satisfies ChartConfig;

const configCal = {
    calories: {
        label: "Active Calories (kcal)",
        color: "hsl(24.6 95% 53.1%)", // Vibrant Orange
    }
} satisfies ChartConfig;

export function WearableProgressBoards({ tenantId }: { tenantId: string }) {
    // Fetch all metrics
    const { data: metrics = [], isLoading } = useQuery<any[]>({
        queryKey: ['memberWearableMetrics', tenantId],
        queryFn: async () => {
            const res = await striveClientFetch('/api/v1/metrics', {
                headers: { 'X-Tenant-ID': tenantId },
            });
            return res.ok ? res.json() : [];
        },
    });

    // Parse steps, heart rate, and calories
    const healthData = useMemo(() => {
        const steps: any[] = [];
        const heartRate: any[] = [];
        const calories: any[] = [];

        metrics.forEach((metric) => {
            const payload = metric.data || {};
            const dateObj = new Date(metric.recordedAt);
            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (metric.metricType === 'WEARABLE_STEPS') {
                steps.push({
                    day: dateStr,
                    steps: payload.value || 0,
                    date: metric.recordedAt,
                });
            } else if (metric.metricType === 'WEARABLE_HEART_RATE') {
                heartRate.push({
                    time: timeStr,
                    hr: payload.value || 0,
                    date: metric.recordedAt,
                });
            } else if (metric.metricType === 'WEARABLE_CALORIES') {
                calories.push({
                    day: dateStr,
                    calories: payload.value || 0,
                    date: metric.recordedAt,
                });
            }
        });

        // Sort by dates ascending for timelines
        const sortFn = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

        return {
            steps: steps.sort(sortFn).slice(-7), // Last 7 records
            heartRate: heartRate.sort(sortFn),   // Workouts readings
            calories: calories.sort(sortFn).slice(-7),
        };
    }, [metrics]);

    if (isLoading) {
        return <div className="py-10 text-center text-xs text-muted-foreground">Loading wearable charts...</div>;
    }

    if (metrics.length === 0) {
        return (
            <Card className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mx-auto">
                    <Footprints className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-foreground tracking-tight">Connect Wear OS Device</h4>
                    <p className="text-xs text-muted-foreground leading-normal max-w-sm mx-auto">
                        Link your smart wearables (Galaxy Watch, Pixel Watch) to map daily step trends, heart rate zones, and active energy burn metrics directly here.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Steps Chart Card */}
            <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Footprints className="w-4 h-4 text-emerald-500" /> Daily Steps
                        </span>
                        <h4 className="text-sm font-bold text-foreground">7-Day Tracking</h4>
                    </div>
                </div>

                <div className="h-44 w-full font-mono text-[9px] mt-4">
                    {healthData.steps.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">No steps logs synced.</div>
                    ) : (
                        <ChartContainer config={configSteps} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={healthData.steps} margin={{ left: -24, right: 6, top: 6 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <ReferenceLine y={10000} stroke="#10b981" strokeDasharray="4 4" label={{ value: "10k Target", position: "top", fill: "#10b981", fontSize: 9 }} />
                                    <Bar dataKey="steps" fill="var(--color-steps)" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </div>
            </Card>

            {/* Heart Rate Zones Card */}
            <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-rose-500" /> Active Heart Rate
                        </span>
                        <h4 className="text-sm font-bold text-foreground">Intra-workout Zones (BPM)</h4>
                    </div>
                </div>

                <div className="h-44 w-full font-mono text-[9px] mt-4">
                    {healthData.heartRate.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">No heart rate logs synced.</div>
                    ) : (
                        <ChartContainer config={configHR} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={healthData.heartRate} margin={{ left: -24, right: 6, top: 6 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} domain={[60, 180]} />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <ReferenceLine y={140} stroke="#a855f7" strokeDasharray="3 3" label={{ value: "Aerobic Threshold", position: "top", fill: "#a855f7", fontSize: 9 }} />
                                    <defs>
                                        <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-hr)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--color-hr)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="hr" stroke="var(--color-hr)" strokeWidth={2} fill="url(#hrAreaGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </div>
            </Card>

            {/* Calories Card */}
            <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-orange-500" /> Active Calories
                        </span>
                        <h4 className="text-sm font-bold text-foreground">Burned energy expenditure (kcal)</h4>
                    </div>
                </div>

                <div className="h-44 w-full font-mono text-[9px] mt-4">
                    {healthData.calories.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">No calorie logs synced.</div>
                    ) : (
                        <ChartContainer config={configCal} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={healthData.calories} margin={{ left: -24, right: 6, top: 6 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="calories" stroke="var(--color-calories)" strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </div>
            </Card>
        </div>
    );
}
