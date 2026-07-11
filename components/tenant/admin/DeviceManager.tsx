// components/tenant/admin/DeviceManager.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { striveClientFetch } from '@/lib/api';
import { 
    Plus, Lock, Shield, Settings, Copy, Check, Info, Trash2, 
    RefreshCw, Cpu, ChevronRight, HelpCircle, HardDrive, Wifi 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Device {
    id: string;
    name: string;
    location: string;
    direction: 'IN' | 'OUT';
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
}

export function DeviceManager({ tenantId }: { tenantId: string }) {
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [showWizard, setShowWizard] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '',
        location: '',
        direction: 'IN' as 'IN' | 'OUT',
        protocol: 'HIKVISION_ISAPI',
    });
    const [generatedKey, setGeneratedKey] = useState('');
    const [copied, setCopied] = useState(false);

    // Fetch registered devices
    const { data: devices = [], isLoading } = useQuery<Device[]>({
        queryKey: ['tenantDevices', tenantId],
        queryFn: async () => {
            const res = await striveClientFetch('/api/v1/devices', {
                headers: { 'X-Tenant-ID': tenantId },
            });
            return res.ok ? res.json() : [];
        },
    });

    // Create Device Mutation
    const createDeviceMutation = useMutation({
        mutationFn: async (payload: typeof newDevice) => {
            const res = await striveClientFetch('/api/v1/devices', {
                method: 'POST',
                headers: {
                    'X-Tenant-ID': tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to create device');
            return res.json();
        },
        onSuccess: (data) => {
            setGeneratedKey(data.plaintextToken);
            queryClient.invalidateQueries({ queryKey: ['tenantDevices', tenantId] });
            setCurrentStep(2); // Jump to Key generation step
        },
    });

    // Toggle Device Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ deviceId, status }: { deviceId: string; status: 'ACTIVE' | 'INACTIVE' }) => {
            const res = await striveClientFetch(`/api/v1/devices/${deviceId}`, {
                method: 'PATCH',
                headers: {
                    'X-Tenant-ID': tenantId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantDevices', tenantId] });
        },
    });

    // Delete/Revoke Device Mutation
    const deleteDeviceMutation = useMutation({
        mutationFn: async (deviceId: string) => {
            await striveClientFetch(`/api/v1/devices/${deviceId}`, {
                method: 'DELETE',
                headers: { 'X-Tenant-ID': tenantId },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantDevices', tenantId] });
        },
    });

    const handleCopyKey = () => {
        navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateDevice = () => {
        if (!newDevice.name || !newDevice.location) return;
        createDeviceMutation.mutate(newDevice);
    };

    const handleResetWizard = () => {
        setShowWizard(false);
        setCurrentStep(0);
        setGeneratedKey('');
        setNewDevice({
            name: '',
            location: '',
            direction: 'IN',
            protocol: 'HIKVISION_ISAPI',
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column: Main Interface */}
            <div className="lg:col-span-2 space-y-6">
                {!showWizard ? (
                    <Card className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-border">
                            <div>
                                <h3 className="font-extrabold text-foreground text-lg tracking-tight">Access Gateways & Scanners</h3>
                                <p className="text-xs text-muted-foreground mt-1">Manage physical hardware links, door locks, and entry scanners.</p>
                            </div>
                            <Button 
                                onClick={() => setShowWizard(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Link Scanner Device
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="py-10 text-center text-xs text-muted-foreground">Loading devices...</div>
                        ) : devices.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <Cpu className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                                <p className="text-xs text-muted-foreground font-medium italic">No physical devices or scanners registered yet.</p>
                                <p className="text-[10px] text-muted-foreground/60 max-w-sm mx-auto">Click "Link Scanner Device" above to initialize a new local entry lock or biometric scanner.</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden bg-background">
                                <Table>
                                    <TableHeader className="bg-muted/50 border-b border-border">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 pl-5">Device Name</TableHead>
                                            <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3">Location</TableHead>
                                            <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 w-24">Direction</TableHead>
                                            <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 w-28">Status</TableHead>
                                            <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 w-20 text-right pr-5">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {devices.map((device) => (
                                            <TableRow key={device.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
                                                <TableCell className="py-4 pl-5 font-bold text-xs text-foreground flex items-center gap-2">
                                                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                                                    {device.name}
                                                </TableCell>
                                                <TableCell className="py-4 text-xs text-muted-foreground">
                                                    {device.location}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                        device.direction === 'IN' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                            : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                    }`}>
                                                        {device.direction === 'IN' ? 'Check-In' : 'Check-Out'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => toggleStatusMutation.mutate({
                                                            deviceId: device.id,
                                                            status: device.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                                                        })}
                                                        className={`h-6 px-2 text-[10px] font-bold rounded-lg ${
                                                            device.status === 'ACTIVE' 
                                                                ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-500/5' 
                                                                : 'text-muted-foreground hover:text-foreground bg-muted'
                                                        }`}
                                                    >
                                                        {device.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-5">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to revoke this device? Scans from this device will be blocked immediately.')) {
                                                                deleteDeviceMutation.mutate(device.id);
                                                            }
                                                        }}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                ) : (
                    /* Multi-Step Guided Registration Wizard */
                    <Card className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-border">
                            <div>
                                <h3 className="font-extrabold text-foreground text-lg tracking-tight">Link Scanner Device</h3>
                                <p className="text-xs text-muted-foreground mt-1">Guided wizard to provision API keys and configuration profiles.</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={handleResetWizard}
                                className="text-muted-foreground hover:text-foreground text-xs font-bold"
                            >
                                Cancel
                            </Button>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex items-center gap-3">
                            {['Device Details', 'Hardware Profile', 'Generate Key', 'Tutorial'].map((step, idx) => (
                                <React.Fragment key={step}>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            currentStep === idx 
                                                ? 'bg-primary text-primary-foreground' 
                                                : currentStep > idx 
                                                    ? 'bg-emerald-500 text-white' 
                                                    : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {currentStep > idx ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                        </div>
                                        <span className={`text-[10px] font-bold ${currentStep === idx ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step}
                                        </span>
                                    </div>
                                    {idx < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Step Content */}
                        {currentStep === 0 && (
                            <div className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Device Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Turnstile Door 1" 
                                        value={newDevice.name}
                                        onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl h-10 px-3.5 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Physical Location</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Front Lobby Entrance" 
                                        value={newDevice.location}
                                        onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                                        className="w-full bg-background border border-border rounded-xl h-10 px-3.5 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Direction Mode</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setNewDevice({...newDevice, direction: 'IN'})}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                                                newDevice.direction === 'IN' 
                                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                                                    : 'bg-background border-border text-muted-foreground hover:bg-accent/40'
                                            }`}
                                        >
                                            Check-In (Default Entrance)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewDevice({...newDevice, direction: 'OUT'})}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                                                newDevice.direction === 'OUT' 
                                                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' 
                                                    : 'bg-background border-border text-muted-foreground hover:bg-accent/40'
                                            }`}
                                        >
                                            Check-Out (Exit Tracker)
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        disabled={!newDevice.name || !newDevice.location}
                                        onClick={() => setCurrentStep(1)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl"
                                    >
                                        Select Protocol
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-4 py-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Hardware Integration Protocol</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'HIKVISION_ISAPI', title: 'Hikvision ISAPI Direct', desc: 'Direct XML communication over local networks (Direct camera/gate hook).' },
                                        { id: 'HIKCENTRAL', title: 'HikCentral OpenAPI', desc: 'Centralized platforms. Webhooks pushed from HikCentral Professional server.' },
                                        { id: 'GENERIC_HTTP', title: 'Generic HTTP / QR / RFID', desc: 'Custom scanners that fire simple HTTP POST scan payloads (JSON).' },
                                        { id: 'GOOGLE_WALLET', title: 'Google Wallet Smart Tap', desc: 'Certified NFC terminals (e.g. VTAP, HID) reading secure Wallet passes.' }
                                    ].map((proto) => (
                                        <button
                                            key={proto.id}
                                            type="button"
                                            onClick={() => setNewDevice({...newDevice, protocol: proto.id})}
                                            className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                                                newDevice.protocol === proto.id 
                                                    ? 'bg-primary/5 border-primary text-foreground' 
                                                    : 'bg-background border-border text-muted-foreground hover:bg-accent/40'
                                            }`}
                                        >
                                            <h4 className="text-xs font-extrabold text-foreground">{proto.title}</h4>
                                            <p className="text-[10px] text-muted-foreground leading-normal">{proto.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-4 flex justify-between">
                                    <Button 
                                        variant="ghost"
                                        onClick={() => setCurrentStep(0)}
                                        className="text-muted-foreground hover:text-foreground text-xs font-bold"
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        disabled={createDeviceMutation.isPending}
                                        onClick={handleCreateDevice}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl"
                                    >
                                        {createDeviceMutation.isPending ? 'Generating Key...' : 'Register & Generate Key'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 py-2">
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-amber-700">
                                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-600 tracking-tight">Write Down Access Token</h4>
                                        <p className="text-[10px] text-amber-600/90 leading-relaxed mt-0.5">
                                            This token is only shown **once** for security reasons. Copy it now and paste it into your hardware scanner config.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Device Token (x-device-token)</span>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-muted/50 p-2.5 rounded-lg font-mono text-xs font-bold text-foreground break-all select-all border border-border">
                                            {generatedKey}
                                        </code>
                                        <Button 
                                            onClick={handleCopyKey}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg h-10 w-10 p-0"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        onClick={() => setCurrentStep(3)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl"
                                    >
                                        Configure Terminal instructions
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 py-2">
                                <div className="border border-border rounded-xl p-4 bg-background space-y-4">
                                    <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                                        <Wifi className="w-4 h-4 text-primary" /> Setup Manual: {
                                            newDevice.protocol === 'HIKVISION_ISAPI' ? 'Hikvision ISAPI Direct' :
                                            newDevice.protocol === 'HIKCENTRAL' ? 'HikCentral Professional' :
                                            newDevice.protocol === 'GOOGLE_WALLET' ? 'Google Wallet Smart Tap' : 'Generic HTTP POST API'
                                        }
                                    </h4>

                                    {newDevice.protocol === 'HIKVISION_ISAPI' && (
                                        <div className="text-xs space-y-3 leading-relaxed text-muted-foreground">
                                            <p>To link your Hikvision camera or terminal directly:</p>
                                            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] font-medium">
                                                <li>Log into your Hikvision device web administrative panel.</li>
                                                <li>Navigate to **Configuration** → **Network** → **Advanced Settings** → **HTTP Listening**.</li>
                                                <li>Set target address/IP to: <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-foreground">https://strive-core-development.up.railway.app/api/v1/devices/ingress</code></li>
                                                <li>Set request headers context:
                                                    <ul className="list-disc pl-4 mt-1 font-mono text-[10px] text-foreground">
                                                        <li><code className="font-bold">x-device-token</code>: (Your generated token)</li>
                                                        <li><code className="font-bold">x-tenant-id</code>: {tenantId}</li>
                                                    </ul>
                                                </li>
                                                <li>Save configuration and test connection.</li>
                                            </ol>
                                        </div>
                                    )}

                                    {newDevice.protocol === 'GENERIC_HTTP' && (
                                        <div className="text-xs space-y-3 leading-relaxed text-muted-foreground">
                                            <p>Configure your HTTP reader to POST scans to this endpoint:</p>
                                            <code className="block bg-muted/40 p-2 rounded-lg font-mono text-[10px] text-foreground border border-border">
                                                POST https://strive-core-development.up.railway.app/api/v1/devices/ingress
                                            </code>
                                            <p>Required Headers:</p>
                                            <ul className="list-disc pl-4 font-mono text-[10px] text-foreground">
                                                <li><code className="font-bold">x-device-token</code>: (Your generated token)</li>
                                                <li><code className="font-bold">x-tenant-id</code>: {tenantId}</li>
                                                <li><code className="font-bold">Content-Type</code>: application/json</li>
                                            </ul>
                                            <p>Example JSON Request Body:</p>
                                            <pre className="bg-muted p-2 rounded-lg font-mono text-[10px] text-foreground border border-border">
{`{
  "credential": "RFID_CARD_NUMBER_OR_QR_HASH"
}`}
                                            </pre>
                                        </div>
                                    )}

                                    {newDevice.protocol === 'HIKCENTRAL' && (
                                        <div className="text-xs space-y-3 leading-relaxed text-muted-foreground">
                                            <p>To connect using HikCentral OpenAPI subscriptions:</p>
                                            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] font-medium">
                                                <li>Log into your HikCentral OpenAPI interface.</li>
                                                <li>Navigate to **Event & Alarm Subscription**.</li>
                                                <li>Create a subscription targeting our endpoint: <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-foreground">https://strive-core-development.up.railway.app/api/v1/devices/ingress</code></li>
                                                <li>Make sure to include the custom headers <code className="font-mono text-foreground font-bold">x-device-token</code> and <code className="font-mono text-foreground font-bold">x-tenant-id</code> in your subscription hook config.</li>
                                            </ol>
                                        </div>
                                    )}

                                    {newDevice.protocol === 'GOOGLE_WALLET' && (
                                        <div className="text-xs space-y-3 leading-relaxed text-muted-foreground">
                                            <p>For Google Wallet Smart Tap access passes:</p>
                                            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] font-medium">
                                                <li>Install a Google Smart Tap certified reader (e.g. VTAP, HID).</li>
                                                <li>Configure the reader's server address to POST payload decryptions to our ingress webhook endpoint.</li>
                                                <li>Provide the collector credentials and verify headers.</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <Button 
                                        onClick={handleResetWizard}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold h-9 px-5 rounded-xl"
                                    >
                                        Complete Registration
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Right Column: Instruction Sidebar & Help FAQ */}
            <div className="space-y-6">
                <Card className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h4 className="font-extrabold text-foreground text-sm tracking-tight flex items-center gap-2">
                        <Shield className="w-4.5 h-4.5 text-primary" /> Multi-Tenant Isolation
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                        Every linked device is hard-scoped to your gym's tenant UUID. Scanners will only ever authenticate users registered in your specific facility.
                    </p>
                </Card>

                <Card className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h4 className="font-extrabold text-foreground text-sm tracking-tight flex items-center gap-2">
                        <HelpCircle className="w-4.5 h-4.5 text-primary" /> Configuration Guide & FAQ
                    </h4>
                    <div className="space-y-4 divide-y divide-border">
                        <div className="pt-0 space-y-1">
                            <h5 className="text-[11px] font-bold text-foreground">What is an x-device-token?</h5>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                                A cryptographically unique, long-lived API key that authenticates the terminal to your database without requiring standard staff accounts.
                            </p>
                        </div>
                        <div className="pt-3 space-y-1">
                            <h5 className="text-[11px] font-bold text-foreground">How does local network routing work?</h5>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                                Ensure your local network has public routing or a reverse proxy/VPN configured so that your local terminals can reach our cloud URL.
                            </p>
                        </div>
                        <div className="pt-3 space-y-1">
                            <h5 className="text-[11px] font-bold text-foreground">How do RFID cards link to users?</h5>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                                Go to the Members tab, search for the user, open the management slide-over panel, and enter the card hex code directly in the RFID details section.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
