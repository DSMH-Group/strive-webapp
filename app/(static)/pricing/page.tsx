// app/pricing/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
    return (
        /* Take over 100% of screen space layout width horizontally to clear blank edge gutters */
        <div className="w-full min-h-screen bg-background text-foreground py-24 px-6 flex flex-col items-center">

            {/* Header Content Section */}
            <div className="text-center mb-20 space-y-4 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
                    Plans built to <span className="text-primary tracking-normal font-serif lowercase">scale.</span>
                </h1>
                <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-muted-foreground bg-card border border-border rounded-full shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Recovered payments cover the cost
                    </span>
                </div>
            </div>

            {/* Inner Content Grid Bound Layout Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl items-stretch">
                <PriceTier
                    name="Starter"
                    price="LKR 4,500"
                    desc="For solo trainers."
                    features={["50 Members", "Manual Tracking", "Standard App"]}
                />
                <PriceTier
                    name="Professional"
                    price="LKR 12,500"
                    desc="For independent gyms."
                    highlight
                    features={["Unlimited Members", "PayHere Integration", "Full Whitelabeling", "Custom Domain"]}
                />
                <PriceTier
                    name="Enterprise"
                    price="Custom"
                    desc="Multi-branch chains."
                    features={["Global Identity", "Multi-Branch Dashboard", "API Access"]}
                />
            </div>
        </div>
    );
}

interface PriceTierProps {
    name: string;
    price: string;
    desc: string;
    features: string[];
    highlight?: boolean;
}

function PriceTier({ name, price, desc, features, highlight = false }: PriceTierProps) {
    return (
        <Card className={cn(
            "relative bg-card border-border rounded-lg flex flex-col justify-between transition-all p-3",
            highlight && "border-primary bg-card shadow-[0_0_40px_rgba(var(--primary),0.05)]"
        )}>
            {highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-sm font-black text-[9px] tracking-widest px-3 py-0.5 uppercase">
                    Most Popular
                </Badge>
            )}
            <div>
                <CardHeader className="space-y-1.5 pb-6">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {name}
                    </CardTitle>
                    <div className="text-4xl font-black tracking-tight font-mono py-2 text-foreground">
                        {price}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground/80 font-light">
                        {desc}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 pb-8">
                    {features.map((feature) => (
                        <div key={feature} className="flex items-center text-xs font-medium text-muted-foreground">
                            <Check className="w-3.5 h-3.5 mr-3 text-primary shrink-0 stroke-[3]" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </CardContent>
            </div>

            <CardFooter className="pt-4">
                <Button
                    className={cn(
                        "w-full font-black uppercase tracking-wider text-[11px] h-12 rounded-sm transition-all",
                        highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    {name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
            </CardFooter>
        </Card>
    );
}