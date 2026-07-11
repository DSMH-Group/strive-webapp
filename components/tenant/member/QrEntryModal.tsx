// components/tenant/member/QrEntryModal.tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldAlert, BadgeCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    membershipId: string;
    memberName: string;
    membershipStatus: string;
}

export function QrEntryModal({ isOpen, onClose, membershipId, memberName, membershipStatus }: QrEntryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 relative shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-center select-none">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header info */}
                <div className="space-y-1">
                    <h3 className="font-extrabold text-foreground text-base tracking-tight">Facility Entry Pass</h3>
                    <p className="text-[11px] text-muted-foreground">Scan at the front desk or gate receiver to check-in.</p>
                </div>

                {/* QR Code visual container */}
                <div className="bg-white p-5 rounded-2xl inline-block border border-border/40 shadow-inner">
                    <QRCodeSVG 
                        value={membershipId}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="Q"
                        includeMargin={false}
                    />
                </div>

                {/* Profile detail cards */}
                <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Member name</span>
                        <span>{memberName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                            membershipStatus === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                            {membershipStatus}
                        </span>
                    </div>
                </div>

                {/* Warnings / Expiry info */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium bg-amber-500/5 border border-amber-500/10 py-2 rounded-xl">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Do not share your QR code pass with anyone.
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl"
                    >
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}
