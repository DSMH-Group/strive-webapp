// components/tenant/admin/settings/GymProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    RefreshCw,
    Palette,
    Circle,
    CheckCircle2,
    LayoutTemplate,
    Type,
    PanelLeft,
    Moon,
    ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SaveButton, SectionHeader } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import { cn } from "@/lib/utils";

interface GymProfileProps {
    tenantId: string;
    onComplete: () => void;
}

// 🚀 EXPANDED THEMES: 8 Total (4 Light, 4 Dark)
type AppThemeMode = "light" | "white" | "warm" | "cool" | "dark" | "midnight" | "navy" | "slate";

interface ProfileFormData {
    name: string;
    tagline: string;
    initials: string;
    phone: string;
    email: string;
    address: string;
    logoUrl: string;
    primaryColor: string;
    themeMode: AppThemeMode;
    radius: number;
    fontFamily: string;
    sidebarTheme: "default" | "dark" | "brand";
}

function hexToHslString(hex: string): string {
    const cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length !== 6) return "24 95% 53%";

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

// 🚀 ALL 8 THEME DEFINITIONS FOR PREVIEW
const THEME_OPTIONS: { id: AppThemeMode, label: string, bg: string, cardBg: string, border: string, text: string }[] = [
    { id: 'light', label: 'Light (Gray)', bg: '#f4f4f5', cardBg: '#ffffff', border: '#e4e4e7', text: '#09090b' },
    { id: 'white', label: 'Pure White', bg: '#ffffff', cardBg: '#ffffff', border: '#e4e4e7', text: '#09090b' },
    { id: 'warm', label: 'Warm Sand', bg: '#f5f0e6', cardBg: '#ffffff', border: '#e6dfd3', text: '#292524' },
    { id: 'cool', label: 'Cool Frost', bg: '#f1f5f9', cardBg: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
    { id: 'dark', label: 'Zinc Dark', bg: '#09090b', cardBg: '#18181b', border: '#27272a', text: '#fafafa' },
    { id: 'midnight', label: 'OLED Black', bg: '#000000', cardBg: '#0a0a0a', border: '#1f1f1f', text: '#ffffff' },
    { id: 'navy', label: 'Deep Navy', bg: '#020617', cardBg: '#0f172a', border: '#1e293b', text: '#f8fafc' },
    { id: 'slate', label: 'Soft Slate', bg: '#0f172a', cardBg: '#1e293b', border: '#334155', text: '#f1f5f9' },
];

export function GymProfile({ tenantId, onComplete }: GymProfileProps) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isManualInitials, setIsManualInitials] = useState(false);

    const [formData, setFormData] = useState<ProfileFormData>({
        name: "", tagline: "", initials: "", phone: "", email: "", address: "", logoUrl: "",
        primaryColor: "#ea580c",
        themeMode: "dark",
        radius: 0.5,
        fontFamily: "sans",
        sidebarTheme: "default"
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
            if (!res.ok) throw new Error("Failed to load tenant config.");
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
                fontFamily: tenantData.themeConfig?.fontFamily || "sans",
                sidebarTheme: tenantData.themeConfig?.sidebarTheme || "default"
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
                        fontFamily: payload.fontFamily,
                        sidebarTheme: payload.sidebarTheme
                    }
                })
            });
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast.success("Profile and visual theme deployed.");
            queryClient.invalidateQueries({ queryKey: ["tenantConfig", tenantId] });
            router.refresh();
            onComplete();
        },
        onError: (err: any) => toast.error(`Sync failed: ${err.message}`)
    });

    if (isLoading) return <div className="py-24 flex justify-center w-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    // --- Dynamic Preview Sandbox Variables ---
    const primaryHsl = hexToHslString(formData.primaryColor);
    const activeTheme = THEME_OPTIONS.find(t => t.id === formData.themeMode) || THEME_OPTIONS[4]; // Fallback to dark

    const isBrandSidebar = formData.sidebarTheme === 'brand';
    const isForcedDarkSidebar = formData.sidebarTheme === 'dark';
    const isLightMode = ['light', 'white', 'warm', 'cool'].includes(activeTheme.id);

    const previewSidebarStyles = {
        backgroundColor: isBrandSidebar
            ? `hsl(${primaryHsl})`
            : isForcedDarkSidebar
                ? '#09090b'
                : activeTheme.cardBg, // Matches the theme's default card/sidebar color

        color: (isBrandSidebar || isForcedDarkSidebar || !isLightMode)
            ? '#ffffff'
            : activeTheme.text,

        borderColor: isBrandSidebar
            ? `hsl(${primaryHsl})`
            : isForcedDarkSidebar
                ? '#27272a'
                : activeTheme.border,
    };

    const previewStyles = {
        '--preview-primary': primaryHsl,
        '--preview-radius': `${formData.radius}rem`,
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
        borderColor: activeTheme.border,
        fontFamily: `var(--font-${formData.fontFamily}), sans-serif`
    } as React.CSSProperties;

    return (
        <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(formData); }} className="space-y-6">
            <SectionHeader title="Facility Identity & Theme" desc="Configure your brand name, contact info, and member-facing application design." />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Logo URL
                            </Label>
                            <Input
                                value={formData.logoUrl}
                                placeholder="https://cdn.example.com/logo.png"
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                className="h-10 text-sm font-mono"
                            />
                        </div>
                    </Card>

                    {/* Interactive Theme Builder Card */}
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <Palette className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Interactive Theme Builder</h3>
                        </div>

                        {/* Theme Mode Selector (8 Options) */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Moon className="w-3 h-3"/> Base App Theme</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {THEME_OPTIONS.map(theme => (
                                    <div key={theme.id} onClick={() => setFormData({ ...formData, themeMode: theme.id })}
                                         className={cn("flex flex-col items-center gap-2 p-2 rounded-md border cursor-pointer transition-all",
                                             formData.themeMode === theme.id ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-muted-foreground/50"
                                         )}>
                                        <div className="w-full h-6 rounded border shadow-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }} />
                                        <span className="text-[10px] font-bold text-center leading-tight">{theme.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Colors & Fonts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Circle className="w-3 h-3"/> Brand Color</Label>
                                <div className="flex items-center gap-3">
                                    <Input type="color" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="p-1 h-10 w-14 cursor-pointer bg-transparent border-border shrink-0" />
                                    <Input type="text" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="h-10 flex-1 font-mono text-xs uppercase" />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    {PRESET_COLORS.map(c => (
                                        <div key={c} onClick={() => setFormData({ ...formData, primaryColor: c })}
                                             className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                                             style={{ backgroundColor: c }}>
                                            {formData.primaryColor.toLowerCase() === c.toLowerCase() && <CheckCircle2 className="w-3 h-3 text-white drop-shadow-md" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Type className="w-3 h-3"/> Typography</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'sans', name: 'Inter' },
                                        { id: 'poppins', name: 'Poppins' },
                                        { id: 'roboto', name: 'Roboto' },
                                        { id: 'serif', name: 'Merriweather' }
                                    ].map(font => (
                                        <div key={font.id} onClick={() => setFormData({ ...formData, fontFamily: font.id })}
                                             className={cn("p-2 border rounded-md cursor-pointer text-xs font-bold transition-all text-center",
                                                 formData.fontFamily === font.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/50"
                                             )}>
                                            {font.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Radius & Sidebar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">Border Radius</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 0.3, 0.5, 1.0].map(rad => (
                                        <div key={rad} onClick={() => setFormData({ ...formData, radius: rad })}
                                             className={cn("flex flex-col items-center justify-center p-2 rounded-md border cursor-pointer h-[50px] transition-all",
                                                 formData.radius === rad ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
                                             )}>
                                            <div className="w-4 h-4 border-2 border-current opacity-70 mb-1" style={{ borderRadius: `${rad}rem` }} />
                                            <span className="text-[10px] font-bold">{rad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><PanelLeft className="w-3 h-3"/> Sidebar Style</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'default', label: 'Match Theme' },
                                        { id: 'dark', label: 'Always Dark' },
                                        { id: 'brand', label: 'Brand Solid' }
                                    ].map(sb => (
                                        <div key={sb.id} onClick={() => setFormData({ ...formData, sidebarTheme: sb.id as any })}
                                             className={cn("flex-1 flex items-center justify-center p-2 border rounded-md cursor-pointer text-[10px] font-bold transition-all text-center h-[50px]",
                                                 formData.sidebarTheme === sb.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/50"
                                             )}>
                                            {sb.label}
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

                        <div
                            className="flex border border-border overflow-hidden shadow-xl transition-all duration-300 h-[400px]"
                            style={{
                                ...previewStyles,
                                borderRadius: `calc(var(--preview-radius) + 0.25rem)`
                            }}
                        >
                            {/* Desktop Sidebar Mockup */}
                            <div className="w-16 md:w-40 border-r flex flex-col transition-colors duration-300" style={previewSidebarStyles}>
                                <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: isBrandSidebar ? 'rgba(255,255,255,0.1)' : previewSidebarStyles.borderColor }}>
                                    <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[8px] font-black"
                                         style={{
                                             backgroundColor: isBrandSidebar ? '#ffffff' : `hsl(var(--preview-primary))`,
                                             color: isBrandSidebar ? `hsl(var(--preview-primary))` : '#ffffff',
                                             borderRadius: `calc(var(--preview-radius) - 2px)`
                                         }}>
                                        {formData.initials || "GM"}
                                    </div>
                                    <div className="hidden md:block text-[10px] font-bold truncate">Menu</div>
                                </div>
                                <div className="p-2 space-y-2 flex-1 opacity-70">
                                    <div className="h-6 rounded bg-current opacity-20 w-full" />
                                    <div className="h-6 rounded bg-current opacity-10 w-3/4" />
                                    <div className="h-6 rounded bg-current opacity-10 w-5/6" />
                                </div>
                            </div>

                            {/* Main Dashboard Content */}
                            <div className="flex-1 flex flex-col transition-colors duration-300" style={{ backgroundColor: activeTheme.bg }}>
                                {/* Header */}
                                <div className="h-14 border-b flex items-center justify-end px-4 transition-colors duration-300" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}>
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-50" style={{ backgroundColor: activeTheme.border }}><Circle className="w-3 h-3" /></div>
                                </div>

                                <div className="p-4 space-y-4 flex-1">
                                    <h2 className="text-lg font-black truncate">{formData.name || "My Gym"}</h2>

                                    {/* Mock Metric Card */}
                                    <div className="p-4 shadow-sm border transition-colors duration-300" style={{
                                        backgroundColor: activeTheme.cardBg,
                                        borderColor: activeTheme.border,
                                        borderRadius: `var(--preview-radius)`
                                    }}>
                                        <h4 className="text-xs font-medium opacity-70 mb-1">Upcoming</h4>
                                        <p className="text-sm font-bold mb-3">Strength Session</p>
                                        <button className="w-full h-8 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-md"
                                                style={{ backgroundColor: `hsl(var(--preview-primary))`, borderRadius: `calc(var(--preview-radius) - 2px)` }}>
                                            Check In
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">Preview simulates desktop structure and coloring.</p>
                    </div>
                </div>

            </div>

            <div className="pt-4 border-t border-border mt-6">
                <SaveButton isLoading={updateProfileMutation.isPending} />
            </div>
        </form>
    );
}