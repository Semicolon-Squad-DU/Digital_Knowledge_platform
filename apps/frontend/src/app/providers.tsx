"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState, useEffect } from "react";

const THEME_MAP: Record<string, { primary: string; gradient135: string; gradient160: string; sidebar: string }> = {
  "#1a1a2e": {
    primary: "#1a1a2e",
    gradient135: "linear-gradient(135deg, #1a1a2e 0%, #111116 100%)",
    gradient160: "linear-gradient(160deg, rgba(30, 40, 60, 0.9) 0%, rgba(10, 15, 25, 1) 100%)",
    sidebar: "linear-gradient(135deg, #000000 0%, #2d2533 100%)",
  },
  "#312e81": {
    primary: "#312e81",
    gradient135: "linear-gradient(135deg, #312e81 0%, #111116 100%)",
    gradient160: "linear-gradient(160deg, rgba(49, 46, 129, 0.9) 0%, rgba(10, 15, 25, 1) 100%)",
    sidebar: "linear-gradient(135deg, #0f0f2d 0%, #312e81 100%)",
  },
  "#064e3b": {
    primary: "#064e3b",
    gradient135: "linear-gradient(135deg, #064e3b 0%, #111116 100%)",
    gradient160: "linear-gradient(160deg, rgba(6, 78, 59, 0.9) 0%, rgba(10, 15, 25, 1) 100%)",
    sidebar: "linear-gradient(135deg, #021a14 0%, #064e3b 100%)",
  },
  "#1e3a8a": {
    primary: "#1e3a8a",
    gradient135: "linear-gradient(135deg, #1e3a8a 0%, #111116 100%)",
    gradient160: "linear-gradient(160deg, rgba(30, 58, 138, 0.9) 0%, rgba(10, 15, 25, 1) 100%)",
    sidebar: "linear-gradient(135deg, #091833 0%, #1e3a8a 100%)",
  },
  "#4c0519": {
    primary: "#4c0519",
    gradient135: "linear-gradient(135deg, #4c0519 0%, #111116 100%)",
    gradient160: "linear-gradient(160deg, rgba(76, 5, 25, 0.9) 0%, rgba(10, 15, 25, 1) 100%)",
    sidebar: "linear-gradient(135deg, #24020a 0%, #4c0519 100%)",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const updateTheme = () => {
      const savedColor = localStorage.getItem("user_avatar_color") || "#1a1a2e";
      const config = THEME_MAP[savedColor] || THEME_MAP["#1a1a2e"];
      
      document.documentElement.style.setProperty("--avatar-theme-color", config.primary);
      document.documentElement.style.setProperty("--theme-gradient-135", config.gradient135);
      document.documentElement.style.setProperty("--theme-gradient-160", config.gradient160);
      document.documentElement.style.setProperty("--theme-sidebar-gradient", config.sidebar);
    };

    updateTheme();
    window.addEventListener("avatar-theme-changed", updateTheme);
    window.addEventListener("storage", updateTheme);

    return () => {
      window.removeEventListener("avatar-theme-changed", updateTheme);
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
