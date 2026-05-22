// app/page.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center w-full text-foreground bg-background">

            {/* HERO SECTION - The Playbook "One-Liner" */}
            <section className="relative w-full px-6 py-24 md:py-40 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <Badge variant="outline" className="mb-8 border-primary/20 bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-sm">
                    Stop managing your gym on WhatsApp
                </Badge>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[1.1]">
                    One platform. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">Every gym needs.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl font-light leading-relaxed">
                    Stride replaces the patchwork of spreadsheets and broken tools with one definitive engine. Give your
                    members a premium digital experience that feels like your own app.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg"  className="rounded-md px-10 h-14 font-bold shadow-md">
                        <Link href="/book-demo">Member App</Link>
                    </Button>
                    <Button size="lg" variant="outline"  className="rounded-md px-10 h-14 border-border hover:bg-accent hover:text-accent-foreground">
                        <Link href="#roi">Explore ROI</Link>
                    </Button>
                </div>
            </section>

            {/* QUICK REFERENCE STATS - Page 8 of Playbook */}
            <section className="w-full border-y border-border bg-card/30">
                <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-border">
                    <StatBlock value="78%" label="Gyms still rely on manual tools" />
                    <StatBlock value="3x" label="Higher retention for digital-first gyms" />
                    <StatBlock value="10hrs" label="Manual admin saved per week" />
                </div>
            </section>

            {/* THE BRANDED EXPERIENCE (Mockup) - Page 5 of Playbook */}
            <section className="w-full max-w-7xl px-6 py-32">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="flex-1 space-y-8">
                        <Badge className="bg-primary/10 text-primary border-transparent rounded-sm">THE BRANDED EXPERIENCE</Badge>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                            It feels like your gym has its own app. <br />
                            <span className="text-primary italic">Because it does.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground font-light leading-relaxed">
                            This is our biggest differentiator. You get a custom domain, your colors, and your logo.
                            Instantly position your gym as a modern, professional brand.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <FeaturePoint text="Builds Member Loyalty" />
                            <FeaturePoint text="Your Own Domain" />
                            <FeaturePoint text="Custom Brand Colors" />
                            <FeaturePoint text="Clean PWA Experience" />
                        </div>
                    </div>

                    {/* PHONE MOCKUP */}
                    <div className="flex-1 w-full max-w-md bg-card rounded-xl p-3 border border-border shadow-2xl relative overflow-hidden aspect-[9/19]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-background rounded-b-md z-10 border-b border-border border-x" />
                        <div className="w-full h-full bg-background rounded-lg p-6 flex flex-col pt-14 border border-border/50 relative">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 bg-primary/20 border border-primary rounded-md flex items-center justify-center">
                                    <span className="text-primary font-black text-xs italic">S</span>
                                </div>
                                <div className="text-xl font-bold tracking-widest">STRIDE GYM</div>
                            </div>
                            <div className="bg-card border border-primary/30 rounded-md p-5 mb-6 relative">
                                <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                                <div className="text-[10px] text-primary font-bold mb-2 uppercase">Active Membership</div>
                                <div className="text-foreground font-medium">Premium Plan • Renews Jun 1</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/50 p-4 rounded-md text-center border border-border">
                                    <div className="text-xl font-bold">12</div>
                                    <div className="text-[10px] text-muted-foreground">Visits</div>
                                </div>
                                <div className="bg-muted/50 p-4 rounded-md text-center border border-border">
                                    <div className="text-xl font-bold">4.2kg</div>
                                    <div className="text-[10px] text-muted-foreground">Down</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AUDIENCE PROFILES - Page 3 of Playbook */}
            <section id="audience" className="w-full py-32 bg-muted/20 border-y border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4">Built for your specific workflow.</h2>
                        <p className="text-muted-foreground text-lg font-light">Four buyer profiles, one foundation.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AudienceCard title="Independent Gym" pain="Drowning in manual admin & cash tracking." angle="Time saved & payment transparency." />
                        <AudienceCard title="Personal Trainer" pain="Client management is scattered on WhatsApp." angle="Professional image & client experience." />
                        <AudienceCard title="Multi-Branch" pain="No visibility across locations or reporting." angle="Scalability & unified dashboard." />
                        <AudienceCard title="Specialized Studio" pain="Generic tools don't fit Yoga, MMA, or Clubs." angle="Flexibility & domain-specific modules." />
                    </div>
                </div>
            </section>

            {/* ROI SECTION - Page 6 of Playbook */}
            <section id="roi" className="w-full max-w-7xl px-6 py-32">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <Badge className="bg-primary/10 text-primary border-transparent rounded-sm">ROI ANALYSIS</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold">Stop losing money on <span className="text-primary italic">doing nothing.</span></h2>
                        <div className="space-y-6">
                            <RoiPoint title="The One-Payment Rule" desc="Recovering one missed payment per month typically covers your entire Strive subscription." />
                            <RoiPoint title="Reclaim your Saturdays" desc="Automate the 10+ hours of manual payment chasing and spreadsheet updating you do every week." />
                        </div>
                    </div>
                    <Card className="bg-card border-primary/20 p-10 rounded-lg shadow-2xl relative">
                        <Zap className="absolute top-8 right-8 text-primary/20 w-16 h-16" />
                        <CardHeader className="px-0">
                            <CardTitle className="text-2xl">The Manual Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-border">
                                <span className="text-muted-foreground font-light">Revenue Leakage</span>
                                <span className="text-xl font-bold text-destructive">10-15%</span>
                            </div>
                            <div className="bg-primary/10 p-6 rounded-md border border-primary/20 text-center">
                                <span className="text-sm font-bold italic block mb-1">Net ROI with Stride</span>
                                <span className="text-3xl font-black text-primary tracking-tighter uppercase">Positive in Month 1</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* OBJECTION HANDLING - Page 6 of Playbook */}
            <section className="w-full max-w-4xl px-6 py-32">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold">Handling the hard questions.</h2>
                </div>
                <Accordion className="w-full">
                    <AccordionItem value="item-1" className="border-border px-4 py-2">
                        <AccordionTrigger className="text-lg font-bold hover:text-primary transition-colors italic tracking-tight">
                            &#34;We already use WhatsApp to manage members.&#34;
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-light text-base leading-relaxed">
                            WhatsApp is great for chat, but it can&#39;t track payment history, automate renewals, or
                            give members a professional home for their progress. Strive turns your &#34;chats&#34; into
                            a scalable business system.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-border px-4 py-2">
                        <AccordionTrigger className="text-lg font-bold hover:text-primary transition-colors italic tracking-tight">
                            &#34;Our members aren&#39;t very tech-savvy.&#34;
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-light text-base leading-relaxed">
                            If they can use Facebook or WhatsApp, they can use Strive. We&#39;ve built the member app to
                            be incredibly intuitive, focusing only on what matters: check-ins, payments, and progress.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-border px-4 py-2">
                        <AccordionTrigger className="text-lg font-bold hover:text-primary transition-colors italic tracking-tight">
                            &#34;We&#39;ve tried software before and it failed.&#34;
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-light text-base leading-relaxed">
                            Most software is built for the US/Europe market. Strive is built specifically for this
                            region—supporting local gateways like PayHere and addressing the specific &#34;manual
                            admin&#34; culture of local gyms.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>

            {/* FINAL CTA */}
            <section className="w-full py-32 bg-primary flex flex-col items-center text-center px-6">
                <h2 className="text-4xl md:text-6xl font-black text-primary-foreground mb-10 tracking-tighter">Ready to reclaim your time?</h2>
                <Button size="lg" variant="secondary" className="h-16 px-12 rounded-md text-xl font-bold shadow-2xl transition-transform hover:scale-105">
                    <Link href="/book-demo">Start Your 14-Day Free Trial</Link>
                </Button>
            </section>

        </div>
    );
}

// SUB-COMPONENTS
function StatBlock({ value, label }: { value: string, label: string }) {
    return (
        <div className="pt-8 md:pt-0">
            <div className="text-5xl font-black text-foreground mb-3 tracking-tighter">{value}</div>
            <div className="text-muted-foreground font-medium max-w-[200px] mx-auto text-sm leading-relaxed">{label}</div>
        </div>
    );
}

function FeaturePoint({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
}

function AudienceCard({ title, pain, angle }: { title: string, pain: string, angle: string }) {
    return (
        <Card className="bg-card border-border h-full flex flex-col hover:border-primary/50 transition-colors rounded-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary tracking-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-destructive font-black uppercase mr-1">Pain:</span>{pain}
                </p>
                <p className="text-xs text-foreground font-bold mt-auto">
                    <span className="text-primary uppercase mr-1">Lead with:</span>{angle}
                </p>
            </CardContent>
        </Card>
    );
}

function RoiPoint({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
                <h4 className="font-bold text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}