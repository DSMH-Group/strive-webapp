// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Poppins, Roboto, Merriweather } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/providers/query-provider";

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fontPoppins = Poppins({ weight: ['400', '500', '600', '700', '900'], subsets: ['latin'], variable: '--font-poppins' });
const fontRoboto = Roboto({ weight: ['400', '500', '700', '900'], subsets: ['latin'], variable: '--font-roboto' });
const fontSerif = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
    title: "Strive Platform Ecosystem",
    description: "Multi-Tenant Fitness Workspace Infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            className={cn(
                "h-full antialiased",
                fontSans.variable,
                fontPoppins.variable,
                fontRoboto.variable,
                fontSerif.variable
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