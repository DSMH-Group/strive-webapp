// app/tenants/[subdomain]/(admin)/front-desk/frontDeskClient.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MonitorPlay, CheckCircle2, AlertOctagon, Loader2, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FrontDeskClientProps {
    subdomain: string;
}

export default function FrontDeskClient({ subdomain }: FrontDeskClientProps) {
    const queryClient = useQueryClient();
    const [scanInput, setScanInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Audio synthesizer helper
    const playSuccessSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playTone = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.1, start);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + duration);
            };
            playTone(523.25, ctx.currentTime, 0.15); // C5
            playTone(659.25, ctx.currentTime + 0.1, 0.25); // E5
        } catch (e) {
            console.error("Audio failure:", e);
        }
    };

    const playDenySound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.value = 130; // low buzz
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            console.error("Audio failure:", e);
        }
    };

    // Scanned status tracking state
    const [lastScanResult, setLastScanResult] = useState<{
        success: boolean;
        message: string;
        member: any | null;
        timestamp: Date;
    } | null>(null);

    // Auto-focus scanner input constantly
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        const handleBodyClick = () => {
            if (inputRef.current) inputRef.current.focus();
        };
        document.body.addEventListener("click", handleBodyClick);
        return () => {
            document.body.removeEventListener("click", handleBodyClick);
        };
    }, []);

    // Get Active Tenant
    const { data: tenant } = useQuery({
        queryKey: ["frontDeskTenant", subdomain],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/meta/resolve?domain=${subdomain}.localhost`);
            if (!res.ok) return null;
            return res.json();
        }
    });

    const tenantId = tenant?.id;

    // Fetch members index
    const { data: members = [] } = useQuery<any[]>({
        queryKey: ["frontDeskMembers", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!tenantId
    });

    // Fetch check-in history
    const { data: history = [], refetch: refetchHistory } = useQuery<any[]>({
        queryKey: ["frontDeskHistory", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/attendances", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.history || [];
        },
        enabled: !!tenantId,
        refetchInterval: 3000 // Realtime updates
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = scanInput.trim();
        if (!value) return;
        setScanInput("");

        // Find matches
        const match = members.find((m: any) => {
            const mId = m.id.toLowerCase();
            const rfid = (m.rfidTag || "").toLowerCase();
            const email = (m.user?.email || "").toLowerCase();
            const fullName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.toLowerCase();
            const target = value.toLowerCase();

            return mId === target || rfid === target || email === target || fullName.includes(target);
        });

        if (!match) {
            playDenySound();
            setLastScanResult({
                success: false,
                message: `Card ID/RFID not recognized: "${value}"`,
                member: null,
                timestamp: new Date()
            });
            return;
        }

        try {
            const res = await striveClientFetch("/api/v1/attendances", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    membershipId: match.id,
                    authMethod: match.rfidTag && match.rfidTag.toLowerCase() === value.toLowerCase() ? "RFID" : "MANUAL"
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ message: "Check-in rejected by active rules." }));
                playDenySound();
                setLastScanResult({
                    success: false,
                    message: errData.message || "Membership expired or out of tokens.",
                    member: match,
                    timestamp: new Date()
                });
                return;
            }

            playSuccessSound();
            setLastScanResult({
                success: true,
                message: "Access Granted. Welcome to " + (tenant?.name || "Strive") + "!",
                member: match,
                timestamp: new Date()
            });

            refetchHistory();
        } catch (err: any) {
            playDenySound();
            setLastScanResult({
                success: false,
                message: err.message || "Database synchronization timeout.",
                member: match,
                timestamp: new Date()
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 select-none relative overflow-hidden">
            {/* Ambient visual background glow */}
            {lastScanResult && (
                <div className={cn(
                    "absolute -inset-[500px] blur-[150px] opacity-15 rounded-full transition-all duration-500 pointer-events-none",
                    lastScanResult.success ? "bg-emerald-500" : "bg-destructive"
                )} />
            )}

            {/* Header console */}
            <div className="flex items-center justify-between border-b border-border pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                        <MonitorPlay className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-extrabold tracking-widest text-muted-foreground uppercase">Front Desk Mode</h1>
                        <p className="text-xl font-black italic tracking-tight text-foreground">{tenant?.name || "Strive"} Reception Console</p>
                    </div>
                </div>
                <Link href={`/tenants/${subdomain}/console`}>
                    <Button variant="outline" size="sm" className="h-9 text-xs font-bold rounded-xl border-border bg-card">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Exit Kiosk
                    </Button>
                </Link>
            </div>

            {/* Main screen area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch relative z-10 overflow-hidden">
                {/* Left block: live scanning view */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-6">
                    {/* Scanner Input field */}
                    <form onSubmit={handleFormSubmit}>
                        <div className="relative">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Scan Barcode / RFID Tag or Type Email..."
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="w-full bg-card border-border h-16 px-5 pr-20 text-lg rounded-2xl font-bold tracking-wide placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-primary/20"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded uppercase tracking-widest">
                                    LIVE SCANNER
                                </span>
                            </div>
                        </div>
                    </form>

                    {/* Display Check-in Status Card */}
                    <Card className={cn(
                        "flex-1 rounded-3xl border p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden",
                        !lastScanResult 
                            ? "bg-card/45 border-border" 
                            : lastScanResult.success 
                                ? "bg-emerald-500/[0.04] border-emerald-500/30" 
                                : "bg-destructive/[0.04] border-destructive/30"
                    )}>
                        {!lastScanResult ? (
                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto border border-border">
                                    <MonitorPlay className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Awaiting Ingress Scans</h2>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                        Scan card credentials or search member index to test membership authorization.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg",
                                    lastScanResult.success 
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/10" 
                                        : "bg-destructive/10 border-destructive text-destructive shadow-destructive/10"
                                )}>
                                    {lastScanResult.success ? (
                                        <CheckCircle2 className="w-10 h-10" />
                                    ) : (
                                        <AlertOctagon className="w-10 h-10" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h2 className={cn(
                                        "text-4xl font-black italic uppercase tracking-tight",
                                        lastScanResult.success ? "text-emerald-500" : "text-destructive"
                                    )}>
                                        {lastScanResult.success ? "ACCESS GRANTED" : "ACCESS DENIED"}
                                    </h2>
                                    <p className="text-sm font-semibold text-foreground bg-muted px-4 py-1.5 rounded-full inline-block">
                                        {lastScanResult.message}
                                    </p>
                                </div>

                                {lastScanResult.member && (
                                    <div className="pt-6 border-t border-border/80 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-black mb-3">
                                            {lastScanResult.member.user?.firstName?.[0] || "M"}
                                        </div>
                                        <h3 className="text-lg font-black text-foreground">
                                            {lastScanResult.member.user?.firstName} {lastScanResult.member.user?.lastName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">{lastScanResult.member.user?.email}</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
                                            <div className="bg-background/80 border border-border p-3 rounded-2xl flex flex-col items-center">
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Status</span>
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    lastScanResult.member.status === "ACTIVE" ? "text-emerald-500" : "text-destructive"
                                                )}>{lastScanResult.member.status}</span>
                                            </div>
                                            <div className="bg-background/80 border border-border p-3 rounded-2xl flex flex-col items-center">
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Tokens</span>
                                                <span className="text-sm font-bold font-mono">{lastScanResult.member.tokensLeft} Left</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right block: Live log */}
                <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                    <Card className="flex-1 bg-card border-border rounded-3xl p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            <UserCheck className="w-4.5 h-4.5 text-primary" />
                            <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Recent Check-ins</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                            {history.slice(0, 10).map((item: any) => {
                                const checkInTimeStr = new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-background/60 rounded-2xl border border-border/80">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                                                {item.membership?.user?.firstName?.[0] || "M"}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-xs text-foreground">
                                                    {item.membership?.user?.firstName || "Member"} {item.membership?.user?.lastName || ""}
                                                </p>
                                                <span className="inline-block text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60 uppercase tracking-widest">
                                                    {item.authMethod}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-mono font-bold text-primary">{checkInTimeStr}</p>
                                            {item.checkoutTime && (
                                                <p className="text-[9px] text-muted-foreground">Checked out</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {history.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-12">No check-ins recorded today.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer console watermark */}
            <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10 border-t border-border pt-4">
                Powered by Strive Operating OS • Sandbox Active
            </div>
        </div>
    );
}
