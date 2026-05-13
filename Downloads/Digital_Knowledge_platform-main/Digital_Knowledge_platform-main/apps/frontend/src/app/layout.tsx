import type { Metadata } from "next";
import { Crimson_Pro, Lora } from "next/font/google";
import "./tailwind.generated.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const crimsonPro = Crimson_Pro({ subsets: ["latin"], display: "swap", variable: "--font-heading" });
const lora = Lora({ subsets: ["latin"], display: "swap", variable: "--font-serif" });

export const metadata: Metadata = {
  title: "DKP — Digital Knowledge Platform",
  description: "A unified academic knowledge management system for archives, research, student projects, and library catalog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.variable} ${crimsonPro.variable} font-serif min-h-screen relative`}>
        {/* Subtle paper texture overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
        <Providers>
          <div className="flex flex-col min-h-screen relative z-0">
            <Navbar />
            <main className="flex-1 bg-[var(--color-canvas-default)] py-8">
              {children}
            </main>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "6px",
                fontSize: "14px",
                border: "1px solid var(--color-border-default)",
                boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
                background: "var(--color-canvas-default)",
                color: "var(--color-fg-default)",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#1a7f37", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#d1242f", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
