// app/tenants/[subdomain]/(admin)/settings/settingsClient.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Building2,
    CreditCard,
    ShieldCheck,
    Bell,
    Clock,
    Lock,
    Users2,
    ChevronRight,
    ArrowLeft,
    Save,
    Plus,
    Percent
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
    subdomain: string;
    tenantConfig: any;
}

type SettingsView = "MENU" | "PROFILE" | "PLANS" | "RULES" | "NOTIFICATIONS" | "HOURS" | "ACCESS" | "TEAM" | "TAX_GATEWAY";

export default function SettingsClient({ subdomain, tenantConfig }: SettingsClientProps) {
    const [currentView, setCurrentView] = useState<SettingsView>("MENU");

    // --- State Ingestion Framework (Mirroring provided UI structural schemas) ---
    const [profile, setProfile] = useState({
        name: "FitForge",
        tagline: "Colombo's Premier Training Facility",
        initials: "FF",
        phone: "+94 11 234 5678",
        email: "hello@fitforge.lk",
        address: "42 Galle Road, Colombo 03"
    });

    const [plans, setPlans] = useState([
        { id: "p1", name: "Basic", price: 8500, tokens: 8 },
        { id: "p2", name: "Standard", price: 12500, tokens: 12 },
        { id: "p3", name: "Premium", price: 18000, tokens: 20 },
    ]);

    const [rules, setRules] = useState({
        gracePeriod: 5,
        lowTokenAlert: 2,
        checkInWindow: 15,
        defaultSession: 60,
        cancellationNotice: 24
    });

    const [notifications, setNotifications] = useState({
        sessionReminder: true,
        paymentDue: true,
        lowToken: true,
        welcomeMessage: true,
        sessionLog: false,
        checkInAlert: false
    });

    const [operatingHours, setOperatingHours] = useState([
        { day: "Monday", open: "06:00", close: "21:00", active: true },
        { day: "Tuesday", open: "06:00", close: "21:00", active: true },
        { day: "Wednesday", open: "06:00", close: "21:00", active: true },
        { day: "Thursday", open: "06:00", close: "21:00", active: true },
        { day: "Friday", open: "06:00", close: "21:00", active: true },
        { day: "Saturday", open: "07:00", close: "18:00", active: true },
        { day: "Sunday", open: "00:00", close: "00:00", active: false },
    ]);

    const [accessControl, setAccessControl] = useState({
        selfCheckIn: true,
        trainerConfirms: false,
        memberCancellations: true,
        seeClassRoster: false,
        seeRevenue: false
    });

    const [team, setTeam] = useState([
        { id: "t1", name: "Ravi Kumara", role: "Trainer", email: "ravi@fitforge.lk", joined: "Jan 2024", active: true },
        { id: "t2", name: "Shani Liyanage", role: "Trainer", email: "shani@fitforge.lk", joined: "Mar 2023", active: true },
        { id: "t3", name: "Priya Mendis", role: "Admin", email: "priya@fitforge.lk", joined: "Jun 2022", active: true },
        { id: "t4", name: "Dinesh Perera", role: "Staff", email: "dinesh@fitforge.lk", joined: "Sep 2023", active: false },
    ]);

    const [taxGateway, setTaxGateway] = useState({
        vatPercentage: 18,
        ssclPercentage: 2.5,
        payhereMerchantId: "MID-1029384",
        payhereSecret: "••••••••••••••••••••••••"
    });

    const handleSaveChanges = (section: string) => {
        toast.success(`${section} modifications synchronized with Strive Core API.`);
        setCurrentView("MENU");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-white select-none animate-in fade-in duration-300">

            {/* Top Back Actions Bracket */}
            {currentView !== "MENU" && (
                <Button
                    onClick={() => setCurrentView("MENU")}
                    variant="ghost"
                    className="h-8 border border-white/5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white text-xs font-bold gap-2 px-3"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
            )}

            {/* View Switching Core Router Content Panels */}
            {currentView === "MENU" && (
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
                        <p className="text-xs text-zinc-500">Manage your facility settings and runtime variables</p>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                        <MenuListItem icon={<Building2 className="text-zinc-400" />} title="Gym Profile" desc="Name, branding, and contact info" onClick={() => setCurrentView("PROFILE")} />
                        <MenuListItem icon={<CreditCard className="text-zinc-400" />} title="Membership Plans" desc="Pricing and session token allocation" onClick={() => setCurrentView("PLANS")} />
                        <MenuListItem icon={<ShieldCheck className="text-zinc-400" />} title="Membership Rules" desc="Grace periods, thresholds, and windows" onClick={() => setCurrentView("RULES")} />
                        <MenuListItem icon={<Percent className="text-zinc-400" />} title="Tax & Payment Gateways" desc="VAT/SSCL variables and local gateway bindings" onClick={() => setCurrentView("TAX_GATEWAY")} />
                        <MenuListItem icon={<Bell className="text-zinc-400" />} title="Notifications" desc="Automated messages sent to members and trainers" onClick={() => setCurrentView("NOTIFICATIONS")} />
                        <MenuListItem icon={<Clock className="text-zinc-400" />} title="Operating Hours" desc="Days and times the gym is open for check-ins" onClick={() => setCurrentView("HOURS")} />
                        <MenuListItem icon={<Lock className="text-zinc-400" />} title="Access Control" desc="What members and trainers are permitted to do" onClick={() => setCurrentView("ACCESS")} />
                        <MenuListItem icon={<Users2 className="text-zinc-400" />} title="Team Members" desc="Trainers, staff, and admin accounts" onClick={() => setCurrentView("TEAM")} />
                    </div>
                </div>
            )}

            {/* 1. PROFILE SECTION SUBPANEL */}
            {currentView === "PROFILE" && (
                <div className="space-y-6">
                    <SectionHeader title="Gym Profile" desc="Branding and contact information" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gym Name</Label>
                                <Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-sm rounded-xl focus-visible:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tagline</Label>
                                <Input value={profile.tagline} onChange={(e) => setProfile({...profile, tagline: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-sm rounded-xl focus-visible:ring-primary/20" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Initials</Label>
                                <Input value={profile.initials} onChange={(e) => setProfile({...profile, initials: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-center font-bold text-sm rounded-xl" />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone</Label>
                                <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-sm rounded-xl" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</Label>
                                <Input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-sm rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address</Label>
                            <Input value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="bg-zinc-950 border-white/5 h-11 text-sm rounded-xl" />
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("Facility Identity Profile")} />
                    </Card>
                </div>
            )}

            {/* 2. PLANS SECTION SUBPANEL */}
            {currentView === "PLANS" && (
                <div className="space-y-6">
                    <SectionHeader title="Membership Plans" desc="Pricing and session token allocation per plan" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6">
                        <Table>
                            <TableHeader className="hover:bg-transparent border-b border-white/5">
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider pl-0">PLAN</TableHead>
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider">MONTHLY PRICE (LKR)</TableHead>
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider">SESSION TOKENS</TableHead>
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider text-right pr-0">ALLOCATION CAP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan, idx) => (
                                    <TableRow key={plan.id} className="border-b border-white/5 hover:bg-transparent">
                                        <TableCell className="pl-0 font-bold text-zinc-200 text-sm py-4">{plan.name}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={plan.price}
                                                onChange={(e) => {
                                                    const updated = [...plans];
                                                    updated[idx].price = Number(e.target.value);
                                                    setPlans(updated);
                                                }}
                                                className="w-36 bg-zinc-950 border-white/5 font-mono h-9 text-sm rounded-lg"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={plan.tokens}
                                                onChange={(e) => {
                                                    const updated = [...plans];
                                                    updated[idx].tokens = Number(e.target.value);
                                                    setPlans(updated);
                                                }}
                                                className="w-24 bg-zinc-950 border-white/5 font-mono h-9 text-sm rounded-lg"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right pr-0 text-xs font-bold text-zinc-500 font-mono">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full border border-white/5 bg-zinc-950/60",
                                                idx === 0 && "text-zinc-400",
                                                idx === 1 && "text-amber-400",
                                                idx === 2 && "text-cyan-400"
                                            )}>
                                                {plan.tokens} sessions/mo
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <SaveButton onClick={() => handleSaveChanges("Membership Matrix Strategy")} />
                    </Card>
                </div>
            )}

            {/* 3. RULES SECTION SUBPANEL */}
            {currentView === "RULES" && (
                <div className="space-y-6">
                    <SectionHeader title="Membership Rules" desc="Thresholds and windows that govern member status lifecycle transitions" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <RuleInputBox title="Grace Period" desc="Days after expiry before lockout kicks in" val={rules.gracePeriod} unit="days" onChange={(v) => setRules({...rules, gracePeriod: v})} />
                            <RuleInputBox title="Low Token Alert" desc="Warn member when balance hits this floor" val={rules.lowTokenAlert} unit="tokens" onChange={(v) => setRules({...rules, lowTokenAlert: v})} />
                            <RuleInputBox title="Check-in Window" desc="Minutes before session start to allow ingress access" val={rules.checkInWindow} unit="min" onChange={(v) => setRules({...rules, checkInWindow: v})} />
                            <RuleInputBox title="Default Session" desc="Standard block duration for assets or human resources" val={rules.defaultSession} unit="min" onChange={(v) => setRules({...rules, defaultSession: v})} />
                            <RuleInputBox title="Cancellation Notice" desc="Minimum notice required to drop a slot penalty-free" val={rules.cancellationNotice} unit="hrs" onChange={(v) => setRules({...rules, cancellationNotice: v})} />
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("Lifecycle State Machine Logic Rulesets")} />
                    </Card>
                </div>
            )}

            {/* 4. LOCAL TAXATION & PAYMENT GATEWAY MODIFIERS (Industry Standard addition) */}
            {currentView === "TAX_GATEWAY" && (
                <div className="space-y-6">
                    <SectionHeader title="Tax & Payment Gateways" desc="Configure dynamic local statutory taxes and digital tokenized gateway API contexts" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Sri Lankan Tax Architecture</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 font-bold">VAT Percentage (%)</Label>
                                    <Input type="number" value={taxGateway.vatPercentage} onChange={(e) => setTaxGateway({...taxGateway, vatPercentage: Number(e.target.value)})} className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 font-bold">SSCL Percentage (%)</Label>
                                    <Input type="number" value={taxGateway.ssclPercentage} onChange={(e) => setTaxGateway({...taxGateway, ssclPercentage: Number(e.target.value)})} className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">PayHere Gateway Synchronization</h4>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 font-bold">Merchant ID</Label>
                                    <Input value={taxGateway.payhereMerchantId} onChange={(e) => setTaxGateway({...taxGateway, payhereMerchantId: e.target.value})} className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 font-bold">Secret Key</Label>
                                    <Input type="password" value={taxGateway.payhereSecret} onChange={(e) => setTaxGateway({...taxGateway, payhereSecret: e.target.value})} className="bg-zinc-950 border-white/5 h-10 text-sm rounded-xl font-mono" />
                                </div>
                            </div>
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("Financial Ledger & Gateway Core Overrides")} />
                    </Card>
                </div>
            )}

            {/* 5. NOTIFICATIONS SECTION SUBPANEL */}
            {currentView === "NOTIFICATIONS" && (
                <div className="space-y-6">
                    <SectionHeader title="Notifications" desc="Automated communication streams routed via Resend and Text.lk relays" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6 overflow-hidden">
                        <div className="divide-y divide-white/5">
                            <ToggleRow title="Session reminder" desc="Notify member 24 hrs before their session booking starts" checked={notifications.sessionReminder} onChange={(v) => setNotifications({...notifications, sessionReminder: v})} />
                            <ToggleRow title="Payment due reminder" desc="Alert member via automated SMS 7 days before membership token expiration" checked={notifications.paymentDue} onChange={(v) => setNotifications({...notifications, paymentDue: v})} />
                            <ToggleRow title="Low token alert" desc="Message member automatically when available consumable assets drop below fallback levels" checked={notifications.lowToken} onChange={(v) => setNotifications({...notifications, lowToken: v})} />
                            <ToggleRow title="Welcome message" desc="Send automated welcome payload packet to new members upon core identity linkage" checked={notifications.welcomeMessage} onChange={(v) => setNotifications({...notifications, welcomeMessage: v})} />
                            <ToggleRow title="Session log confirmation" desc="Notify member immediately after a coach updates personal session tracking statistics" checked={notifications.sessionLog} onChange={(v) => setNotifications({...notifications, sessionLog: v})} />
                            <ToggleRow title="Check-in alert to trainer" desc="Ping coach accounts immediately when an assigned athlete handles hardware ingress validation" checked={notifications.checkInAlert} onChange={(v) => setNotifications({...notifications, checkInAlert: v})} />
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("Communication Dispatch Rules")} />
                    </Card>
                </div>
            )}

            {/* 6. OPERATING HOURS SECTION SUBPANEL */}
            {currentView === "HOURS" && (
                <div className="space-y-6">
                    <SectionHeader title="Operating Hours" desc="Days and times the gym facility environment is open to receive check-ins" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6">
                        <div className="space-y-3.5">
                            {operatingHours.map((sched, idx) => (
                                <div key={sched.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-950/40 border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-4 w-32">
                                        <Switch
                                            checked={sched.active}
                                            onCheckedChange={(v) => {
                                                const updated = [...operatingHours];
                                                updated[idx].active = v;
                                                setOperatingHours(updated);
                                            }}
                                        />
                                        <span className={cn("text-xs font-bold", sched.active ? "text-zinc-200" : "text-zinc-600 line-through")}>{sched.day}</span>
                                    </div>

                                    {sched.active ? (
                                        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                                            <Input type="text" value={sched.open} onChange={(e) => {
                                                const updated = [...operatingHours];
                                                updated[idx].open = e.target.value;
                                                setOperatingHours(updated);
                                            }} className="w-20 bg-zinc-900 border-white/5 h-8 text-center rounded-lg text-xs" />
                                            <span>to</span>
                                            <Input type="text" value={sched.close} onChange={(e) => {
                                                const updated = [...operatingHours];
                                                updated[idx].close = e.target.value;
                                                setOperatingHours(updated);
                                            }} className="w-20 bg-zinc-900 border-white/5 h-8 text-center rounded-lg text-xs" />
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-2.5 py-1 rounded border border-white/5">Closed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("Ingress Access Windows")} />
                    </Card>
                </div>
            )}

            {/* 7. ACCESS CONTROL SECTION SUBPANEL */}
            {currentView === "ACCESS" && (
                <div className="space-y-6">
                    <SectionHeader title="Access Control" desc="Granular vertical permission rules outlining what consumers and coach profiles are permitted to action" />
                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6">
                        <div className="divide-y divide-white/5">
                            <ToggleRow title="Member self check-in" desc="Allow consumer accounts to execute entry transactions via personal QR/IoT parameters without front-desk manual override steps" checked={accessControl.selfCheckIn} onChange={(v) => setAccessControl({...accessControl, selfCheckIn: v})} />
                            <ToggleRow title="Trainer confirms session logs" desc="Forced validation boundary: session metric logs are locked until assigned trainer profile approves data states" checked={accessControl.trainerConfirms} onChange={(v) => setAccessControl({...accessControl, trainerConfirms: v})} />
                            <ToggleRow title="Member-initiated cancellations" desc="Permit end-consumers to drop resource reservations directly inside threshold parameters via the B2C portal app layer" checked={accessControl.memberCancellations} onChange={(v) => setAccessControl({...accessControl, memberCancellations: v})} />
                            <ToggleRow title="Members see class roster" desc="Expose community profiles: allow linked users to view fellow attendees checked into a current scheduling block" checked={accessControl.seeClassRoster} onChange={(v) => setAccessControl({...accessControl, seeClassRoster: v})} />
                            <ToggleRow title="Trainers see revenue data" desc="Platform visibility override: allow horizontal visibility of raw tenant revenue metrics and financial dashboards on standard trainer screens" checked={accessControl.seeRevenue} onChange={(v) => setAccessControl({...accessControl, seeRevenue: v})} />
                        </div>
                        <SaveButton onClick={() => handleSaveChanges("RBAC Workspace Scoping Rules")} />
                    </Card>
                </div>
            )}

            {/* 8. TEAM MEMBERS SECTION SUBPANEL */}
            {currentView === "TEAM" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Team Members" desc="Manage access permissions for trainers, operational management staff, and admin personnel" />
                        <Button
                            onClick={() => toast.success("Dispatching SMS link payload via Text.lk API endpoints...")}
                            className="bg-zinc-900 text-amber-500 border border-amber-500/10 hover:bg-zinc-800 text-xs font-black rounded-xl h-10 gap-1.5 px-4"
                        >
                            <Plus className="w-3.5 h-3.5" /> Invite
                        </Button>
                    </div>

                    <Card className="bg-zinc-900/30 border-white/5 rounded-2xl p-6">
                        <Table>
                            <TableHeader className="border-b border-white/5">
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider pl-0">OPERATOR IDENTITY</TableHead>
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider">SYSTEM BOUNDARY ROLE</TableHead>
                                    <TableHead className="text-xs text-zinc-500 font-bold tracking-wider text-right pr-0">STATUS OVERRIDE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.map((person, idx) => (
                                    <TableRow key={person.id} className="border-b border-white/5 hover:bg-transparent">
                                        <TableCell className="pl-0 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 border border-white/5">
                                                    {person.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-zinc-200">{person.name}</span>
                                                    <span className="text-xs text-zinc-500 font-mono mt-0.5">{person.email} · since {person.joined}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border font-mono tracking-wider",
                                                person.role === "Admin" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : person.role === "Trainer" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            )}>
                                                {person.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-0">
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    const updated = [...team];
                                                    updated[idx].active = !updated[idx].active;
                                                    setTeam(updated);
                                                    toast.info(`Updated structural activity state for ${person.name}`);
                                                }}
                                                className={cn(
                                                    "h-8 text-xs font-bold uppercase rounded-xl border px-3 transition-colors",
                                                    person.active ? "bg-red-950/10 text-red-500 border-red-500/10 hover:bg-red-950/30" : "bg-emerald-950/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-950/30"
                                                )}
                                            >
                                                {person.active ? "Deactivate" : "Activate"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

        </div>
    );
}

// --- Dynamic Visual Component Extensions ---

function MenuListItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-zinc-950/20 hover:bg-zinc-900/60 transition-colors group cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-950 border border-white/5 rounded-xl group-hover:border-primary/20 transition-colors">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">{title}</span>
                    <span className="text-xs text-zinc-500 mt-0.5">{desc}</span>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
        </div>
    );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="space-y-0.5 border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
            <p className="text-xs text-zinc-500">{desc}</p>
        </div>
    );
}

function RuleInputBox({ title, desc, val, unit, onChange }: { title: string; desc: string; val: number; unit: string; onChange: (v: number) => void }) {
    return (
        <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl flex flex-col gap-3">
            <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-zinc-300">{title}</h4>
                <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
            </div>
            <div className="flex items-center gap-2 font-mono mt-auto">
                <Input
                    type="number"
                    value={val}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-20 bg-zinc-900 border-white/5 h-8 text-center text-xs font-bold rounded-lg"
                />
                <span className="text-xs text-zinc-500 font-bold">{unit}</span>
            </div>
        </div>
    );
}

function ToggleRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
            <div className="space-y-0.5 max-w-xl">
                <h4 className="text-xs font-bold text-zinc-200">{title}</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">{desc}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
        </div>
    );
}

function SaveButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
            <Button
                onClick={onClick}
                className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs h-10 gap-1.5 px-5 rounded-xl shadow-lg shadow-amber-500/5"
            >
                <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
        </div>
    );
}