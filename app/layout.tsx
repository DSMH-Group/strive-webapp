// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto, Poppins, Merriweather } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/providers/query-provider";

// --- Font Definitions ---
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// 🚀 NEW: Whitelabel Font Options
const roboto = Roboto({ weight: ['400', '500', '700', '900'], subsets: ['latin'], variable: '--font-roboto' });
const poppins = Poppins({ weight: ['400', '500', '600', '700', '900'], subsets: ['latin'], variable: '--font-poppins' });
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
    title: "Strive Platform Ecosystem",
    description: "Multi-Tenant Fitness Workspace Infrastructure",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cn(
                "h-full",
                "antialiased",
                // Inject all font variables into the DOM
                inter.variable,
                geistSans.variable,
                geistMono.variable,
                roboto.variable,
                poppins.variable,
                merriweather.variable
            )}
        >
        <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
            {children}
        </QueryProvider>
        </body>
        </html>
    );
}