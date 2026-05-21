"use client";

import React, {useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {authClient} from "@/lib/auth-client"; // Native better-auth frontend reference hook
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {toast} from "sonner";
import {AlertCircle, Camera, Loader2, Lock, Mail, Phone, ShieldCheck, User, Wallet} from "lucide-react";

interface UserResponseDto {
    id: string;
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: string;
}

interface SettingsDashboardClientProps {
    initialToken: string;
    globalUser: { id: string; image?: string | null };
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function SettingsDashboardClient({initialToken, globalUser}: SettingsDashboardClientProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Password State Fields (Routed through Better-Auth/Keycloak client)
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // 1. Fetch Global Core Identity Profile
    const {data: profile, isLoading, isError} = useQuery<UserResponseDto>({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                }
            });
            if (!res.ok) throw new Error("Could not fetch global profile details.");
            return res.json();
        }
    });

    // 2. Profile Details Modification Mutation (NestJS Core Base Engine)
    const updateProfileMutation = useMutation({
        mutationFn: async (updatedData: { firstName: string; lastName: string; phone: string }) => {
            const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed validation rules checking.");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Profile Updated Successfully", {
                description: "Core environment variables propagated globally across all tenant modules.",
            });
            queryClient.invalidateQueries({queryKey: ["userProfile"]});
        },
        onError: (err: Error) => {
            toast.error("Profile Modification Fault", {description: err.message});
        }
    });

    // 3. Pre-signed Asset S3 Pipeline Upload Handshake
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Verify format restriction safely matching backend expectations
        if (!file.name.match(/\.(jpg|jpeg|png)$/i)) {
            toast.error("Invalid Format", {description: "Avatars must be standard jpg, jpeg, or png files."});
            return;
        }

        setIsUploading(true);
        try {
            // Step A: Request Pre-signed S3 allocation token from backend
            const urlRequest = await fetch(`${BASE_URL}/api/v1/files/upload-url`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    context: "AVATAR"
                })
            });

            if (!urlRequest.ok) throw new Error("Cloud boundary rejection of object allocation parameters.");
            const {uploadUrl, fileUrl} = await urlRequest.json();

            // Step B: Stream binary layout block straight to target cloud bucket
            const storageStream = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {"Content-Type": file.type}
            });

            if (!storageStream.ok) throw new Error("Object boundary transmission protocol failure.");

            // Step C: Link newly generated public bucket URL back into Auth Context
            await authClient.updateUser({
                image: fileUrl
            });

            toast.success("Avatar uploaded successfully!", {
                description: "New image synced across identity headers."
            });

            window.location.reload(); // Hard flush to force context updates to redraw sidebar/headers
        } catch (err: any) {
            toast.error("Upload Handshake Interrupted", {description: err.message});
        } finally {
            setIsUploading(false);
        }
    };

    // 4. Secure Authentication Credentials Mutation Boundary
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            toast.error("Validation Error", {description: "All parameter fields must be filled explicitly."});
            return;
        }

        setIsChangingPassword(true);
        // Routed via Native Client wrapper straight to security endpoint providers
        const {error} = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        });

        setIsChangingPassword(false);
        if (error) {
            toast.error("Credential Alteration Blocked", {description: error.message || "Security clearance reject."});
        } else {
            toast.success("Security Credentials Updated", {
                description: "Password mutated successfully. Other active platform instances revoked.",
            });
            setCurrentPassword("");
            setNewPassword("");
        }
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile) return;
        const formData = new FormData(e.currentTarget);

        updateProfileMutation.mutate({
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            phone: formData.get("phone") as string,
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <ShieldCheck size={12}/> Stride Security Identity System
                    </p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        Profile & Settings
                    </h1>
                    <p className="text-sm text-zinc-400 max-w-xl">
                        Modify your global master identity data parameters. Updates here ripple automatically across
                        connected gyms.
                    </p>
                </div>

                {/* Platform shortcut route straight back down into Wallet interface */}
                <Link href="/dashboard/payments" passHref>
                    <Button variant="outline"
                            className="rounded-xl border-white/5 bg-zinc-900 hover:bg-zinc-800 gap-2 text-xs uppercase font-bold tracking-tight h-11 px-5">
                        <Wallet size={14} className="text-primary"/> Manage Wallet
                    </Button>
                </Link>
            </div>

            {isLoading && (
                <div
                    className="flex items-center justify-center py-20 text-xs text-zinc-500 uppercase font-black tracking-widest gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary"/> Resolving Identity Record Matrices...
                </div>
            )}

            {isError && (
                <div
                    className="rounded-[2rem] border border-red-500/10 bg-red-500/5 p-8 text-center max-w-md mx-auto space-y-2">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto"/>
                    <p className="text-xs text-zinc-400">Failed to establish handshake verification logs with internal
                        registries.</p>
                </div>
            )}

            {!isLoading && !isError && profile && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Column: Avatar Interaction Workspace */}
                    <Card
                        className="bg-zinc-900 border-white/5 rounded-[2rem] overflow-hidden p-6 text-center space-y-6">
                        <div className="relative w-32 h-32 mx-auto group">
                            <div
                                className="w-32 h-32 rounded-full border-2 border-white/5 bg-zinc-950 overflow-hidden flex items-center justify-center text-4xl font-black text-zinc-500 uppercase italic">
                                {globalUser.image ? (
                                    <img src={globalUser.image} alt="Avatar" className="w-full h-full object-cover"/>
                                ) : (
                                    profile.firstName.substring(0, 2)
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center text-white text-xs font-bold uppercase gap-1 cursor-pointer disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera size={16}/>}
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-white">{profile.firstName} {profile.lastName}</h3>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 font-mono">
                                <Mail size={12}/> {profile.email}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Global ID Reference</span>
                                <span
                                    className="font-mono text-zinc-300 text-[10px] uppercase">{profile.id.substring(0, 13)}...</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Security Clearance</span>
                                <Badge variant="outline"
                                       className="border-emerald-500/10 bg-emerald-500/5 text-emerald-400 text-[9px] font-black uppercase tracking-tight">
                                    Verified footprint
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Middle Column: Core Parameter Changes (NestJS System Data Modifiers) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-zinc-900 border-white/5 rounded-[2rem] overflow-hidden p-6">
                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <h2 className="text-base font-bold uppercase italic tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                                    <User size={16} className="text-primary"/> Master Profile Specifications
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">First
                                            Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            defaultValue={profile.firstName}
                                            required
                                            className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Last
                                            Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            defaultValue={profile.lastName}
                                            required
                                            className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                        <Phone size={10}/> Contact Mobile (SL gateway schema structure format
                                        requirement)
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        defaultValue={profile.phone}
                                        placeholder="+94771234567"
                                        pattern="^\+94\d{9}$"
                                        required
                                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                    <p className="text-[10px] text-zinc-600 italic">Required format profile matching Sri
                                        Lankan SMS dispatch aggregators.</p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-tight px-6 rounded-xl h-10"
                                    >
                                        {updateProfileMutation.isPending ?
                                            <Loader2 className="w-3 h-3 animate-spin mr-2"/> : null}
                                        Commit Details
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        {/* Security Form Block: Credentials Update Boundary */}
                        <Card className="bg-zinc-900 border-white/5 rounded-[2rem] overflow-hidden p-6">
                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <h2 className="text-base font-bold uppercase italic tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Lock size={16} className="text-orange-500"/> Authentication Authority Parameters
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current
                                            Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New
                                            Password Target</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="bg-zinc-950 border border-white/5 hover:bg-zinc-900 text-white font-bold text-xs uppercase tracking-tight px-6 rounded-xl h-10 hover:text-primary"
                                    >
                                        {isChangingPassword ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : null}
                                        Update Password Passkey
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                </div>
            )}
        </div>
    );
}