"use client";

import {useState} from "react";
import {SubmitHandler, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {striveClientFetch} from "@/lib/api";
import {toast} from "sonner";
import {Loader2} from "lucide-react";

// Use an explicit string validator for the HTML input field state
const formSchema = z.object({
    name: z.string().min(3, "Gym name must be at least 3 characters"),
    subdomain: z.string().regex(/^[a-z0-9-]+$/, "Only lowercase alphanumeric keys and hyphens allowed"),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color format"),
    vatPercentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "VAT must be a valid positive number",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProvisionTenantClient({ownerId}: { ownerId: string }) {
    const [step, setStep] = useState(1);
    const [isLaunching, setIsLaunching] = useState(false);

    const {register, trigger, handleSubmit, watch, formState: {errors}} = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subdomain: "",
            primaryColor: "#EA580C",
            vatPercentage: "18", // Handled cleanly as a string state parameter
        },
        mode: "onChange"
    });

    const watchedPrimaryColor = watch("primaryColor", "#EA580C");

    const handleNext = async () => {
        let fields: (keyof FormValues)[] = [];
        if (step === 1) fields = ["name", "subdomain"];
        if (step === 2) fields = ["primaryColor"];

        const isValid = await trigger(fields);
        if (isValid) setStep((s) => s + 1);
    };

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        setIsLaunching(true);

        // 1. Flatten payload to conform to direct DTO constraints
        // 2. Mock a temporary real UUID context for the ownerId if the backend strictly requires it
        // (Note: For production, your user table id generation parameter in Better-Auth should be switched to UUIDv4)
        const isV4UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId);
        const compliantOwnerId = isV4UUID ? ownerId : "00000000-0000-0000-0000-000000000000"; // Fallback placeholder UUID

        const payload = {
            name: values.name,
            subdomain: values.subdomain,
            ownerId: ownerId,
        };

        console.log("--- DEBUG: Sending Provisioning Payload ---", payload);

        try {
            const res = await striveClientFetch("/api/v1/tenants", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorDetails = await res.text();
                console.error("Core engine rejected payload with error:", errorDetails);
                throw new Error("Provisioning rejected by core engine.");
            }

            toast.success("Gym workspace provisioned successfully!");

            const port = process.env.NODE_ENV === 'development' ? ':3000' : '';
            const targetDomain = process.env.NODE_ENV === 'development' ? 'localhost' : 'stride.lk';

            window.location.href = `http://${values.subdomain}.${targetDomain}${port}`;
        } catch (err) {
            console.error(err);
            toast.error("Failed to provision gym. Schema validation error or taken subdomain.");
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto bg-zinc-900/40 border-white/5 rounded-2xl backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">Setup Workspace Environment
                    ({step}/3)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {step === 1 && (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gym
                                    Name</Label>
                                <Input placeholder="Power World Gym" {...register("name")}
                                       className="h-11 bg-zinc-950 border-white/10 rounded-xl focus:ring-1 focus:ring-primary/30"/>
                                {errors.name &&
                                    <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Desired
                                    Subdomain</Label>
                                <div className="relative flex items-center">
                                    <Input placeholder="powerworld" {...register("subdomain")}
                                           className="h-11 bg-zinc-950 border-white/10 rounded-xl pr-28 focus:ring-1 focus:ring-primary/30 text-sm font-semibold"/>
                                    <span
                                        className="absolute right-4 text-xs font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-1 rounded-md">.stride.lk</span>
                                </div>
                                {errors.subdomain &&
                                    <p className="text-red-500 text-xs font-medium">{errors.subdomain.message}</p>}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Brand Primary
                                Accent (Hex)</Label>
                            <div className="flex gap-3">
                                <div
                                    className="w-11 h-11 rounded-xl border border-white/10 shrink-0 shadow-inner transition-colors duration-200"
                                    style={{backgroundColor: /^#([A-Fa-f0-9]{6})$/.test(watchedPrimaryColor) ? watchedPrimaryColor : "#EA580C"}}
                                />
                                <Input {...register("primaryColor")}
                                       className="h-11 bg-zinc-950 border-white/10 rounded-xl font-mono uppercase focus:ring-1 focus:ring-primary/30"/>
                            </div>
                            {errors.primaryColor &&
                                <p className="text-red-500 text-xs font-medium">{errors.primaryColor.message}</p>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Corporate VAT
                                Registration %</Label>
                            <Input type="number" {...register("vatPercentage")}
                                   className="h-11 bg-zinc-950 border-white/10 rounded-xl focus:ring-1 focus:ring-primary/30 font-semibold"/>
                            {errors.vatPercentage &&
                                <p className="text-red-500 text-xs font-medium">{errors.vatPercentage.message}</p>}
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
                        <Button disabled={step === 1 || isLaunching} onClick={() => setStep(s => s - 1)} type="button"
                                variant="outline"
                                className="h-11 rounded-xl px-5 border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-wider">
                            Back
                        </Button>
                        {step < 3 ? (
                            <Button onClick={handleNext} type="button"
                                    className="h-11 rounded-xl px-6 font-bold text-sm tracking-tight">
                                Next Step
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLaunching}
                                    className="h-11 rounded-xl px-6 font-bold text-sm tracking-tight gap-2">
                                {isLaunching ?
                                    <Loader2 className="w-4 h-4 animate-spin"/> : "Launch Gym Infrastructure"}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}