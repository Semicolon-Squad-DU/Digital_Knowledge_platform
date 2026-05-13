import type { Metadata } from "next";
import { Noto_Sans_Bengali, Playfair_Display } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./tailwind.generated.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { VaultFooter } from "@/components/layout/VaultFooter";
import { Toaster } from "react-hot-toast";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-noto-bengali",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "DKP — Digital Knowledge Platform",
  description: "A unified academic knowledge management system for archives, research, student projects, and library catalog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${playfair.variable} ${notoSansBengali.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Google Material Symbols; no official next/font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body
        className={`${GeistSans.className} ${notoSansBengali.className} min-h-screen bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1 min-h-0">{children}</main>
          <VaultFooter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "8px",
                fontSize: "14px",
                border: "1px solid #27272a",
                boxShadow: "4px 4px 0 0 #27272a",
                background: "#121215",
                color: "#fafafa",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#34d399", secondary: "#09090b" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#09090b" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
