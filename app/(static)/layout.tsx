import { ReactNode } from "react";
import {Header} from "@/components/Header";
import {Footer} from "@/components/Footer";

export default function StaticLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground">
            <Header />
            <main className="flex-1 pt-16"> {/* pt-16 offsets the fixed header */}
                {children}
            </main>
            <Footer />
        </div>
    );
}