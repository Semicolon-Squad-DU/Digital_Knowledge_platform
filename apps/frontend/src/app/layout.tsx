import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./tailwind.generated.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DKP — Digital Knowledge Platform",
  description: "A unified academic knowledge management system for archives, research, student projects, and library catalog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${notoSansBengali.className} min-h-screen`}>
        <Providers>
          {children}
        </Providers>

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
      </body>
    </html>
  );
}
