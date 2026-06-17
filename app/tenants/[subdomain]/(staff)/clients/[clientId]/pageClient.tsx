// app/tenants/[subdomain]/(admin)/trainer/clients/[clientId]/ClientDetailClient.tsx
"use client";

import React from "react";
import {useQuery} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {striveClientFetch} from "@/lib/api";
import {AlertCircle, ArrowLeft, Calendar, Loader2, Mail, Phone} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {Textarea} from "@/components/ui/textarea";

export default function ClientDetailClient({tenantId, clientId}: { tenantId: string, clientId: string }) {
    const {data: client, isLoading} = useQuery({
        queryKey: ["clientDetail", clientId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/members/${clientId}`, {
                headers: {"X-Tenant-ID": tenantId}
            });
            return res.json();
        }
    });

    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="space-y-6">
            <Link href="../clients"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                <ArrowLeft size={16}/> All Clients
            </Link>

            {/* Header: Identity Card */}
            <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-black text-xl text-primary">
                            {client.user?.firstName?.[0]}{client.user?.lastName?.[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{client.user?.firstName} {client.user?.lastName}</h1>
                                <span
                                    className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">{client.status}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Phone
                                    size={14}/> {client.user?.phone || "+00 000 0000"}</span>
                                <span className="flex items-center gap-1"><Mail size={14}/> {client.user?.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Log Session</Button>
                        <Button size="sm">+ New Program</Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-5 gap-4 mt-8 border-t border-border pt-6">
                    <Metric label="Plan" value={client.activePlan?.name || "N/A"}/>
                    <Metric label="Sessions" value={client.sessionsCount || 0}/>
                    <Metric label="Tokens" value={client.tokensLeft || 0}/>
                    <Metric label="Weight" value={client.weight ? `${client.weight} kg` : "N/A"}/>
                    <Metric label="This Month" value={`${client.monthlySessions || 0} sess`}/>
                </div>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none p-0">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workouts">Workouts</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="grid grid-cols-3 gap-6 mt-6">
                    {/* Recent Sessions */}
                    <div className="col-span-2 space-y-4">
                        <h3 className="font-bold">Recent Sessions</h3>
                        {client.recentSessions?.length > 0 ? client.recentSessions.map((s: any) => (
                            <Card key={s.id} className="p-4 bg-card/30 border-border">
                                <div className="flex justify-between">
                                    <h4 className="font-bold">{s.name}</h4>
                                    <span className="text-sm text-muted-foreground">{s.date} · {s.duration} min</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{s.summary}</p>
                            </Card>
                        )) : <Placeholder text="No recent session data available."/>}
                    </div>

                    {/* Subscription & Next Session */}
                    <div className="col-span-1 space-y-6">
                        <Card className="p-4 bg-card border-border">
                            <h3 className="font-bold mb-3">Subscription</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span
                                    className="text-muted-foreground">Renews</span><span>{client.activePlan?.endDate || "N/A"}</span>
                                </div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Sessions Left</span><span>{client.tokensLeft} tokens</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 bg-card border-border">
                            <h3 className="font-bold mb-3">Next Session</h3>
                            {client.nextSession ? (
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Calendar size={16}/> {client.nextSession.date}
                                    <span
                                        className="text-muted-foreground text-sm font-normal">at {client.nextSession.time}</span>
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>}
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="workouts" className="mt-6 space-y-6">
                    {client.activeProgram ? (
                        <>
                            {/* Active Program Card */}
                            <Card className="p-6 bg-card border-border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold">{client.activeProgram.name}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Week {client.activeProgram.currentWeek}/{client.activeProgram.totalWeeks} · {client.activeProgram.goal}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm">+ New</Button>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full"
                                        style={{width: `${(client.activeProgram.currentWeek / client.activeProgram.totalWeeks) * 100}%`}}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 font-medium">
                                    {Math.round((client.activeProgram.currentWeek / client.activeProgram.totalWeeks) * 100)}%
                                    complete
                                </p>
                            </Card>

                            {/* Daily Routine Groups */}
                            {client.activeProgram.routines?.map((routine: any) => (
                                <Card key={routine.id} className="p-6 bg-card/50 border-border">
                                    <h3 className="font-bold text-lg mb-4">{routine.dayName}</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {routine.exercises?.map((ex: any, i: number) => (
                                            <div key={i}
                                                 className="bg-background border border-border px-3 py-2 rounded-md flex items-center gap-2">
                                                <span className="font-bold text-sm">{ex.name}</span>
                                                <span
                                                    className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</span>
                                                <span
                                                    className="text-[10px] uppercase font-bold bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                                    {ex.muscleGroup}
                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <Placeholder text="No active training program assigned to this client."/>
                    )}
                </TabsContent>
                <TabsContent value="progress" className="mt-6 grid grid-cols-2 gap-6">

                    {/* Body Weight Trend Chart */}
                    <Card className="p-6 bg-card border-border">
                        <h3 className="font-bold mb-6">BODY WEIGHT TREND</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={client.weightTrend || []}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" stroke="#888" fontSize={12} tickLine={false}
                                           axisLine={false}/>
                                    <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={12} tickLine={false}
                                           axisLine={false}/>
                                    <Tooltip contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '8px',
                                        border: 'none'
                                    }}/>
                                    <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fillOpacity={1}
                                          fill="url(#colorWeight)"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Personal Records List */}
                    <Card className="p-6 bg-card border-border">
                        <h3 className="font-bold mb-6">PERSONAL RECORDS</h3>
                        <div className="space-y-6">
                            {client.personalRecords?.map((pr: any) => (
                                <div key={pr.exercise}
                                     className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                    <span className="font-medium text-muted-foreground">{pr.exercise}</span>
                                    <div className="text-right">
                                        <p className="font-black text-lg">{pr.weight} kg</p>
                                        <p className="text-sm text-emerald-500 font-bold">+{pr.gain} kg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
                <TabsContent value="sessions" className="mt-6 space-y-4">
                    {/* Token Alert Banner */}
                    {(client.tokensLeft ?? 0) <= 3 && (
                        <div
                            className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={20}/>
                                <span className="font-bold">Only {client.tokensLeft} sessions remaining</span>
                            </div>
                            <Button variant="outline" size="sm"
                                    className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                                Top Up
                            </Button>
                        </div>
                    )}

                    {/* Sessions Table */}
                    <Card className="bg-card/30 border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-background/80 border-b border-border">
                                <TableRow className="border-b-0 hover:bg-transparent">
                                    <TableHead className="text-xs font-bold py-4 pl-6">DATE</TableHead>
                                    <TableHead className="text-xs font-bold py-4">TYPE</TableHead>
                                    <TableHead className="text-xs font-bold py-4">EXERCISES</TableHead>
                                    <TableHead className="text-xs font-bold py-4">DURATION</TableHead>
                                    <TableHead className="text-xs font-bold py-4 pr-6">NOTES</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.sessions?.map((session: any) => (
                                    <TableRow key={session.id}
                                              className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <TableCell className="py-4 pl-6 font-bold">{session.date}</TableCell>
                                        <TableCell className="py-4 text-primary font-bold">{session.type}</TableCell>
                                        <TableCell
                                            className="py-4 text-sm text-muted-foreground max-w-[300px] truncate">
                                            {session.exercisesSummary}
                                        </TableCell>
                                        <TableCell className="py-4 text-sm">{session.duration} min</TableCell>
                                        <TableCell className="py-4 text-sm italic text-muted-foreground pr-6">
                                            {session.notes || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
                <TabsContent value="notes" className="mt-6 grid grid-cols-2 gap-6">
                    {/* Left: Input Area */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Trainer
                            Notes</h3>
                        <Textarea
                            placeholder="Document observations, technique tweaks, or medical concerns..."
                            className="h-64 bg-card/50 border-border resize-none"
                        />
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            Save Notes
                        </Button>
                    </div>

                    {/* Right: History Timeline */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Note
                            History</h3>
                        <div className="space-y-3">
                            {client.notesHistory?.length > 0 ? client.notesHistory.map((note: any) => (
                                <Card key={note.id} className="p-4 bg-card/30 border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{note.date}</p>
                                    <p className="text-sm">{note.content}</p>
                                </Card>
                            )) : (
                                <p className="text-sm text-muted-foreground italic">No historical notes found.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Metric({label, value}: { label: string, value: string | number }) {
    return (
        <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-black mt-1">{value}</p>
        </div>
    );
}

function Placeholder({text}: { text: string }) {
    return (
        <div className="p-8 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}