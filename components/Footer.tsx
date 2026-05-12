import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-card border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
                            <Activity className="w-5 h-5 text-primary" />
                            Stride
                        </Link>
                        <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
                            Replacing the patchwork of spreadsheets, WhatsApp groups, and broken payment tools with one clean, definitive platform.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-foreground font-semibold mb-4 text-sm tracking-wide uppercase">Product</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#audience" className="hover:text-primary transition-colors">Use Cases</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-foreground font-semibold mb-4 text-sm tracking-wide uppercase">Company</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Stride Fitness Tech. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}