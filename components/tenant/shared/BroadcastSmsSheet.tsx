// components/tenant/shared/BroadcastSmsSheet.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Loader2, Users, Plus, Trash2, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface BroadcastSmsSheetProps {
    tenantId: string;
    members: any[];
    children?: React.ReactNode;
}

export function BroadcastSmsSheet({ tenantId, members, children }: BroadcastSmsSheetProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"broadcast" | "lists">("broadcast");

    // Broadcast states
    const [messageBody, setMessageBody] = useState("");
    const [audienceType, setAudienceType] = useState<"ALL" | "LIST">("ALL");
    const [selectedListId, setSelectedListId] = useState("");

    // Mailing Lists management states
    const [isEditingList, setIsEditingList] = useState(false);
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [listName, setListName] = useState("");
    const [listDescription, setListDescription] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

    // Fetch members directly to ensure it loads even if console cache is dry
    const { data: dbMembers = [] } = useQuery<any[]>({
        queryKey: ["sheetMembersIndex", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!tenantId && isOpen
    });

    const activeMembers = dbMembers.length > 0 ? dbMembers : members;

    // Fetch mailing lists
    const { data: mailingLists = [], isLoading: isLoadingLists, refetch: refetchLists } = useQuery<any[]>({
        queryKey: ["mailingLists", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/mailing-lists", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen
    });

    // Broadcast mutation
    const broadcastMutation = useMutation({
        mutationFn: async (payload: { customText: string; audienceFilter: any }) => {
            const res = await striveClientFetch("/api/v1/messages/broadcast", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    channel: "SMS",
                    templateId: "custom",
                    customText: payload.customText,
                    audienceFilter: payload.audienceFilter
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to trigger broadcast dispatch.");
            }

            return res.json();
        },
        onSuccess: (data) => {
            toast.success(`Broadcast queued successfully! Targeted ${data.count} members.`);
            setMessageBody("");
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to broadcast message.");
        }
    });

    // Create/Update list mutation
    const saveListMutation = useMutation({
        mutationFn: async (payload: { name: string; description: string; memberIds: string[] }) => {
            const isEdit = !!editingListId;
            const url = isEdit ? `/api/v1/mailing-lists/${editingListId}` : "/api/v1/mailing-lists";
            const res = await striveClientFetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to save mailing list.");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success(editingListId ? "Mailing list updated." : "Mailing list created.");
            refetchLists();
            resetListForm();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to save mailing list.");
        }
    });

    // Delete list mutation
    const deleteListMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await striveClientFetch(`/api/v1/mailing-lists/${id}`, {
                method: "DELETE",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to delete list.");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Mailing list deleted.");
            refetchLists();
            if (selectedListId && selectedListId === editingListId) {
                setSelectedListId("");
            }
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete mailing list.");
        }
    });

    const resetListForm = () => {
        setIsEditingList(false);
        setEditingListId(null);
        setListName("");
        setListDescription("");
        setSelectedMemberIds([]);
        setMemberSearchQuery("");
    };

    const handleBroadcastSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageBody.trim()) {
            toast.error("Please enter message body.");
            return;
        }

        let audienceFilter: any = {};
        if (audienceType === "LIST") {
            if (!selectedListId) {
                toast.error("Please select a target mailing list.");
                return;
            }
            audienceFilter = {
                mailingListMembers: {
                    some: {
                        mailingListId: selectedListId
                    }
                }
            };
        }

        broadcastMutation.mutate({
            customText: messageBody.trim(),
            audienceFilter
        });
    };

    const handleSaveList = (e: React.FormEvent) => {
        e.preventDefault();
        if (!listName.trim()) {
            toast.error("List name is required.");
            return;
        }

        saveListMutation.mutate({
            name: listName.trim(),
            description: listDescription.trim(),
            memberIds: selectedMemberIds
        });
    };

    const startEditList = (list: any) => {
        setEditingListId(list.id);
        setListName(list.name);
        setListDescription(list.description || "");
        setSelectedMemberIds(list.members.map((m: any) => m.membershipId));
        setIsEditingList(true);
    };

    const toggleMemberSelection = (memberId: string) => {
        setSelectedMemberIds(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId) 
                : [...prev, memberId]
        );
    };

    const filteredMembers = activeMembers.filter(m => {
        const fullName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.toLowerCase();
        const email = (m.user?.email || "").toLowerCase();
        const q = memberSearchQuery.toLowerCase();
        return fullName.includes(q) || email.includes(q);
    });

    return (
        <Sheet open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetListForm();
        }}>
            <SheetTrigger>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-card border-l border-border p-6 flex flex-col justify-between">
                <div className="space-y-5 overflow-hidden flex-1 flex flex-col">
                    <SheetHeader className="space-y-1 text-left">
                        <SheetTitle className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" /> Broadcast SMS
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                            Compose and dispatch transactional SMS campaigns to client databases.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Navigation Tabs */}
                    <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/60">
                        <button
                            onClick={() => { setActiveTab("broadcast"); resetListForm(); }}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === "broadcast"
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Send Broadcast
                        </button>
                        <button
                            onClick={() => setActiveTab("lists")}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === "lists"
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" /> Manage Mailing Lists
                        </button>
                    </div>

                    {/* Tab content containers */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {activeTab === "broadcast" && (
                            <form onSubmit={handleBroadcastSubmit} id="broadcast-sms-form" className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Audience</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAudienceType("ALL")}
                                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                                                audienceType === "ALL"
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border hover:bg-accent/40 text-muted-foreground"
                                            }`}
                                        >
                                            All Registered Members
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudienceType("LIST")}
                                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                                                audienceType === "LIST"
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border hover:bg-accent/40 text-muted-foreground"
                                            }`}
                                        >
                                            Select Mailing List
                                        </button>
                                    </div>
                                </div>

                                {audienceType === "LIST" && (
                                    <div className="space-y-2 animate-in fade-in duration-200">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select List</label>
                                        {isLoadingLists ? (
                                            <div className="h-10 flex items-center justify-center border border-border rounded-xl">
                                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                            </div>
                                        ) : mailingLists.length === 0 ? (
                                            <div className="p-3 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                                                No mailing lists configured yet.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedListId}
                                                onChange={(e) => setSelectedListId(e.target.value)}
                                                className="w-full bg-background border border-border h-10 px-3 rounded-xl text-sm font-semibold text-foreground focus-visible:outline-primary"
                                                required
                                            >
                                                <option value="" disabled>-- Select a Mailing List --</option>
                                                {mailingLists.map((list) => (
                                                    <option key={list.id} value={list.id}>
                                                        {list.name} ({list.members?.length || 0} members)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message body</label>
                                        <span className="text-[10px] font-bold font-mono text-muted-foreground">
                                            {messageBody.length} chars ({Math.ceil(messageBody.length / 160)} SMS)
                                        </span>
                                    </div>
                                    <Textarea
                                        placeholder="Hello {name}! Don't forget our special weekend conditioning class starting tomorrow at 9 AM."
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        className="bg-background border-border text-sm rounded-xl min-h-[140px] resize-none"
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        💡 Tip: Use <code className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded">{`{name}`}</code> to insert the member's first name dynamically.
                                    </p>
                                </div>
                            </form>
                        )}

                        {activeTab === "lists" && (
                            <div className="space-y-4 pt-2">
                                {!isEditingList ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Active Lists</span>
                                            <Button
                                                onClick={() => setIsEditingList(true)}
                                                size="sm"
                                                className="h-8 text-xs font-bold rounded-lg uppercase tracking-wider"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Create List
                                            </Button>
                                        </div>

                                        {isLoadingLists ? (
                                            <div className="py-12 flex justify-center">
                                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            </div>
                                        ) : mailingLists.length === 0 ? (
                                            <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground bg-muted/10">
                                                No mailing lists yet. Create your first list to broadcast targeting.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {mailingLists.map((list) => (
                                                    <div key={list.id} className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-4">
                                                        <div className="space-y-0.5 min-w-0">
                                                            <p className="font-bold text-xs text-foreground truncate">{list.name}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{list.description || "No description provided."}</p>
                                                            <span className="inline-flex text-[9px] font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full mt-1.5">
                                                                {list.members?.length || 0} members
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => startEditList(list)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteListMutation.mutate(list.id)}
                                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveList} id="mailing-list-form" className="space-y-4 animate-in slide-in-from-right/10 duration-200">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">List Name</label>
                                            <Input
                                                type="text"
                                                placeholder="e.g. Morning Athletes"
                                                value={listName}
                                                onChange={(e) => setListName(e.target.value)}
                                                className="bg-background border-border h-10 text-sm rounded-xl"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                            <Input
                                                type="text"
                                                placeholder="e.g. Clients who check in before 10 AM"
                                                value={listDescription}
                                                onChange={(e) => setListDescription(e.target.value)}
                                                className="bg-background border-border h-10 text-sm rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Members ({selectedMemberIds.length})</label>
                                            <Input
                                                type="text"
                                                placeholder="Search members by name or email..."
                                                value={memberSearchQuery}
                                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                className="bg-background border-border h-9 text-xs rounded-xl mb-2"
                                            />
                                            <div className="max-h-[220px] overflow-y-auto border border-border rounded-xl divide-y divide-border/60 bg-background/50">
                                                {filteredMembers.map((m: any) => {
                                                    const isChecked = selectedMemberIds.includes(m.id);
                                                    return (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => toggleMemberSelection(m.id)}
                                                            className="flex items-center justify-between p-2.5 hover:bg-accent/40 cursor-pointer select-none transition-colors"
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <p className="font-semibold text-xs text-foreground truncate">
                                                                    {m.user?.firstName} {m.user?.lastName}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate">{m.user?.email}</p>
                                                            </div>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                                isChecked 
                                                                    ? "border-primary bg-primary text-primary-foreground" 
                                                                    : "border-border bg-transparent"
                                                            }`}>
                                                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {filteredMembers.length === 0 && (
                                                    <p className="text-xs text-muted-foreground text-center py-6">No matching members found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-border flex items-center gap-3 shrink-0">
                    {activeTab === "broadcast" ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 text-xs font-bold h-10 rounded-xl"
                            >
                                Close
                            </Button>
                            <Button
                                type="submit"
                                form="broadcast-sms-form"
                                disabled={broadcastMutation.isPending}
                                className="flex-1 text-xs font-bold h-10 rounded-xl"
                            >
                                {broadcastMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    "Send Broadcast"
                                )}
                            </Button>
                        </>
                    ) : isEditingList ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetListForm}
                                className="flex-1 text-xs font-bold h-10 rounded-xl"
                            >
                                Back to Lists
                            </Button>
                            <Button
                                type="submit"
                                form="mailing-list-form"
                                disabled={saveListMutation.isPending}
                                className="flex-1 text-xs font-bold h-10 rounded-xl"
                            >
                                {saveListMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Save List"
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="w-full text-xs font-bold h-10 rounded-xl"
                        >
                            Close
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
