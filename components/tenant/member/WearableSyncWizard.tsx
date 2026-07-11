// components/tenant/member/WearableSyncWizard.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { striveClientFetch } from '@/lib/api';
import { 
    X, Shield, Check, Info, ChevronRight, Laptop, Smartphone,
    RefreshCw, Heart, Flame, Footprints, AlertCircle, Compass 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WearableSyncWizardProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    onSyncComplete: () => void;
}

export function WearableSyncWizard({ isOpen, onClose, tenantId, onSyncComplete }: WearableSyncWizardProps) {
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedDevice, setSelectedDevice] = useState('Galaxy Watch 6 (Wear OS)');
    const [syncProgress, setSyncProgress] = useState(0);

    const syncMutation = useMutation({
        mutationFn: async () => {
            // Generate realistic wearable data points for the past 7 days
            const dataPoints = [];
            const now = new Date();
            
            // 1. Generate 7 days of Steps
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                dataPoints.push({
                    type: 'STEPS',
                    value: Math.floor(Math.random() * (12500 - 7500) + 7500),
                    date: date.toISOString().split('T')[0] + 'T12:00:00Z',
                });
            }

            // 2. Generate 7 days of Calories
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                dataPoints.push({
                    type: 'CALORIES',
                    value: Math.floor(Math.random() * (650 - 350) + 350),
                    date: date.toISOString().split('T')[0] + 'T12:00:00Z',
                });
            }

            // 3. Generate Heart Rate logs for today (simulated workout readings)
            const hrReadings = [72, 75, 110, 142, 165, 158, 130, 95, 80, 74];
            hrReadings.forEach((val, idx) => {
                const date = new Date(now);
                date.setHours(8, idx * 10, 0, 0); // Spaced by 10 minutes from 8:00 AM
                dataPoints.push({
                    type: 'HEART_RATE',
                    value: val,
                    date: date.toISOString(),
                });
            });

            const res = await striveClientFetch('/api/v1/metrics/health/sync', {
                method: 'POST',
                headers: {
                    'X-Tenant-ID': tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: 'HEALTH_CONNECT',
                    dataPoints,
                }),
            });

            if (!res.ok) throw new Error('Failed to sync wearable data');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberWearableMetrics', tenantId] });
            queryClient.invalidateQueries({ queryKey: ['memberDashboardAggregated', tenantId] });
            
            // Simulate sync animation progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                setSyncProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    onSyncComplete();
                    onClose();
                }
            }, 300);
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 relative shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-center select-none">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-accent/50 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="space-y-1">
                    <h3 className="font-extrabold text-foreground text-base tracking-tight flex items-center justify-center gap-1.5">
                        <Compass className="w-5 h-5 text-primary" /> Google Wearables Sync
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Link your Wear OS device and Google Health accounts.</p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-1.5 pb-2">
                    {[0, 1, 2, 3].map((step) => (
                        <div 
                            key={step} 
                            className={`h-1 rounded-full transition-all duration-300 ${
                                currentStep === step 
                                    ? 'w-6 bg-primary' 
                                    : currentStep > step 
                                        ? 'w-4 bg-emerald-500' 
                                        : 'w-2 bg-muted'
                            }`}
                        />
                    ))}
                </div>

                {/* Step Content */}
                {currentStep === 0 && (
                    <div className="space-y-5 text-left py-2">
                        <div className="bg-muted/40 p-4 rounded-2xl border border-border/40 space-y-3">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Google Account Link</span>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Connect Strive to your Google account to enable bidirectional background syncing via Google Health Connect.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="w-full bg-background hover:bg-accent border border-border rounded-xl h-12 px-4 flex items-center justify-between text-xs font-bold text-foreground transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base shrink-0">🤖</span>
                                    <span>Sign in with Google</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-4 text-left py-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Select Wear OS Device</span>
                        <div className="space-y-2">
                            {[
                                { name: 'Galaxy Watch 6 (Wear OS)', info: 'Paired via Bluetooth - Connected', icon: '⌚' },
                                { name: 'Pixel Watch 2 (Wear OS)', info: 'Available', icon: '⌚' },
                                { name: 'Samsung Gear S3 (Tizen)', info: 'Unsupported Platform', disabled: true, icon: '⌚' }
                            ].map((dev) => (
                                <button
                                    key={dev.name}
                                    disabled={dev.disabled}
                                    onClick={() => {
                                        setSelectedDevice(dev.name);
                                        setCurrentStep(2);
                                    }}
                                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                                        dev.disabled 
                                            ? 'opacity-40 cursor-not-allowed bg-muted/20 border-border/40' 
                                            : selectedDevice === dev.name
                                                ? 'bg-primary/5 border-primary text-foreground' 
                                                : 'bg-background border-border text-muted-foreground hover:bg-accent/40'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-extrabold text-foreground">{dev.name}</h4>
                                        <p className="text-[10px] text-muted-foreground">{dev.info}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 text-left py-2">
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-amber-700">
                            <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-amber-600 tracking-tight">Security & Permissions</h4>
                                <p className="text-[10px] text-amber-600/90 leading-relaxed mt-0.5">
                                    Strive requests access to read step tallies, calorie logs, and real-time heart rate intervals.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'Steps Count', desc: 'Allows steps progression charts monitoring', icon: <Footprints className="w-4 h-4 text-emerald-500" /> },
                                { label: 'Active Energy (Calories)', desc: 'Allows active energy expenditure audits', icon: <Flame className="w-4 h-4 text-orange-500" /> },
                                { label: 'Heart Rate', desc: 'Workout heart rate zone logs during visits', icon: <Heart className="w-4 h-4 text-rose-500" /> }
                            ].map((perm) => (
                                <div key={perm.label} className="flex items-center gap-3 p-3 bg-muted/40 border border-border/40 rounded-xl">
                                    {perm.icon}
                                    <div>
                                        <h5 className="text-xs font-bold text-foreground leading-none">{perm.label}</h5>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{perm.desc}</p>
                                    </div>
                                    <div className="ml-auto bg-emerald-500/10 text-emerald-500 p-0.5 rounded-full border border-emerald-500/20">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button 
                                variant="ghost"
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 text-muted-foreground hover:text-foreground text-xs font-bold h-10 rounded-xl"
                            >
                                Back
                            </Button>
                            <Button 
                                onClick={() => {
                                    setCurrentStep(3);
                                    syncMutation.mutate();
                                }}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 rounded-xl"
                            >
                                Grant & Link
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-5 py-4">
                        {syncProgress < 100 ? (
                            <div className="space-y-4">
                                <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-bold text-foreground tracking-tight">Syncing Google Fit / Wear OS Data...</h4>
                                    <p className="text-[10px] text-muted-foreground">Uploading Steps, Calories, and Heart Rate logs.</p>
                                </div>
                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-primary h-full transition-all duration-300 rounded-full" 
                                        style={{ width: `${syncProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mx-auto">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-bold text-foreground tracking-tight">Sync Successful!</h4>
                                    <p className="text-[10px] text-muted-foreground">Linked to Galaxy Watch 6. Dynamic progress charts are now active.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
