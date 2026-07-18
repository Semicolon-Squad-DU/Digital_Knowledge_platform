import type { Metadata } from "next";
import { Noto_Sans_Bengali, Libre_Caslon_Text, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  display: "swap",
});
// Institutional landing-page pairing (exposed as CSS vars, used on the homepage):
// Libre Caslon Text for serif display headings, Hanken Grotesk for body.
const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
});
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  title: "DKP - Digital Knowledge Platform",
  description: "A unified academic knowledge management system for archives, research, student projects, and library catalog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hankenGrotesk.className} ${notoSansBengali.className} ${libreCaslon.variable} ${hankenGrotesk.variable} min-h-screen`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
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
