"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { striveClientFetch } from "@/lib/api";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(3, "Gym name must be at least 3 chars"),
    subdomain: z.string().regex(/^[a-z0-9-]+$/, "Only lowercase alphanumeric/hyphens allowed"),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color"),
    vatPercentage: z.coerce.number().min(0),
});

export default function ProvisionTenantClient({ ownerId }: { ownerId: string }) {
    const [step, setStep] = useState(1);

    const { register, trigger, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subdomain: "",
            primaryColor: "#EA580C",
            vatPercentage: 18,
        },
        mode: "onChange"
    });

    const handleNext = async () => {
        let fields: any[] = [];
        if (step === 1) fields = ["name", "subdomain"];
        if (step === 2) fields = ["primaryColor"];

        const isValid = await trigger(fields);
        if (isValid) setStep(s => s + 1);
    };

    const onSubmit = async (values: any) => {
        const payload = {
            name: values.name,
            subdomain: values.subdomain,
            ownerId: ownerId,
            themeConfig: { primaryColor: values.primaryColor },
            taxRules: { vatPercentage: values.vatPercentage, ssclPercentage: 2.5 },
            gatewayKeys: { payhereMerchantId: "", payhereSecret: "" }
        };

        try {
            const res = await striveClientFetch("/api/v1/tenants", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Provisioning failed");

            toast.success("Gym provisioned successfully!");
            const port = process.env.NODE_ENV === 'development' ? ':3000' : '';
            window.location.href = `http://${values.subdomain}.dsmhgroup.com${port}`;
        } catch (err) {
            toast.error("Failed to provision gym. Subdomain might be taken.");
        }
    };

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle>Gym Setup ({step}/3)</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label>Gym Name</Label>
                                <Input {...register("name")} />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Subdomain</Label>
                                <Input {...register("subdomain")} />
                                {errors.subdomain && <p className="text-red-500 text-sm">{errors.subdomain.message as string}</p>}
                            </div>
                        </>
                    )}
                    {step === 2 && (
                        <div className="space-y-2">
                            <Label>Brand Color (Hex)</Label>
                            <Input {...register("primaryColor")} />
                            {errors.primaryColor && <p className="text-red-500 text-sm">{errors.primaryColor.message as string}</p>}
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-2">
                            <Label>VAT %</Label>
                            <Input type="number" {...register("vatPercentage")} />
                            {errors.vatPercentage && <p className="text-red-500 text-sm">{errors.vatPercentage.message as string}</p>}
                        </div>
                    )}
                    <div className="flex justify-between mt-6">
                        <Button disabled={step === 1} onClick={() => setStep(s => s - 1)} type="button" variant="outline">Back</Button>
                        {step < 3 ? (
                            <Button onClick={handleNext} type="button">Next</Button>
                        ) : (
                            <Button type="submit">Launch Gym</Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}