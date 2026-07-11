// app/tenants/[subdomain]/(admin)/settings/SettingsClient.tsx
"use client";

import React, {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
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
    Save,
    ShieldCheck,
    Users2
} from "lucide-react";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import {MembershipPlans} from "@/components/tenant/admin/settings/MembershipPlans";
import {GymProfile} from "@/components/tenant/admin/settings/GymProfile";
import {TeamMembers} from "@/components/tenant/admin/settings/TeamMembers";
import {DeviceManager} from "@/components/tenant/admin/DeviceManager";

interface SettingsClientProps {
    subdomain: string;
    tenantId: string;
}

type SettingsView =
    | "MENU"
    | "PROFILE"
    | "PLANS"
    | "RULES"
    | "NOTIFICATIONS"
    | "HOURS"
    | "ACCESS"
    | "TEAM"
    | "TAX_GATEWAY";

export default function SettingsClient({subdomain, tenantId}: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = (searchParams.get("view") || "MENU") as SettingsView;

    const setCurrentView = (newView: SettingsView) => {
        const url = new URL(window.location.href);
        if (newView === "MENU") {
            url.searchParams.delete("view");
        } else {
            url.searchParams.set("view", newView);
        }
        router.push(url.pathname + url.search);
    };

    // --- Mock State Ingestion Framework (For remaining non-integrated tabs) ---
    const [rules, setRules] = useState({
        gracePeriod: 5, lowTokenAlert: 2, checkInWindow: 15, defaultSession: 60, cancellationNotice: 24
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
        {day: "Monday", open: "06:00", close: "21:00", active: true},
        {day: "Tuesday", open: "06:00", close: "21:00", active: true},
        {day: "Wednesday", open: "06:00", close: "21:00", active: true},
        {day: "Thursday", open: "06:00", close: "21:00", active: true},
        {day: "Friday", open: "06:00", close: "21:00", active: true},
        {day: "Saturday", open: "07:00", close: "18:00", active: true},
        {day: "Sunday", open: "00:00", close: "00:00", active: false},
    ]);
    const [accessControl, setAccessControl] = useState({
        selfCheckIn: true, trainerConfirms: false, memberCancellations: true, seeClassRoster: false, seeRevenue: false
    });
    const [taxGateway, setTaxGateway] = useState({
        vatPercentage: 18, ssclPercentage: 2.5, payhereMerchantId: "MID-1029384", payhereSecret: "••••••••••••••••"
    });

    const handleSaveChangesMock = (section: string) => {
        toast.success(`${section} modifications synchronized with Strive Core API.`);
        setCurrentView("MENU");
    };

    return (
        <div className="mx-auto space-y-6 text-foreground select-none animate-in fade-in duration-500">

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
                        <p className="text-xs text-muted-foreground">Manage your facility settings and runtime
                            variables</p>
                    </div>
                    <div className="bg-card/40 border border-border rounded-lg overflow-hidden divide-y divide-border">
                        <MenuListItem icon={<Building2 className="text-muted-foreground"/>} title="Gym Profile"
                                      desc="Name, branding, and contact info"
                                      onClick={() => setCurrentView("PROFILE")}/>
                        <MenuListItem icon={<CreditCard className="text-primary"/>} title="Membership Plans"
                                      desc="Pricing and session token allocation"
                                      onClick={() => setCurrentView("PLANS")}/>
                        <MenuListItem icon={<ShieldCheck className="text-muted-foreground"/>} title="Membership Rules"
                                      desc="Grace periods, thresholds, and windows"
                                      onClick={() => setCurrentView("RULES")}/>
                        <MenuListItem icon={<Percent className="text-muted-foreground"/>} title="Tax & Payment Gateways"
                                      desc="VAT/SSCL variables and local gateway bindings"
                                      onClick={() => setCurrentView("TAX_GATEWAY")}/>
                        <MenuListItem icon={<Bell className="text-muted-foreground"/>} title="Notifications"
                                      desc="Automated messages sent to members and trainers"
                                      onClick={() => setCurrentView("NOTIFICATIONS")}/>
                        <MenuListItem icon={<Clock className="text-muted-foreground"/>} title="Operating Hours"
                                      desc="Days and times the gym is open for check-ins"
                                      onClick={() => setCurrentView("HOURS")}/>
                        <MenuListItem icon={<Lock className="text-muted-foreground"/>} title="Access Control"
                                      desc="What members and trainers are permitted to do"
                                      onClick={() => setCurrentView("ACCESS")}/>
                        <MenuListItem icon={<Users2 className="text-muted-foreground"/>} title="Team Members"
                                      desc="Trainers, staff, and admin accounts"
                                      onClick={() => setCurrentView("TEAM")}/>
                    </div>
                </div>
            )}

            {/* 🚀 LIVE: IDENTITY IDENTITY ENGINE COMPONENTIZED */}
            {currentView === "PROFILE" && (
                <GymProfile tenantId={tenantId} onComplete={() => setCurrentView("MENU")}/>
            )}

            {/* 🚀 LIVE: PLANS CATALOG ENGINE COMPONENTIZED */}
            {currentView === "PLANS" && (
                <MembershipPlans tenantId={tenantId} onComplete={() => setCurrentView("MENU")}/>
            )}

            {currentView === "RULES" && (
                <div className="space-y-6">
                    <SectionHeader title="Membership Rules"
                                   desc="Thresholds and windows that govern member status lifecycle transitions"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <RuleInputBox title="Grace Period" desc="Days after expiry before lockout kicks in"
                                          val={rules.gracePeriod} unit="days"
                                          onChange={(v) => setRules({...rules, gracePeriod: v})}/>
                            <RuleInputBox title="Low Token Alert" desc="Warn member when balance hits this floor"
                                          val={rules.lowTokenAlert} unit="tokens"
                                          onChange={(v) => setRules({...rules, lowTokenAlert: v})}/>
                            <RuleInputBox title="Check-in Window"
                                          desc="Minutes before session start to allow ingress access"
                                          val={rules.checkInWindow} unit="min"
                                          onChange={(v) => setRules({...rules, checkInWindow: v})}/>
                            <RuleInputBox title="Default Session"
                                          desc="Standard block duration for assets or human resources"
                                          val={rules.defaultSession} unit="min"
                                          onChange={(v) => setRules({...rules, defaultSession: v})}/>
                            <RuleInputBox title="Cancellation Notice"
                                          desc="Minimum notice required to drop a slot penalty-free"
                                          val={rules.cancellationNotice} unit="hrs"
                                          onChange={(v) => setRules({...rules, cancellationNotice: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Lifecycle State Machine Logic Rulesets")}/>
                    </Card>
                </div>
            )}

            {currentView === "TAX_GATEWAY" && (
                <div className="space-y-6">
                    <SectionHeader title="Tax & Payment Gateways"
                                   desc="Configure dynamic local statutory taxes and digital tokenized gateway API contexts"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">Sri
                                Lankan Tax Architecture</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">VAT Percentage
                                        (%)</Label>
                                    <Input type="number" value={taxGateway.vatPercentage}
                                           onChange={(e) => setTaxGateway({
                                               ...taxGateway,
                                               vatPercentage: Number(e.target.value)
                                           })}
                                           className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">SSCL Percentage
                                        (%)</Label>
                                    <Input type="number" value={taxGateway.ssclPercentage}
                                           onChange={(e) => setTaxGateway({
                                               ...taxGateway,
                                               ssclPercentage: Number(e.target.value)
                                           })}
                                           className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">PayHere
                                Gateway Synchronization</h4>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">Merchant ID</Label>
                                    <Input value={taxGateway.payhereMerchantId} onChange={(e) => setTaxGateway({
                                        ...taxGateway,
                                        payhereMerchantId: e.target.value
                                    })} className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground font-bold">Secret Key</Label>
                                    <Input type="password" value={taxGateway.payhereSecret}
                                           onChange={(e) => setTaxGateway({
                                               ...taxGateway,
                                               payhereSecret: e.target.value
                                           })}
                                           className="bg-background border-border h-10 text-sm rounded-md font-mono"/>
                                </div>
                            </div>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Financial Ledger & Gateway Core Overrides")}/>
                    </Card>
                </div>
            )}

            {currentView === "NOTIFICATIONS" && (
                <div className="space-y-6">
                    <SectionHeader title="Notifications"
                                   desc="Automated communication streams routed via Resend and Text.lk relays"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6 overflow-hidden">
                        <div className="divide-y divide-border">
                            <ToggleRow title="Session reminder"
                                       desc="Notify member 24 hrs before their session booking starts"
                                       checked={notifications.sessionReminder}
                                       onChange={(v) => setNotifications({...notifications, sessionReminder: v})}/>
                            <ToggleRow title="Payment due reminder"
                                       desc="Alert member via automated SMS 7 days before membership token expiration"
                                       checked={notifications.paymentDue}
                                       onChange={(v) => setNotifications({...notifications, paymentDue: v})}/>
                            <ToggleRow title="Low token alert"
                                       desc="Message member automatically when available consumable assets drop below fallback levels"
                                       checked={notifications.lowToken}
                                       onChange={(v) => setNotifications({...notifications, lowToken: v})}/>
                            <ToggleRow title="Welcome message"
                                       desc="Send automated welcome payload packet to new members upon core identity linkage"
                                       checked={notifications.welcomeMessage}
                                       onChange={(v) => setNotifications({...notifications, welcomeMessage: v})}/>
                            <ToggleRow title="Session log confirmation"
                                       desc="Notify member immediately after a coach updates personal session tracking statistics"
                                       checked={notifications.sessionLog}
                                       onChange={(v) => setNotifications({...notifications, sessionLog: v})}/>
                            <ToggleRow title="Check-in alert to trainer"
                                       desc="Ping coach accounts immediately when an assigned athlete handles hardware ingress validation"
                                       checked={notifications.checkInAlert}
                                       onChange={(v) => setNotifications({...notifications, checkInAlert: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("Communication Dispatch Rules")}/>
                    </Card>
                </div>
            )}

            {currentView === "HOURS" && (
                <div className="space-y-6">
                    <SectionHeader title="Operating Hours"
                                   desc="Days and times the gym facility environment is open to receive check-ins"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="space-y-3.5">
                            {operatingHours.map((sched, idx) => (
                                <div key={sched.day}
                                     className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background/40 border border-border rounded-md">
                                    <div className="flex items-center gap-4 w-32">
                                        <Switch checked={sched.active} onCheckedChange={(v) => {
                                            const updated = [...operatingHours];
                                            updated[idx].active = v;
                                            setOperatingHours(updated);
                                        }}/>
                                        <span
                                            className={cn("text-xs font-bold", sched.active ? "text-foreground" : "text-muted-foreground line-through")}>{sched.day}</span>
                                    </div>
                                    {sched.active ? (
                                        <div
                                            className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                                            <Input type="text" value={sched.open} onChange={(e) => {
                                                const updated = [...operatingHours];
                                                updated[idx].open = e.target.value;
                                                setOperatingHours(updated);
                                            }}
                                                   className="w-20 bg-background border-border h-8 text-center rounded-sm text-xs"/>
                                            <span>to</span>
                                            <Input type="text" value={sched.close} onChange={(e) => {
                                                const updated = [...operatingHours];
                                                updated[idx].close = e.target.value;
                                                setOperatingHours(updated);
                                            }}
                                                   className="w-20 bg-background border-border h-8 text-center rounded-sm text-xs"/>
                                        </div>
                                    ) : (
                                        <span
                                            className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2.5 py-1 rounded-sm border border-border">Closed</span>
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
                    <SectionHeader title="Access Control"
                                   desc="Granular vertical permission rules outlining what consumers and coach profiles are permitted to action"/>
                    <Card className="bg-card/30 border-border rounded-lg p-6">
                        <div className="divide-y divide-border">
                            <ToggleRow title="Member self check-in"
                                       desc="Allow consumer accounts to execute entry transactions via personal QR/IoT parameters without front-desk manual override steps"
                                       checked={accessControl.selfCheckIn}
                                       onChange={(v) => setAccessControl({...accessControl, selfCheckIn: v})}/>
                            <ToggleRow title="Trainer confirms session logs"
                                       desc="Forced validation boundary: session metric logs are locked until assigned trainer profile approves data states"
                                       checked={accessControl.trainerConfirms}
                                       onChange={(v) => setAccessControl({...accessControl, trainerConfirms: v})}/>
                            <ToggleRow title="Member-initiated cancellations"
                                       desc="Permit end-consumers to drop resource reservations directly inside threshold parameters via the B2C portal app layer"
                                       checked={accessControl.memberCancellations}
                                       onChange={(v) => setAccessControl({...accessControl, memberCancellations: v})}/>
                            <ToggleRow title="Members see class roster"
                                       desc="Expose community profiles: allow linked users to view fellow attendees checked into a current scheduling block"
                                       checked={accessControl.seeClassRoster}
                                       onChange={(v) => setAccessControl({...accessControl, seeClassRoster: v})}/>
                            <ToggleRow title="Trainers see revenue data"
                                       desc="Platform visibility override: allow horizontal visibility of raw tenant revenue metrics and financial dashboards on standard trainer screens"
                                       checked={accessControl.seeRevenue}
                                       onChange={(v) => setAccessControl({...accessControl, seeRevenue: v})}/>
                        </div>
                        <SaveButton onClick={() => handleSaveChangesMock("RBAC Workspace Scoping Rules")}/>
                    </Card>

                    <DeviceManager tenantId={tenantId} />
                </div>
            )}

            {/* 🚀 LIVE: OPERATOR TEAM MANAGEMENT ENG COMPONENTIZED */}
            {currentView === "TEAM" && (
                <TeamMembers tenantId={tenantId} onComplete={() => setCurrentView("MENU")}/>
            )}

        </div>
    );
}

// --- Dynamic Visual Component Extensions ---

export function MenuListItem({icon, title, desc, onClick}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-background/20 hover:bg-accent/40 transition-colors group cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div
                    className="p-2 bg-background border border-border rounded-md group-hover:border-primary/20 transition-colors">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span
                        className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                </div>
            </div>
            <ChevronRight
                className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"/>
        </div>
    );
}

export function SectionHeader({title, desc}: { title: string; desc: string }) {
    return (
        <div className="space-y-0.5 border-b border-border pb-4 mb-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
    );
}

export function RuleInputBox({title, desc, val, unit, onChange}: {
    title: string;
    desc: string;
    val: number;
    unit: string;
    onChange: (v: number) => void
}) {
    return (
        <div className="p-4 bg-background/50 border border-border rounded-md flex flex-col gap-3">
            <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">{title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
            </div>
            <div className="flex items-center gap-2 font-mono mt-auto">
                <Input type="number" value={val} onChange={(e) => onChange(Number(e.target.value))}
                       className="w-20 bg-background border-border h-8 text-center text-xs font-bold rounded-sm"/>
                <span className="text-xs text-muted-foreground font-bold">{unit}</span>
            </div>
        </div>
    );
}

export function ToggleRow({title, desc, checked, onChange}: {
    title: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void
}) {
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

export function SaveButton({onClick, isLoading}: { onClick?: () => void, isLoading?: boolean }) {
    return (
        <div className="flex justify-end pt-4 border-t border-border mt-6">
            <Button
                type="submit"
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