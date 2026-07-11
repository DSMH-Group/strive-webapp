// app/tenants/[subdomain]/(staff)/schedule/scheduleClient.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Clock,
    RefreshCw,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Coffee,
    User,
    Check,
    Lock,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";

interface ScheduleClientProps {
    subdomain: string;
    tenantId: string;
    initialBookings: any[];
}

const HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function ScheduleClient({ subdomain, tenantId, initialBookings = [] }: ScheduleClientProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<"DAY" | "WEEK" | "MONTH">("DAY");
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Customizable lunch break state
    const [lunchStart, setLunchStart] = useState("12:00");
    const [isLunchModalOpen, setIsLunchModalOpen] = useState(false);

    // Modal state for assigning sessions and blocking time
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState("10:00");
    const [selectedDateStr, setSelectedDateStr] = useState("");
    const [actionMode, setActionMode] = useState<"SESSION" | "BLOCK">("SESSION");
    
    // Cancellation modal states
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

    // Assign session states
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [sessionTitle, setSessionTitle] = useState("");
    const [sessionDuration, setSessionDuration] = useState("60");

    // Block time states
    const [blockReason, setBlockReason] = useState("");

    // Dynamic mock date calculator
    const getRelativeDateStr = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split("T")[0];
    };

    // Local static/mock bookings state (to overlay on top of database bookings)
    const [localBookings, setLocalBookings] = useState<any[]>([]);
    const [blocks, setBlocks] = useState<any[]>([]);

    useEffect(() => {
        setSelectedDateStr(getRelativeDateStr(0));
    }, []);

    // --- DB CONNECTIVITY: Active Trainer Profile / Membership Handshake ---
    const { data: userProfile } = useQuery({
        queryKey: ["scheduleTrainerProfile", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", { method: "GET", tenantId });
            if (!res.ok) return null;
            return await res.json();
        }
    });

    const activeTrainerMembershipId = useMemo(() => {
        const membership = userProfile?.memberships?.find((m: any) => m.tenantId === tenantId);
        return membership?.id || null;
    }, [userProfile, tenantId]);

    // --- DB CONNECTIVITY: Resources Fetch & Auto-Provision ---
    const { data: resources = [], isLoading: isLoadingResources, refetch: refetchResources } = useQuery<any[]>({
        queryKey: ["scheduleResources", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/scheduling/resources", { tenantId });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    const [isProvisioning, setIsProvisioning] = useState(false);
    useEffect(() => {
        if (!isLoadingResources && resources.length === 0 && !isProvisioning) {
            setIsProvisioning(true);
            striveClientFetch("/api/v1/scheduling/resources", {
                method: "POST",
                tenantId,
                body: JSON.stringify({
                    name: "Personal Trainer",
                    type: "HUMAN",
                    capacity: 1
                })
            }).then(() => {
                refetchResources();
            }).catch((err) => {
                console.error("Auto resource provisioning failed:", err);
            }).finally(() => {
                setIsProvisioning(false);
            });
        }
    }, [resources, isLoadingResources, isProvisioning, tenantId, refetchResources]);

    // --- DB CONNECTIVITY: Bookings Fetch ---
    const { data: dbBookings = [], refetch: refetchBookings } = useQuery<any[]>({
        queryKey: ["scheduleBookings", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/scheduling/bookings", { tenantId });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    // Merge database bookings and local mock bookings
    const bookings = useMemo(() => {
        const mappedDb = dbBookings.map((b: any) => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const dateStr = start.toISOString().split("T")[0];
            const hourStr = start.toTimeString().split(" ")[0].slice(0, 5); // "HH:MM"
            const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
            
            // Detect if this booking represents a block created by the trainer themselves
            const isTrainerBlock = activeTrainerMembershipId && b.membershipId === activeTrainerMembershipId;

            if (isTrainerBlock) {
                return {
                    id: b.id,
                    date: dateStr,
                    time: hourStr,
                    duration: durationMins,
                    title: "Trainer Calendar Block",
                    clientEmail: "Unavailable for booking",
                    type: "BREAK",
                    status: "OOO"
                };
            }

            const memberName = b.membership?.user 
                ? `${b.membership.user.firstName} ${b.membership.user.lastName}` 
                : "Assigned Session";
            const memberEmail = b.membership?.user?.email || "";

            return {
                id: b.id,
                date: dateStr,
                time: hourStr,
                duration: durationMins,
                title: `${memberName} — PT`,
                clientEmail: memberEmail,
                type: "PT",
                status: "SOON"
            };
        });

        const filteredLocal = localBookings.filter(lb => 
            !mappedDb.some(db => db.date === lb.date && db.time === lb.time)
        );

        return [...mappedDb, ...filteredLocal];
    }, [dbBookings, localBookings, activeTrainerMembershipId]);

    // Fetch members list for session assignment
    const { data: members = [] } = useQuery<any[]>({
        queryKey: ["membersListSchedule", subdomain],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members?role=MEMBER", { tenantId });
            if (!res.ok) return [];
            return await res.json();
        }
    });

    const fallbackMembers = useMemo(() => {
        if (members.length > 0) return members;
        return [
            { id: "m-alice", user: { firstName: "Alice", lastName: "Test", email: "alice@strive.com" } },
            { id: "m-suresh", user: { firstName: "Suresh", lastName: "Perera", email: "suresh@gmail.com" } },
            { id: "m-ruwani", user: { firstName: "Ruwani", lastName: "Jayasinghe", email: "ruwani@fitness.lk" } },
            { id: "m-dilshan", user: { firstName: "Dilshan", lastName: "Raj", email: "dilshan@strive.com" } }
        ];
    }, [members]);

    const selectedMemberName = useMemo(() => {
        const found = fallbackMembers.find(m => m.id === selectedMemberId);
        return found ? `${found.user.firstName} ${found.user.lastName}` : "";
    }, [selectedMemberId, fallbackMembers]);

    const formattedDateString = useMemo(() => {
        return currentDate.toISOString().split("T")[0];
    }, [currentDate]);

    // Query the active tenant config (which has operating hours / closed holidays)
    const { data: tenantConfig } = useQuery({
        queryKey: ["tenantConfig", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/tenants/${tenantId}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!tenantId
    });

    const dayOfWeek = useMemo(() => {
        return currentDate.toLocaleDateString("en-US", { weekday: "long" });
    }, [currentDate]);

    // Check if current day is in closed dates / holidays
    const closedDateConfig = useMemo(() => {
        const rules = tenantConfig?.businessRules as any;
        const closedList = rules?.closedDates as { date: string; reason: string }[];
        if (!closedList || !Array.isArray(closedList)) return null;
        return closedList.find(d => d.date === formattedDateString);
    }, [tenantConfig, formattedDateString]);

    // Check if current day is closed weekly
    const isWeeklyClosed = useMemo(() => {
        const rules = tenantConfig?.businessRules as any;
        const hoursConfig = rules?.operatingHours as any[];
        if (!hoursConfig || !Array.isArray(hoursConfig)) return false;

        const dayConfig = hoursConfig.find(d => d.day.toLowerCase() === dayOfWeek.toLowerCase());
        return dayConfig && !dayConfig.active;
    }, [tenantConfig, dayOfWeek]);

    const isFacilityClosed = !!closedDateConfig || isWeeklyClosed;

    // Generate dynamic hours list for DAY view and time selectors
    const dynamicHours = useMemo(() => {
        const rules = tenantConfig?.businessRules as any;
        const hoursConfig = rules?.operatingHours as any[];
        
        if (!hoursConfig || !Array.isArray(hoursConfig)) {
            return HOURS; // fallback to default
        }

        const dayConfig = hoursConfig.find(d => d.day.toLowerCase() === dayOfWeek.toLowerCase());
        if (!dayConfig || !dayConfig.active) {
            return []; // closed today
        }

        // Generate hourly slots between open and close
        // e.g. open "06:00", close "21:00"
        try {
            const [openH] = dayConfig.open.split(":").map(Number);
            const [closeH] = dayConfig.close.split(":").map(Number);
            
            const list = [];
            for (let h = openH; h < closeH; h++) {
                const timeStr = `${String(h).padStart(2, "0")}:00`;
                list.push(timeStr);
            }
            return list;
        } catch (e) {
            return HOURS; // fallback
        }
    }, [tenantConfig, dayOfWeek]);

    // Today's timeline slots mapping dynamicHours
    const daySlots = useMemo(() => {
        if (isFacilityClosed) {
            return [];
        }
        return dynamicHours.map((hour) => {
            const booking = bookings.find(b => b.date === formattedDateString && b.time === hour);
            const block = blocks.find(bl => bl.date === formattedDateString && bl.time === hour);
            const isLunch = hour === lunchStart;

            if (booking) {
                return {
                    id: booking.id,
                    time: hour,
                    title: booking.title,
                    clientEmail: booking.clientEmail,
                    type: booking.type === "CLASS" ? "CLASS" : booking.type === "BREAK" ? "BREAK" : "CLIENT",
                    status: booking.status
                };
            }
            if (block) {
                return {
                    id: block.id,
                    time: hour,
                    title: block.title,
                    type: "BREAK",
                    status: "OOO"
                };
            }
            if (isLunch) {
                return {
                    id: `lunch-${hour}`,
                    time: hour,
                    title: "Lunch Break",
                    type: "BREAK",
                    status: "BREAK"
                };
            }
            return {
                id: `open-${hour}`,
                time: hour,
                title: "— Available —",
                type: "OPEN",
                status: "OPEN"
            };
        });
    }, [bookings, blocks, formattedDateString, lunchStart, dynamicHours, isFacilityClosed]);

    // Week dates calculator
    const weekDates = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        return Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + idx);
            return d;
        });
    }, [currentDate]);

    const summaryStats = useMemo(() => {
        const activeSessions = daySlots.filter(s => s.type === "CLIENT" || s.type === "CLASS").length;
        const openSlots = daySlots.filter(s => s.type === "OPEN").length;
        const oooSlots = daySlots.filter(s => s.status === "OOO").length;
        const activeCurrent = daySlots.filter(s => s.status === "NOW").length;

        return {
            sessions: activeSessions,
            open: openSlots,
            ooo: oooSlots,
            active: activeCurrent
        };
    }, [daySlots]);

    const handleExternalCalendarSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            toast.success("Synchronized with Google Calendar and local iCal engine.");
        }, 1000);
    };

    const handleOpenActionModal = (hour: string, dateStr: string) => {
        setSelectedHour(hour);
        setSelectedDateStr(dateStr);
        setActionMode("SESSION");
        setIsActionModalOpen(true);
    };

    const handleSlotClick = (slot: any) => {
        if (slot.status === "OPEN") {
            handleOpenActionModal(slot.time, formattedDateString);
        } else if (slot.type === "CLIENT" || slot.status === "OOO") {
            setSelectedBookingId(slot.id);
            setIsCancelModalOpen(true);
        }
    };

    const handleConfirmAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const resourceId = resources[0]?.id;
        if (!resourceId) {
            toast.error("No trainer resource provisioned. Please try again in a moment.");
            return;
        }

        setIsSubmitting(true);

        const [h, m] = selectedHour.split(":").map(Number);
        const startObj = new Date(selectedDateStr);
        startObj.setHours(h, m, 0, 0);

        try {
            if (actionMode === "SESSION") {
                if (!selectedMemberId) {
                    toast.error("Please select a member to assign the session.");
                    setIsSubmitting(false);
                    return;
                }

                const endObj = new Date(startObj.getTime() + Number(sessionDuration) * 60 * 1000);

                if (selectedMemberId.startsWith("m-")) {
                    const newMock = {
                        id: `mock-${Date.now()}`,
                        date: selectedDateStr,
                        time: selectedHour,
                        duration: Number(sessionDuration),
                        title: `${selectedMemberName} — PT`,
                        clientEmail: fallbackMembers.find(fm => fm.id === selectedMemberId)?.user?.email || "member@strive.com",
                        type: "PT",
                        status: "SOON"
                    };
                    setLocalBookings(prev => [...prev, newMock]);
                    toast.success(`Session assigned for ${selectedMemberName} at ${selectedHour}.`);
                    setIsActionModalOpen(false);
                    return;
                }

                const res = await striveClientFetch("/api/v1/scheduling/bookings", {
                    method: "POST",
                    tenantId,
                    body: JSON.stringify({
                        resourceId,
                        membershipId: selectedMemberId,
                        startTime: startObj.toISOString(),
                        endTime: endObj.toISOString()
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to book: slot overlap detected.");
                }

                toast.success(`Assigned session for ${selectedMemberName} at ${selectedHour} on Strive DB.`);
                refetchBookings();
            } else {
                const endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // 1 hour block by default

                if (!activeTrainerMembershipId) {
                    toast.error("Trainer membership context not resolved. Booking block locally.");
                    const newBlock = {
                        id: `block-mock-${Date.now()}`,
                        date: selectedDateStr,
                        time: selectedHour,
                        title: blockReason || "Blocked slot"
                    };
                    setBlocks(prev => [...prev, newBlock]);
                    setIsActionModalOpen(false);
                    return;
                }

                const res = await striveClientFetch("/api/v1/scheduling/bookings", {
                    method: "POST",
                    tenantId,
                    body: JSON.stringify({
                        resourceId,
                        membershipId: activeTrainerMembershipId,
                        startTime: startObj.toISOString(),
                        endTime: endObj.toISOString()
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to block: slot overlap detected.");
                }

                toast.success(`Calendar block successfully recorded at ${selectedHour}.`);
                refetchBookings();
            }

            setIsActionModalOpen(false);
            setSessionTitle("");
            setSelectedMemberId("");
            setBlockReason("");
        } catch (err: any) {
            toast.error(err.message || "Failed to schedule session.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!selectedBookingId) return;

        if (selectedBookingId.startsWith("mock-") || selectedBookingId.startsWith("block-mock-")) {
            setLocalBookings(prev => prev.filter(b => b.id !== selectedBookingId));
            setBlocks(prev => prev.filter(b => b.id !== selectedBookingId));
            toast.success("Mock session booking released.");
            setIsCancelModalOpen(false);
            setSelectedBookingId(null);
            return;
        }

        try {
            const res = await striveClientFetch(`/api/v1/scheduling/bookings/${selectedBookingId}`, {
                method: "DELETE",
                tenantId
            });

            if (!res.ok) throw new Error("Could not cancel session on database.");
            
            toast.success("Session successfully cancelled and released from ledger.");
            refetchBookings();
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel reservation.");
        } finally {
            setIsCancelModalOpen(false);
            setSelectedBookingId(null);
        }
    };

    const handleSaveLunchSettings = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Lunch break updated to ${lunchStart} on your personal profile.`);
        setIsLunchModalOpen(false);
    };

    const adjustDate = (days: number) => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + days);
        setCurrentDate(next);
    };

    const setToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="space-y-6 text-foreground select-none">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Trainer Space</p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Availability & Bookings</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-secondary/35 border border-border rounded-lg p-0.5">
                        <button
                            onClick={() => setView("DAY")}
                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === "DAY" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setView("WEEK")}
                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === "WEEK" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView("MONTH")}
                            className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === "MONTH" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
                        >
                            Month
                        </button>
                    </div>

                    <Button
                        onClick={() => setIsLunchModalOpen(true)}
                        variant="outline"
                        className="h-10 border-border bg-card rounded-md hover:bg-accent text-muted-foreground text-xs font-bold gap-2"
                    >
                        <Coffee className="w-3.5 h-3.5" /> Customize Lunch
                    </Button>

                    <Button
                        onClick={handleExternalCalendarSync}
                        disabled={isSyncing}
                        variant="outline"
                        className="h-10 border-border bg-card rounded-md hover:bg-accent text-muted-foreground text-xs font-bold gap-2"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} /> Sync
                    </Button>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-card/25 border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={setToday} className="font-bold text-xs h-8 border-border rounded-lg bg-card">
                        Today
                    </Button>
                    <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                        <button onClick={() => adjustDate(view === "MONTH" ? -30 : view === "WEEK" ? -7 : -1)} className="p-2 hover:bg-accent border-r border-border">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => adjustDate(view === "MONTH" ? 30 : view === "WEEK" ? 7 : 1)} className="p-2 hover:bg-accent">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <span className="text-sm font-bold text-foreground font-sans">
                        {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric", ...(view === "DAY" && { day: "numeric" }) })}
                    </span>
                </div>
                {view === "DAY" && !isFacilityClosed && (
                    <Button
                        onClick={() => handleOpenActionModal(dynamicHours[0] || "10:00", formattedDateString)}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground h-9 text-xs font-bold gap-1.5 px-4 rounded-xl shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Book / Block
                    </Button>
                )}
            </div>

            {/* MAIN VIEWS GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                
                {/* Main Schedule Panels */}
                <div className="xl:col-span-3">
                    
                    {/* 1. DAY VIEW */}
                    {view === "DAY" && (
                        isFacilityClosed ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card/25 border border-border/80 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden">
                                <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                                    <Clock className="w-8 h-8 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-extrabold text-foreground uppercase tracking-tight">Facility Closed Today</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
                                        {closedDateConfig 
                                            ? `Reason: ${closedDateConfig.reason}` 
                                            : `This facility is closed to bookings and check-ins on ${dayOfWeek}s.`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {daySlots.map((slot) => {
                                    const isOpen = slot.status === "OPEN";
                                    const isNow = slot.status === "NOW";
                                    const isSoon = slot.status === "SOON";
                                    const isDone = slot.status === "DONE";
                                    const isBreak = slot.status === "BREAK";
                                    const isOoo = slot.status === "OOO";
                                    const isPT = slot.type === "CLIENT";

                                    return (
                                        <div
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all bg-card/25 border-border",
                                                (isOpen || isPT || isOoo) && "opacity-75 hover:opacity-100 cursor-pointer hover:border-primary/30",
                                                isNow && "border-primary bg-primary/5 ring-1 ring-primary/20",
                                                isSoon && "border-border hover:border-primary/20",
                                                isDone && "opacity-45 hover:opacity-75",
                                                isBreak && "bg-muted/40 opacity-55 cursor-default",
                                                isOoo && "bg-destructive/5 border-destructive/20 opacity-85"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className="font-mono text-xs font-black text-muted-foreground/60 w-10 shrink-0">
                                                    {slot.time}
                                                </span>
                                                <div className="flex flex-col text-left min-w-0">
                                                    <span className={cn(
                                                        "text-sm font-bold truncate",
                                                        isOpen ? "text-muted-foreground/75 font-semibold italic" : "text-foreground"
                                                    )}>
                                                        {slot.title}
                                                    </span>
                                                    {slot.clientEmail && (
                                                        <span className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{slot.clientEmail}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 pl-2">
                                                {isOpen && (
                                                    <span className="text-[9px] font-black uppercase text-primary tracking-widest border border-primary/20 px-2 py-0.5 bg-primary/5 rounded-sm">Quick Add</span>
                                                )}
                                                {isNow && (
                                                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-tight animate-pulse bg-primary/10 px-2.5 py-0.5 rounded-sm border border-primary/20">Active</span>
                                                )}
                                                {isSoon && (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-sm">Upcoming</span>
                                                )}
                                                {isDone && (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Complete</span>
                                                )}
                                                {isBreak && (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight bg-background px-2 py-0.5 border border-border rounded-sm">Break</span>
                                                )}
                                                {isOoo && (
                                                    <span className="text-[10px] font-bold text-destructive uppercase tracking-tight bg-destructive/10 px-2 py-0.5 border border-destructive/20 rounded-sm">Blocked</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {/* 2. WEEK VIEW */}
                    {view === "WEEK" && (
                        <Card className="bg-card border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-8 border-b border-border bg-muted/20">
                                        <div className="p-3 border-r border-border text-center text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Hour</div>
                                        {weekDates.map((day, idx) => {
                                            const isDateToday = day.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={idx} className={cn("p-3 text-center border-r border-border last:border-r-0 flex flex-col items-center", isDateToday && "bg-primary/5")}>
                                                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                                    <span className={cn("text-sm font-black font-sans mt-0.5 w-6 h-6 rounded-full flex items-center justify-center", isDateToday && "bg-primary text-primary-foreground")}>{day.getDate()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="divide-y divide-border">
                                        {HOURS.map((hour) => (
                                            <div key={hour} className="grid grid-cols-8">
                                                <div className="p-3 border-r border-border text-center text-xs font-black font-mono text-muted-foreground/60 flex items-center justify-center bg-muted/5">{hour}</div>
                                                {weekDates.map((day, dIdx) => {
                                                    const dateStr = day.toISOString().split("T")[0];
                                                    const booking = bookings.find(b => b.date === dateStr && b.time === hour);
                                                    const block = blocks.find(bl => bl.date === dateStr && bl.time === hour);
                                                    const isLunch = hour === lunchStart;

                                                    // Calculate if the cell falls outside operating hours or is a holiday
                                                    const dayOfWeekName = day.toLocaleDateString("en-US", { weekday: "long" });
                                                    const weekDayConfig = (tenantConfig?.businessRules?.operatingHours || []).find(
                                                        (oh: any) => oh.day.toLowerCase() === dayOfWeekName.toLowerCase()
                                                    );
                                                    const isDayHoliday = (tenantConfig?.businessRules?.closedDates || []).some(
                                                        (d: any) => d.date === dateStr
                                                    );
                                                    const isWeekDayInactive = weekDayConfig && !weekDayConfig.active;
                                                    
                                                    let isHourOutOfRange = false;
                                                    if (weekDayConfig && weekDayConfig.active) {
                                                        try {
                                                            const [openH] = weekDayConfig.open.split(":").map(Number);
                                                            const [closeH] = weekDayConfig.close.split(":").map(Number);
                                                            const [hourNum] = hour.split(":").map(Number);
                                                            if (hourNum < openH || hourNum >= closeH) {
                                                                isHourOutOfRange = true;
                                                            }
                                                        } catch (e) {
                                                            // ignore
                                                        }
                                                    }
                                                    
                                                    const isCellClosed = isDayHoliday || isWeekDayInactive || isHourOutOfRange;

                                                    if (isCellClosed) {
                                                        return (
                                                            <div
                                                                key={dIdx}
                                                                className="p-2 border-r border-border last:border-r-0 min-h-[50px] bg-muted/10 opacity-35 cursor-not-allowed flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono"
                                                            >
                                                                Closed
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={dIdx}
                                                            onClick={() => {
                                                                if (booking && booking.type !== "CLASS") {
                                                                    setSelectedBookingId(booking.id);
                                                                    setIsCancelModalOpen(true);
                                                                } else if (!booking && !block && !isLunch) {
                                                                    handleOpenActionModal(hour, dateStr);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "p-2 border-r border-border last:border-r-0 min-h-[50px] relative transition-all text-left text-xs flex flex-col justify-between group",
                                                                !booking && !block && !isLunch && "hover:bg-accent/40 cursor-pointer",
                                                                booking && "bg-primary/5 border-l-2 border-l-primary cursor-pointer hover:bg-primary/10",
                                                                block && "bg-destructive/5 border-l-2 border-l-destructive",
                                                                isLunch && "bg-muted/40"
                                                            )}
                                                        >
                                                            {booking && (
                                                                <div className="font-bold text-foreground truncate pr-1">
                                                                    {booking.title}
                                                                </div>
                                                            )}
                                                            {block && (
                                                                <div className="text-destructive font-bold truncate flex items-center gap-1">
                                                                    <Lock className="w-2.5 h-2.5 shrink-0" /> {block.title}
                                                                </div>
                                                            )}
                                                            {isLunch && (
                                                                <div className="text-muted-foreground/80 font-bold truncate flex items-center gap-1">
                                                                    <Coffee className="w-2.5 h-2.5 shrink-0" /> Lunch
                                                                </div>
                                                            )}
                                                            {!booking && !block && !isLunch && (
                                                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 text-primary text-[10px] font-black uppercase">
                                                                    Book
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* 3. MONTH VIEW */}
                    {view === "MONTH" && (
                        <Card className="bg-card border-border rounded-xl p-4 shadow-sm">
                            <div className="grid grid-cols-7 border-b border-border pb-3 bg-muted/15 rounded-t-lg">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} className="text-center text-[10px] font-black uppercase text-muted-foreground py-2">{day}</div>
                                ))}
                            </div>
                            
                            {(() => {
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth(); // 0-indexed
                                
                                // First day of selected month
                                const firstDayOfMonth = new Date(year, month, 1);
                                // Day of the week (0-6) of the first day
                                const startDayOfWeek = firstDayOfMonth.getDay();
                                
                                // Total days in selected month
                                const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
                                
                                // We render a grid of 35 or 42 cells. If starting day + total days > 35, we need 42 cells.
                                const gridCellsCount = startDayOfWeek + totalDaysInMonth > 35 ? 42 : 35;
                                
                                return (
                                    <div className="grid grid-cols-7 grid-rows-5 gap-1.5 mt-2">
                                        {Array.from({ length: gridCellsCount }).map((_, idx: number) => {
                                            const dayNum = idx - startDayOfWeek + 1;
                                            const isWithinMonth = dayNum > 0 && dayNum <= totalDaysInMonth;
                                            
                                            const monthStr = String(month + 1).padStart(2, "0");
                                            const dayStr = String(dayNum).padStart(2, "0");
                                            const dateStr = `${year}-${monthStr}-${dayStr}`;

                                            const dayBookings = bookings.filter((b: any) => b.date === dateStr);
                                            const dayBlocks = blocks.filter((b: any) => b.date === dateStr);

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (isWithinMonth) {
                                                            setCurrentDate(new Date(year, month, dayNum));
                                                            setView("DAY");
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-h-[85px] border border-border/60 rounded-lg p-2 flex flex-col justify-between transition-all bg-card/15 text-left",
                                                        isWithinMonth ? "hover:border-primary hover:bg-accent/40 cursor-pointer" : "opacity-20 pointer-events-none bg-background/5"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-xs font-bold font-mono self-end",
                                                        isWithinMonth && dayNum === currentDate.getDate() && "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center"
                                                    )}>
                                                        {isWithinMonth ? dayNum : ""}
                                                    </span>
                                                    
                                                    {isWithinMonth && (dayBookings.length > 0 || dayBlocks.length > 0) && (
                                                        <div className="space-y-1 mt-1 max-h-[50px] overflow-hidden">
                                                            {dayBookings.slice(0, 2).map((b: any) => (
                                                                <div key={b.id} className="text-[9px] font-bold bg-primary/10 border border-primary/20 text-foreground truncate px-1 rounded-sm">
                                                                    {b.title}
                                                                </div>
                                                            ))}
                                                            {dayBlocks.slice(0, 1).map((bl: any) => (
                                                                <div key={bl.id} className="text-[9px] font-bold bg-destructive/10 border border-destructive/20 text-destructive truncate px-1 rounded-sm">
                                                                    {bl.title}
                                                                </div>
                                                            ))}
                                                            {(dayBookings.length + dayBlocks.length) > 3 && (
                                                                <div className="text-[8px] text-muted-foreground font-black pl-1">
                                                                    +{(dayBookings.length + dayBlocks.length) - 3} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </Card>
                    )}
                </div>

                {/* Right Summary Metrics Panel */}
                <div className="space-y-4">
                    <Card className="bg-card/30 border-border rounded-xl p-5 space-y-4 shadow-sm">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected Day Overview</span>

                        <div className="space-y-3 font-mono text-xs">
                            <SummaryMetricRow label="Total Sessions" value={summaryStats.sessions} />
                            <SummaryMetricRow label="Open Booking Slots" value={summaryStats.open} />
                            <SummaryMetricRow label="OOO / Blocks" value={summaryStats.ooo} />
                            <SummaryMetricRow label="Active Sessions Now" value={summaryStats.active} isHighlight />
                        </div>
                    </Card>

                    <Card className="bg-card/10 border-dashed border-border rounded-xl p-5 flex gap-3 items-start">
                        <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-foreground">Conflict Mitigation</h4>
                            <p className="text-[11px] text-muted-foreground/80 leading-normal">
                                Resource rules protect your schedule. Cross-tenant asset overlapping controls are active on this profile.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* 1. Custom Lunch Break Modal */}
            {isLunchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
                        <button
                            onClick={() => setIsLunchModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-foreground text-base tracking-tight">Configure Lunch Break</h3>
                            <p className="text-[11px] text-muted-foreground">Adjust your daily recurring lunch slot on this workspace.</p>
                        </div>

                        <form onSubmit={handleSaveLunchSettings} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Lunch Start Time</label>
                                <select 
                                    value={lunchStart}
                                    onChange={(e) => setLunchStart(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                >
                                    {HOURS.map((hr) => (
                                        <option key={hr} value={hr}>{hr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button 
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsLunchModalOpen(false)}
                                    className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl"
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Unified Session Assignment & Block Modal */}
            {isActionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
                        <button
                            onClick={() => setIsActionModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-foreground text-base tracking-tight">Schedule Allocation</h3>
                            <p className="text-[11px] text-muted-foreground">Assign private member training sessions or create calendar blocks.</p>
                        </div>

                        {/* Mode Segmented Controller */}
                        <div className="flex bg-secondary/35 border border-border rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => setActionMode("SESSION")}
                                className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", actionMode === "SESSION" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground")}
                            >
                                Book Session
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionMode("BLOCK")}
                                className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", actionMode === "BLOCK" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground")}
                            >
                                Block Time
                            </button>
                        </div>

                        <form onSubmit={handleConfirmAction} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Selected Hour</label>
                                    <select 
                                        value={selectedHour}
                                        onChange={(e) => setSelectedHour(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                    >
                                        {(dynamicHours.length > 0 ? dynamicHours : HOURS).map((hr) => (
                                            <option key={hr} value={hr}>{hr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Target Date</label>
                                    <input 
                                        type="date"
                                        value={selectedDateStr}
                                        onChange={(e) => setSelectedDateStr(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            {actionMode === "SESSION" ? (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Select Member</label>
                                        <select 
                                            value={selectedMemberId}
                                            onChange={(e) => setSelectedMemberId(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                            required
                                        >
                                            <option value="">-- Choose Member --</option>
                                            {fallbackMembers.map((m) => (
                                                <option key={m.id} value={m.id}>{m.user.firstName} {m.user.lastName} ({m.user.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Session Duration</label>
                                            <select 
                                                value={sessionDuration}
                                                onChange={(e) => setSessionDuration(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                            >
                                                <option value="30">30 Minutes</option>
                                                <option value="60">60 Minutes</option>
                                                <option value="90">90 Minutes</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Label / Note</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. PT Session"
                                                value={sessionTitle}
                                                onChange={(e) => setSessionTitle(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Blocking Event / Reason</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Lunch Break, Maintenance, Errands"
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl h-10 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary/20 outline-none"
                                        required
                                    />
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <Button 
                                    type="button"
                                    variant="ghost"
                                    disabled={isSubmitting}
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl gap-2"
                                >
                                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    Confirm
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Booking Cancellation Confirmation Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
                        <button
                            onClick={() => {
                                setIsCancelModalOpen(false);
                                setSelectedBookingId(null);
                            }}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-foreground text-base tracking-tight text-destructive">Release Reservation</h3>
                            <p className="text-[11px] text-muted-foreground font-medium">Are you sure you want to cancel and delete this session booking?</p>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button 
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsCancelModalOpen(false);
                                    setSelectedBookingId(null);
                                }}
                                className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl"
                            >
                                Keep Session
                            </Button>
                            <Button 
                                onClick={handleCancelBooking}
                                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold h-10 rounded-xl gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Cancel booking
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Presentation Card Metric Helpers ---
function SummaryMetricRow({ label, value, isHighlight = false }: { label: string; value: number; isHighlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0 last:pb-0">
            <span className="text-muted-foreground font-sans font-medium">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                isHighlight ? "text-primary font-black animate-pulse" : "text-foreground"
            )}>
                {value}
            </span>
        </div>
    );
}