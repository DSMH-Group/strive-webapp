// app/tenants/[subdomain]/(admin)/settings/settingsClient.tsx
"use client";

import React, {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
    ArrowLeft,
    Bell,
    Building2,
    ChevronRight,
    Clock,
    CreditCard,
    Loader2,
    Lock,
    Percent,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    Users2
} from "lucide-react";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import {striveClientFetch} from "@/lib/api";

interface SettingsClientProps {
    subdomain: string;
    tenantId: string;
}

type SettingsView =
    "MENU"
    | "PROFILE"
    | "PLANS"
    | "RULES"
    | "NOTIFICATIONS"
    | "HOURS"
    | "ACCESS"
    | "TEAM"
    | "TAX_GATEWAY";

export default function SettingsClient({subdomain, tenantId}: SettingsClientProps) {
    const queryClient = useQueryClient();
    const [currentView, setCurrentView] = useState<SettingsView>("MENU");

    // ====================================================================
    // 🚀 LIVE DATA INTEGRATION: PLAN CONFIGURATOR
    // ====================================================================
    const [localPlans, setLocalPlans] = useState<any[]>([]);

    const {data: fetchedPlans = [], isLoading: plansLoading} = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans?includeInactive=true", {
                headers: {"X-Tenant-ID": tenantId}
            });
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        },
        enabled: currentView === "PLANS"
    });

    useEffect(() => {
        if (fetchedPlans) {
            setLocalPlans(fetchedPlans.map((p: any) => ({...p, isDirty: false})));
        }
    }, [fetchedPlans]);

    const savePlansMutation = useMutation({
        mutationFn: async (plansToProcess: any[]) => {
            const headers = {"X-Tenant-ID": tenantId, "Content-Type": "application/json"};

            // 🚀 FIX 2: Strict execution blocks to prevent overlap
            const promises = plansToProcess.map(plan => {
                // If it was marked as deleted...
                if (plan.isDeleted) {
                    if (!plan.isNew) {
                        // Only send DELETE to backend if it actually existed in the DB
                        return striveClientFetch(`/api/v1/plans/${plan.id}`, {method: 'DELETE', headers});
                    }
                    return Promise.resolve(); // If it was new AND deleted, just ignore it
                }

                // If it's brand new (even if it's dirty)
                if (plan.isNew) {
                    return striveClientFetch(`/api/v1/plans`, {
                        method: 'POST',
                        body: JSON.stringify({
                            name: plan.name,
                            monthlyPrice: Number(plan.monthlyPrice),
                            sessionTokens: Number(plan.sessionTokens)
                        }),
                        headers
                    });
                }

                // If it's an existing plan that was modified
                if (plan.isDirty) {
                    return striveClientFetch(`/api/v1/plans/${plan.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name: plan.name,
                            monthlyPrice: Number(plan.monthlyPrice),
                            sessionTokens: Number(plan.sessionTokens)
                        }),
                        headers
                    });
                }

                return Promise.resolve(); // No changes made to this plan
            });

            await Promise.all(promises);
        },
        onSuccess: () => {
            toast.success("Membership plans synchronized with Strive Core.");
            queryClient.invalidateQueries({queryKey: ["tenantPlans", tenantId]});
            setCurrentView("MENU");
        },
        onError: (err: any) => toast.error(`Failed to save plans: ${err.message}`)
    });

    const handleSavePlans = () => {
        savePlansMutation.mutate(localPlans);
    };

    const handleAddPlan = () => {
        setLocalPlans([
            ...localPlans,
            {id: `temp-${Date.now()}`, name: "New Plan", monthlyPrice: 0, sessionTokens: 0, isNew: true}
        ]);
    };

    // 🚀 FIX 1: Update based on ID, not array index!
    const updateLocalPlan = (id: string, field: string, value: any) => {
        setLocalPlans(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value, isDirty: true } : p
        ));
    };


    // --- Mock State Ingestion Framework (For non-integrated tabs) ---
    const [profile, setProfile] = useState({
        name: "FitForge", tagline: "Colombo's Premier Training Facility", initials: "FF",
        phone: "+94 11 234 5678", email: "hello@fitforge.lk", address: "42 Galle Road, Colombo 03"
    });
    const [rules, setRules] = useState({
        gracePeriod: 5, lowTokenAlert: 2, checkInWindow: 15, defaultSession: 60, cancellationNotice: 24
    });
    const [notifications, setNotifications] = useState({
        sessionReminder: true, paymentDue: true, lowToken: true, welcomeMessage: true, sessionLog: false, checkInAlert: false
    });
    const [operatingHours, setOperatingHours] = useState([
        {day: "Monday", open: "06:00", close: "21:00", active: true}, {day: "Tuesday", open: "06:00", close: "21:00", active: true},
        {day: "Wednesday", open: "06:00", close: "21:00", active: true}, {day: "Thursday", open: "06:00", close: "21:00", active: true},
        {day: "Friday", open: "06:00", close: "21:00", active: true}, {day: "Saturday", open: "07:00", close: "18:00", active: true},
        {day: "Sunday", open: "00:00", close: "00:00", active: false},
    ]);
    const [accessControl, setAccessControl] = useState({
        selfCheckIn: true, trainerConfirms: false, memberCancellations: true, seeClassRoster: false, seeRevenue: false
    });
    const [team, setTeam] = useState([
        {id: "t1", name: "Ravi Kumara", role: "Trainer", email: "ravi@fitforge.lk", joined: "Jan 2024", active: true},
        {id: "t2", name: "Shani Liyanage", role: "Trainer", email: "shani@fitforge.lk", joined: "Mar 2023", active: true},
        {id: "t3", name: "Priya Mendis", role: "Admin", email: "priya@fitforge.lk", joined: "Jun 2022", active: true}
    ]);
    const [taxGateway, setTaxGateway] = useState({
        vatPercentage: 18, ssclPercentage: 2.5, payhereMerchantId: "MID-1029384", payhereSecret: "••••••••••••••••"
    });

    const handleSaveChangesMock = (section: string) => {
        toast.success(`${section} modifications synchronized with Strive Core API.`);
        setCurrentView("MENU");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-foreground select-none animate-in fade-in duration-500">

            {currentView !== "MENU" && (
                <Button
                    onClick={() => setCurrentView("MENU")}
                    variant="ghost"
                    className="h-8 border border-border bg-card rounded-md text-muted-foreground hover:text-foreground text-xs font-bold gap-2 px-3"
                >
                    <ArrowLeft className="w-3.5 h-3.5"/> Back
                </Button>
            )}

            {currentView === "MENU" && (
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
                        <p className="text-xs text-muted-foreground">Manage your facility settings and runtime variables</p>
                    </div>
                    <div className="bg-card/40 border border-border rounded-lg overflow-hidden divide-y divide-border">
                        <MenuListItem icon={<Building2 className="text-muted-foreground"/>} title="Gym Profile" desc="Name, branding, and contact info" onClick={() => setCurrentView("PROFILE")}/>
                        <MenuListItem icon={<CreditCard className="text-primary"/>} title="Membership Plans" desc="Pricing and session token allocation" onClick={() => setCurrentView("PLANS")}/>
                        <MenuListItem icon={<ShieldCheck className="text-muted-foreground"/>} title="Membership Rules" desc="Grace periods, thresholds, and windows" onClick={() => setCurrentView("RULES")}/>
                        <MenuListItem icon={<Percent className="text-muted-foreground"/>} title="Tax & Payment Gateways" desc="VAT/SSCL variables and local gateway bindings" onClick={() => setCurrentView("TAX_GATEWAY")}/>
                        <MenuListItem icon={<Bell className="text-muted-foreground"/>} title="Notifications" desc="Automated messages sent to members and trainers" onClick={() => setCurrentView("NOTIFICATIONS")}/>
                        <MenuListItem icon={<Clock className="text-muted-foreground"/>} title="Operating Hours" desc="Days and times the gym is open for check-ins" onClick={() => setCurrentView("HOURS")}/>
                        <MenuListItem icon={<Lock className="text-muted-foreground"/>} title="Access Control" desc="What members and trainers are permitted to do" onClick={() => setCurrentView("ACCESS")}/>
                        <MenuListItem icon={<Users2 className="text-muted-foreground"/>} title="Team Members" desc="Trainers, staff, and admin accounts" onClick={() => setCurrentView("TEAM")}/>
                    </div>
                </div>
            )}

            {currentView === "PROFILE" && (
                <div className="space-y-6">
                    <SectionHeader title="Gym Profile" desc="Branding and contact information"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gym Name</Label>
                                <Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="bg-background border-border h-11 text-sm rounded-md"/>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tagline</Label>
                                <Input value={profile.tagline} onChange={(e) => setProfile({...profile, tagline: e.target.value})} className="bg-background border-border h-11 text-sm rounded-md"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Initials</Label>
                                <Input value={profile.initials} onChange={(e) => setProfile({...profile, initials: e.target.value})} className="bg-background border-border h-11 text-center font-bold text-sm rounded-md"/>
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
                                <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="bg-background border-border h-11 text-sm rounded-md"/>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                                <Input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="bg-background border-border h-11 text-sm rounded-md"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</Label>
                            <Input value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="bg-background border-border h-11 text-sm rounded-md"/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Facility Identity Profile")}/>
                    </Card>
                </div>
            )}

            {/* 🚀 LIVE: PLANS SECTION SUBPANEL */}
            {currentView === "PLANS" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Membership Plans" desc="Pricing and session token allocation per plan"/>
                        <Button
                            onClick={handleAddPlan}
                            variant="outline"
                            className="h-9 gap-1.5 text-xs font-bold border-border bg-background"
                        >
                            <Plus className="w-3.5 h-3.5 text-primary"/> Add Plan
                        </Button>
                    </div>

                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        {plansLoading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>
                        ) : (
                            <Table>
                                <TableHeader className="hover:bg-transparent border-b border-border">
                                    <TableRow className="border-b border-border hover:bg-transparent">
                                        <TableHead className="text-xs text-muted-foreground font-bold tracking-wider pl-0 w-1/3">PLAN NAME</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">PRICE (LKR)</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">TOKENS</TableHead>
                                        <TableHead className="text-xs text-muted-foreground font-bold tracking-wider text-right pr-0">ACTION</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localPlans.filter(p => !p.isDeleted).map((plan) => (
                                        <TableRow key={plan.id} className="border-b border-border hover:bg-transparent group">
                                            <TableCell className="pl-0 py-3">
                                                <Input
                                                    type="text"
                                                    value={plan.name}
                                                    onChange={(e) => updateLocalPlan(plan.id, 'name', e.target.value)}
                                                    className="w-full bg-background border-border font-bold h-9 text-sm rounded-sm"
                                                    placeholder="e.g. Standard"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Input
                                                    type="number"
                                                    value={plan.monthlyPrice}
                                                    onChange={(e) => updateLocalPlan(plan.id, 'monthlyPrice', Number(e.target.value))}
                                                    className="w-32 bg-background border-border font-mono h-9 text-sm rounded-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Input
                                                    type="number"
                                                    value={plan.sessionTokens}
                                                    onChange={(e) => updateLocalPlan(plan.id, 'sessionTokens', Number(e.target.value))}
                                                    className="w-24 bg-background border-border font-mono h-9 text-sm rounded-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right pr-0 py-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateLocalPlan(plan.id, 'isDeleted', true)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {localPlans.filter(p => !p.isDeleted).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs italic">
                                                No plans configured. Create one to allow members to subscribe.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                        <SaveButton isLoading={savePlansMutation.isPending} onClick={handleSavePlans}/>
                    </Card>
                </div>
            )}

            {currentView === "RULES" && (
                <div className="space-y-6">
                    <SectionHeader title="Membership Rules" desc="Thresholds and windows that govern member status lifecycle transitions"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <RuleInputBox title="Grace Period" desc="Days after expiry before lockout kicks in" val={rules.gracePeriod} unit="days" onChange={(v) => setRules({...rules, gracePeriod: v})}/>
                            <RuleInputBox title="Low Token Alert" desc="Warn member when balance hits this floor" val={rules.lowTokenAlert} unit="tokens" onChange={(v) => setRules({...rules, lowTokenAlert: v})}/>
                            <RuleInputBox title="Check-in Window" desc="Minutes before session start to allow ingress access" val={rules.checkInWindow} unit="min" onChange={(v) => setRules({...rules, checkInWindow: v})}/>
                            <RuleInputBox title="Default Session" desc="Standard block duration for assets or human resources" val={rules.defaultSession} unit="min" onChange={(v) => setRules({...rules, defaultSession: v})}/>
                            <RuleInputBox title="Cancellation Notice" desc="Minimum notice required to drop a slot penalty-free" val={rules.cancellationNotice} unit="hrs" onChange={(v) => setRules({...rules, cancellationNotice: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Lifecycle State Machine Logic Rulesets")}/>
                    </Card>
                </div>
            )}

            {currentView === "TAX_GATEWAY" && (
                <div className="space-y-6">
                    <SectionHeader title="Tax & Payment Gateways" desc="Configure dynamic local statutory taxes and digital tokenized gateway API contexts"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">Sri Lankan Tax Architecture</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">VAT Percentage (%)</Label>
                                    <Input type="number" value={taxGateway.vatPercentage} onChange={(e) => setTaxGateway({...taxGateway, vatPercentage: Number(e.target.value)})} className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">SSCL Percentage (%)</Label>
                                    <Input type="number" value={taxGateway.ssclPercentage} onChange={(e) => setTaxGateway({...taxGateway, ssclPercentage: Number(e.target.value)})} className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">PayHere Gateway Synchronization</h4>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">Merchant ID</Label>
                                    <Input value={taxGateway.payhereMerchantId} onChange={(e) => setTaxGateway({...taxGateway, payhereMerchantId: e.target.value})} className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">Secret Key</Label>
                                    <Input type="password" value={taxGateway.payhereSecret} onChange={(e) => setTaxGateway({...taxGateway, payhereSecret: e.target.value})} className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                            </div>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Financial Ledger & Gateway Core Overrides")}/>
                    </Card>
                </div>
            )}

            {currentView === "NOTIFICATIONS" && (
                <div className="space-y-6">
                    <SectionHeader title="Notifications" desc="Automated communication streams routed via Resend and Text.lk relays"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6 overflow-hidden">
                        <div className="divide-y divide-border">
                            <ToggleRow title="Session reminder" desc="Notify member 24 hrs before their session booking starts" checked={notifications.sessionReminder} onChange={(v) => setNotifications({...notifications, sessionReminder: v})}/>
                            <ToggleRow title="Payment due reminder" desc="Alert member via automated SMS 7 days before membership token expiration" checked={notifications.paymentDue} onChange={(v) => setNotifications({...notifications, paymentDue: v})}/>
                            <ToggleRow title="Low token alert" desc="Message member automatically when available consumable assets drop below fallback levels" checked={notifications.lowToken} onChange={(v) => setNotifications({...notifications, lowToken: v})}/>
                            <ToggleRow title="Welcome message" desc="Send automated welcome payload packet to new members upon core identity linkage" checked={notifications.welcomeMessage} onChange={(v) => setNotifications({...notifications, welcomeMessage: v})}/>
                            <ToggleRow title="Session log confirmation" desc="Notify member immediately after a coach updates personal session tracking statistics" checked={notifications.sessionLog} onChange={(v) => setNotifications({...notifications, sessionLog: v})}/>
                            <ToggleRow title="Check-in alert to trainer" desc="Ping coach accounts immediately when an assigned athlete handles hardware ingress validation" checked={notifications.checkInAlert} onChange={(v) => setNotifications({...notifications, checkInAlert: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Communication Dispatch Rules")}/>
                    </Card>
                </div>
            )}

            {currentView === "HOURS" && (
                <div className="space-y-6">
                    <SectionHeader title="Operating Hours" desc="Days and times the gym facility environment is open to receive check-ins"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="space-y-3.5">
                            {operatingHours.map((sched, idx) => (
                                <div key={sched.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background/40 border border-border rounded-md">
                                    <div className="flex items-center gap-4 w-32">
                                        <Switch checked={sched.active} onCheckedChange={(v) => { const updated = [...operatingHours]; updated[idx].active = v; setOperatingHours(updated); }}/>
                                        <span className={cn("text-xs font-bold", sched.active ? "text-foreground" : "text-muted-foreground line-through")}>{sched.day}</span>
                                    </div>
                                    {sched.active ? (
                                        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                                            <Input type="text" value={sched.open} onChange={(e) => { const updated = [...operatingHours]; updated[idx].open = e.target.value; setOperatingHours(updated); }} className="w-20 bg-background border-border h-8 text-center rounded-sm text-xs"/>
                                            <span>to</span>
                                            <Input type="text" value={sched.close} onChange={(e) => { const updated = [...operatingHours]; updated[idx].close = e.target.value; setOperatingHours(updated); }} className="w-20 bg-background border-border h-8 text-center rounded-sm text-xs"/>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2.5 py-1 rounded-sm border border-border">Closed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Ingress Access Windows")}/>
                    </Card>
                </div>
            )}

            {currentView === "ACCESS" && (
                <div className="space-y-6">
                    <SectionHeader title="Access Control" desc="Granular vertical permission rules outlining what consumers and coach profiles are permitted to action"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="divide-y divide-border">
                            <ToggleRow title="Member self check-in" desc="Allow consumer accounts to execute entry transactions via personal QR/IoT parameters without front-desk manual override steps" checked={accessControl.selfCheckIn} onChange={(v) => setAccessControl({...accessControl, selfCheckIn: v})}/>
                            <ToggleRow title="Trainer confirms session logs" desc="Forced validation boundary: session metric logs are locked until assigned trainer profile approves data states" checked={accessControl.trainerConfirms} onChange={(v) => setAccessControl({...accessControl, trainerConfirms: v})}/>
                            <ToggleRow title="Member-initiated cancellations" desc="Permit end-consumers to drop resource reservations directly inside threshold parameters via the B2C portal app layer" checked={accessControl.memberCancellations} onChange={(v) => setAccessControl({...accessControl, memberCancellations: v})}/>
                            <ToggleRow title="Members see class roster" desc="Expose community profiles: allow linked users to view fellow attendees checked into a current scheduling block" checked={accessControl.seeClassRoster} onChange={(v) => setAccessControl({...accessControl, seeClassRoster: v})}/>
                            <ToggleRow title="Trainers see revenue data" desc="Platform visibility override: allow horizontal visibility of raw tenant revenue metrics and financial dashboards on standard trainer screens" checked={accessControl.seeRevenue} onChange={(v) => setAccessControl({...accessControl, seeRevenue: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("RBAC Workspace Scoping Rules")}/>
                    </Card>
                </div>
            )}

            {currentView === "TEAM" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Team Members" desc="Manage access permissions for trainers, operational management staff, and admin personnel"/>
                        <Button
                            onClick={() => toast.success("Dispatching SMS link payload via Text.lk API endpoints...")}
                            className="bg-background hover:bg-accent border border-border text-primary text-xs font-black rounded-md h-10 gap-1.5 px-4"
                        >
                            <Plus className="w-3.5 h-3.5"/> Invite
                        </Button>
                    </div>

                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <Table>
                            <TableHeader className="border-b border-border">
                                <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="text-xs text-muted-foreground font-bold tracking-wider pl-0">OPERATOR IDENTITY</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">SYSTEM BOUNDARY ROLE</TableHead>
                                    <TableHead className="text-xs text-muted-foreground font-bold tracking-wider text-right pr-0">STATUS OVERRIDE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.map((person, idx) => (
                                    <TableRow key={person.id} className="border-b border-border hover:bg-transparent">
                                        <TableCell className="pl-0 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-black text-muted-foreground border border-border">
                                                    {person.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground">{person.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{person.email} · since {person.joined}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border font-mono tracking-wider",
                                                person.role === "Admin" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : person.role === "Trainer" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-muted text-muted-foreground border-border"
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
                                                    "h-8 text-xs font-bold uppercase rounded-md border px-3 transition-colors",
                                                    person.active ? "bg-destructive/10 text-destructive border-destructive/10 hover:bg-destructive/30" : "bg-emerald-950/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-950/30"
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

function MenuListItem({icon, title, desc, onClick}: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-background/20 hover:bg-accent/40 transition-colors group cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-background border border-border rounded-md group-hover:border-primary/20 transition-colors">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"/>
        </div>
    );
}

function SectionHeader({title, desc}: { title: string; desc: string }) {
    return (
        <div className="space-y-0.5 border-b border-border pb-4 mb-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
    );
}

function RuleInputBox({title, desc, val, unit, onChange}: { title: string; desc: string; val: number; unit: string; onChange: (v: number) => void }) {
    return (
        <div className="p-4 bg-background/50 border border-border rounded-md flex flex-col gap-3">
            <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">{title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
            </div>
            <div className="flex items-center gap-2 font-mono mt-auto">
                <Input type="number" value={val} onChange={(e) => onChange(Number(e.target.value))} className="w-20 bg-background border-border h-8 text-center text-xs font-bold rounded-sm" />
                <span className="text-xs text-muted-foreground font-bold">{unit}</span>
            </div>
        </div>
    );
}

function ToggleRow({title, desc, checked, onChange}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
            <div className="space-y-0.5 max-w-xl">
                <h4 className="text-xs font-bold text-foreground">{title}</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">{desc}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5"/>
        </div>
    );
}

function SaveButton({onClick, isLoading}: { onClick: () => void, isLoading?: boolean }) {
    return (
        <div className="flex justify-end pt-4 border-t border-border mt-6">
            <Button
                onClick={onClick}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 gap-1.5 px-5 rounded-md shadow-md"
            >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
                {isLoading ? "Saving..." : "Save Changes"}
            </Button>
        </div>
    );
}