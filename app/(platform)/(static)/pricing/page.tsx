import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck } from "lucide-react";

export default function PricingPage() {
    return (
        <div className="flex flex-col items-center py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Plans built to <span className="text-primary italic">scale.</span></h1>
                <Badge variant="outline" className="border-primary/20 text-primary py-1 px-4">
                    <ShieldCheck className="w-3 h-3 mr-2" /> Recovered payments cover the cost
                </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-8 w-full items-end">
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

function PriceTier({ name, price, desc, features, highlight = false }: any) {
    return (
        <Card className={`relative border-border ${highlight ? 'border-primary bg-secondary/40 scale-105 shadow-2xl' : 'bg-card'}`}>
            {highlight && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">MOST POPULAR</Badge>}
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                <div className="text-3xl font-black py-4">{price}</div>
                <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {features.map((f: never) => (
                    <div key={f} className="flex items-center text-sm font-light">
                        <Check className="w-4 h-4 mr-3 text-primary" /> {f}
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button className="w-full font-bold" variant={highlight ? "default" : "secondary"}>
                    {name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
            </CardFooter>
        </Card>
    );
}