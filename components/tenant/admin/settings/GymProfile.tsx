// components/tenant/admin/settings/GymProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Palette, Circle, CheckCircle2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SaveButton, SectionHeader } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import { cn } from "@/lib/utils";

interface GymProfileProps {
    tenantId: string;
    onComplete: () => void;
}

interface ProfileFormData {
    name: string;
    tagline: string;
    initials: string;
    phone: string;
    email: string;
    address: string;
    logoUrl: string;
    // --- Theme Configurations ---
    primaryColor: string;
    themeMode: "dark" | "light";
    radius: number;
    fontFamily: string;
}

// Quick Hex to HSL converter for the live preview
function hexToHslString(hex: string): string {
    const cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length !== 6) return "24 95% 53%"; // fallback stride orange

    let r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    let g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    let b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

const PRESET_COLORS = ["#ea580c", "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#0f172a"];

export function GymProfile({ tenantId, onComplete }: GymProfileProps) {
    const queryClient = useQueryClient();
    const [isManualInitials, setIsManualInitials] = useState(false);

    const [formData, setFormData] = useState<ProfileFormData>({
        name: "", tagline: "", initials: "", phone: "", email: "", address: "", logoUrl: "",
        primaryColor: "#ea580c",
        themeMode: "dark",
        radius: 0.5,
        fontFamily: "sans"
    });

    const generateInitials = (nameString: string): string => {
        if (!nameString) return "";
        const words = nameString.trim().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const { data: tenantData, isLoading } = useQuery({
        queryKey: ["tenantConfig", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/tenants/${tenantId}`, { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to load tenant configuration parameters.");
            return res.json();
        }
    });

    useEffect(() => {
        if (tenantData) {
            const fetchedName = tenantData.name || "";
            setFormData({
                name: fetchedName,
                tagline: tenantData.tagline || "Colombo's Premier Training Facility",
                initials: tenantData.initials || generateInitials(fetchedName),
                phone: tenantData.phone || "+94 11 234 5678",
                email: tenantData.email || "hello@fitforge.lk",
                address: tenantData.address || "42 Galle Road, Colombo 03",
                logoUrl: tenantData.themeConfig?.logoUrl || "",
                primaryColor: tenantData.themeConfig?.primaryColor || "#ea580c",
                themeMode: tenantData.themeConfig?.themeMode || "dark",
                radius: tenantData.themeConfig?.radius ?? 0.5,
                fontFamily: tenantData.themeConfig?.fontFamily || "sans"
            });
            if (tenantData.initials) setIsManualInitials(true);
        }
    }, [tenantData]);

    useEffect(() => {
        if (!isManualInitials && formData.name) {
            setFormData(prev => ({ ...prev, initials: generateInitials(prev.name) }));
        }
    }, [formData.name, isManualInitials]);

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: ProfileFormData) => {
            const res = await striveClientFetch("/api/v1/tenants", {
                method: "PATCH",
                headers: { "X-Tenant-ID": tenantId, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: payload.name,
                    themeConfig: {
                        primaryColor: payload.primaryColor,
                        logoUrl: payload.logoUrl,
                        themeMode: payload.themeMode,
                        radius: payload.radius,
                        fontFamily: payload.fontFamily
                    }
                })
            });
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast.success("Profile and visual theme deployed to Strive Core.");
            queryClient.invalidateQueries({ queryKey: ["tenantConfig", tenantId] });
            onComplete();
        },
        onError: (err: any) => toast.error(`Sync failed: ${err.message}`)
    });

    if (isLoading) return <div className="py-24 flex justify-center w-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    // Calculate dynamic styles for the preview card
    const previewStyles = {
        '--preview-primary': hexToHslString(formData.primaryColor),
        '--preview-radius': `${formData.radius}rem`,
        backgroundColor: formData.themeMode === 'dark' ? '#09090b' : '#ffffff',
        color: formData.themeMode === 'dark' ? '#fafafa' : '#09090b',
        borderColor: formData.themeMode === 'dark' ? '#27272a' : '#e4e4e7',
    } as React.CSSProperties;

    return (
        <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(formData); }} className="space-y-6">
            <SectionHeader title="Facility Identity & Theme" desc="Configure your brand name, contact info, and member-facing application design." />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Data Entry & Theme Controls */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Basic Info Card */}
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <LayoutTemplate className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Brand Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Gym Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-10 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Initials</Label>
                                <Input value={formData.initials} maxLength={4} onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })} className="h-10 text-center font-mono font-black" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Logo URL (Optional)</Label>
                            <Input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} className="h-10 text-sm font-mono" placeholder="https://..." />
                        </div>
                    </Card>

                    {/* Interactive Theme Builder Card */}
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <Palette className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Interactive Theme Builder</h3>
                        </div>

                        {/* Theme Mode & Radius */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">App Theme</Label>
                                <div className="flex gap-2">
                                    {(['dark', 'light'] as const).map(mode => (
                                        <div key={mode} onClick={() => setFormData({ ...formData, themeMode: mode })}
                                             className={cn("flex-1 p-3 rounded-md border cursor-pointer flex flex-col items-center gap-2 transition-all",
                                                 formData.themeMode === mode ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
                                             )}>
                                            <div className={cn("w-full h-8 rounded-sm border", mode === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200")} />
                                            <span className="text-xs font-bold capitalize">{mode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Border Radius</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 0.3, 0.5, 1.0].map(rad => (
                                        <div key={rad} onClick={() => setFormData({ ...formData, radius: rad })}
                                             className={cn("flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer h-[70px] transition-all",
                                                 formData.radius === rad ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
                                             )}>
                                            <div className="w-6 h-6 border-2 border-current opacity-70 mb-1" style={{ borderRadius: `${rad}rem` }} />
                                            <span className="text-[10px] font-bold">{rad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Primary Brand Color</Label>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Input type="color" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="p-1 h-10 w-14 cursor-pointer bg-transparent border-border shrink-0" />
                                <Input type="text" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="h-10 w-24 font-mono text-xs text-center uppercase" />

                                <div className="flex items-center gap-2 ml-4">
                                    {PRESET_COLORS.map(c => (
                                        <div key={c} onClick={() => setFormData({ ...formData, primaryColor: c })}
                                             className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                                             style={{ backgroundColor: c }}>
                                            {formData.primaryColor.toLowerCase() === c.toLowerCase() && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Live Interactive Preview */}
                <div className="xl:col-span-1">
                    <div className="sticky top-6 space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">Live Member App Preview</Label>

                        {/* The Sandbox injected with our local style variables */}
                        <div
                            className="border border-border overflow-hidden shadow-xl transition-all duration-300"
                            style={{
                                ...previewStyles,
                                borderRadius: `calc(var(--preview-radius) + 0.25rem)`
                            }}
                        >
                            {/* Mock Mobile Header */}
                            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: previewStyles.borderColor }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 flex items-center justify-center text-[10px] font-black text-white"
                                         style={{ backgroundColor: `hsl(var(--preview-primary))`, borderRadius: `calc(var(--preview-radius) - 2px)` }}>
                                        {formData.initials || "GM"}
                                    </div>
                                    <span className="font-bold text-sm truncate max-w-[120px]">{formData.name || "My Gym"}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-50"><Circle className="w-4 h-4" /></div>
                            </div>

                            {/* Mock Dashboard Content */}
                            <div className="p-4 space-y-4" style={{ backgroundColor: formData.themeMode === 'dark' ? '#09090b' : '#f4f4f5' }}>

                                {/* Mock Metric Card */}
                                <div className="p-4 shadow-sm border" style={{
                                    backgroundColor: formData.themeMode === 'dark' ? '#18181b' : '#ffffff',
                                    borderColor: previewStyles.borderColor,
                                    borderRadius: `var(--preview-radius)`
                                }}>
                                    <h4 className="text-xs font-medium opacity-70 mb-1">Upcoming Session</h4>
                                    <p className="text-lg font-black mb-3">Strength & Cond.</p>
                                    <button className="w-full h-9 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-md"
                                            style={{ backgroundColor: `hsl(var(--preview-primary))`, borderRadius: `calc(var(--preview-radius) - 2px)` }}>
                                        Check In Now
                                    </button>
                                </div>

                                {/* Mock List Item */}
                                <div className="flex items-center gap-3 p-3 border" style={{
                                    backgroundColor: formData.themeMode === 'dark' ? '#18181b' : '#ffffff',
                                    borderColor: previewStyles.borderColor,
                                    borderRadius: `var(--preview-radius)`
                                }}>
                                    <div className="w-10 h-10 flex items-center justify-center opacity-20"
                                         style={{ backgroundColor: `hsl(var(--preview-primary))`, borderRadius: `calc(var(--preview-radius) - 2px)` }}>
                                        <Circle className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">10 Tokens Left</span>
                                        <span className="text-[10px] opacity-60">Auto-renews in 5 days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">Modifications reflect instantly in the app upon saving.</p>
                    </div>
                </div>

            </div>

            <div className="pt-4 border-t border-border mt-6">
                <SaveButton isLoading={updateProfileMutation.isPending} />
            </div>
        </form>
    );
}