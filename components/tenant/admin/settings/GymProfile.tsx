// components/tenant/admin/settings/GymProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SectionHeader, SaveButton } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";

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
    primaryColor: string;
}

export function GymProfile({ tenantId, onComplete }: GymProfileProps) {
    const queryClient = useQueryClient();
    const [isManualInitials, setIsManualInitials] = useState(false);

    const [formData, setFormData] = useState<ProfileFormData>({
        name: "",
        tagline: "",
        initials: "",
        phone: "",
        email: "",
        address: "",
        logoUrl: "",
        primaryColor: "#ea580c"
    });

    // --- Helper: Auto-generate Initials ---
    const generateInitials = (nameString: string): string => {
        if (!nameString) return "";
        const words = nameString.trim().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // --- Fetch Public/Private Config via Resolve/Tenant Stack ---
    const { isLoading } = useQuery({
        queryKey: ["tenantConfig", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/tenants/${tenantId}`, {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to load tenant configuration parameters.");
            return res.json();
        },
        meta: {
            onSuccess: (data: any) => {
                if (data) {
                    const fetchedName = data.name || "";
                    setFormData({
                        name: fetchedName,
                        tagline: data.tagline || "Colombo's Premier Training Facility",
                        initials: data.initials || generateInitials(fetchedName),
                        phone: data.phone || "+94 11 234 5678",
                        email: data.email || "hello@fitforge.lk",
                        address: data.address || "42 Galle Road, Colombo 03",
                        logoUrl: data.themeConfig?.logoUrl || "",
                        primaryColor: data.themeConfig?.primaryColor || "#ea580c"
                    });
                    if (data.initials) setIsManualInitials(true);
                }
            }
        }
    });

    // Automatically calculate fallback initials when name drops or changes, unless overriden
    useEffect(() => {
        if (!isManualInitials && formData.name) {
            setFormData(prev => ({ ...prev, initials: generateInitials(prev.name) }));
        }
    }, [formData.name, isManualInitials]);

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: ProfileFormData) => {
            const res = await striveClientFetch("/api/v1/tenants", {
                method: "PATCH",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: payload.name,
                    themeConfig: {
                        primaryColor: payload.primaryColor,
                        logoUrl: payload.logoUrl || "https://s3.amazonaws.com/logo.png" // Fallback guard
                    },
                    // Appending extra local variables into payload parameters securely
                    businessRules: {
                        defaultCurrency: "LKR"
                    }
                })
            });
            if (!res.ok) throw new Error(`Server returned HTTP State code: ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast.success("Gym system profile context successfully committed to Strive Core.");
            queryClient.invalidateQueries({ queryKey: ["tenantConfig", tenantId] });
            onComplete();
        },
        onError: (err: any) => {
            toast.error(`Identity sync structural exception: ${err.message}`);
        }
    });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Facility namespace tracking variable cannot be empty.");
            return;
        }
        updateProfileMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="py-24 flex items-center justify-center w-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <SectionHeader title="Gym Profile" desc="Branding, visual identity markers, and partner contact definitions" />

            <Card className="bg-card/30 border-border rounded-lg p-6 space-y-6">
                {/* Core Naming Segment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gym Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-background border-border h-11 text-sm rounded-md font-medium"
                            placeholder="e.g. Power World Gyms"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tagline</Label>
                        <Input
                            value={formData.tagline}
                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                            className="bg-background border-border h-11 text-sm rounded-md"
                            placeholder="Motto or identifier statement"
                        />
                    </div>
                </div>

                {/* Identity Config Tools & Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Initials</Label>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium text-muted-foreground">Override</span>
                                <Switch
                                    checked={isManualInitials}
                                    onCheckedChange={(checked) => {
                                        setIsManualInitials(checked);
                                        if (!checked) setFormData(prev => ({ ...prev, initials: generateInitials(prev.name) }));
                                    }}
                                    className="scale-75"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <Input
                                value={formData.initials}
                                disabled={!isManualInitials}
                                maxLength={4}
                                onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                                className="bg-background border-border h-11 text-center font-black tracking-wider text-sm rounded-md uppercase disabled:opacity-60 font-mono"
                            />
                            {!isManualInitials && (
                                <RefreshCw className="w-3 h-3 text-muted-foreground/50 absolute right-3 top-4 animate-pulse" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Theme Hex</Label>
                        <div className="flex gap-2">
                            <div
                                className="w-11 h-11 rounded-md border border-border shrink-0 transition-transform shadow-inner"
                                style={{ backgroundColor: formData.primaryColor }}
                            />
                            <Input
                                value={formData.primaryColor}
                                maxLength={7}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                className="bg-background border-border h-11 font-mono text-xs rounded-md"
                                placeholder="#ea580c"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo Remote URI</Label>
                        <Input
                            type="url"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                            className="bg-background border-border h-11 text-xs rounded-md font-mono"
                            placeholder="https://s3.amazonaws.com/logo.png"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Operational Direct Line</Label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-background border-border h-11 text-sm rounded-md font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System Billing/Admin Email</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-background border-border h-11 text-sm rounded-md font-mono"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Physical Street Address</Label>
                    <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="bg-background border-border h-11 text-sm rounded-md"
                    />
                </div>

                <SaveButton isLoading={updateProfileMutation.isPending} />
            </Card>
        </form>
    );
}