"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/store/auth.store";

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((m) => m.Player),
  { ssr: false }
);

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {/* Hide navbar on landing page */}
      <style>{`
        header.gh-navbar { display: none !important; }
        main { margin-top: 0 !important; }
      `}</style>

      <div
        className="min-h-screen flex items-center"
        style={{
          background: "#ffffff",
        }}
      >
        <div className="w-full flex items-center justify-between px-10 sm:px-16 lg:px-24 py-16">

          {/* Left — text content */}
          <div className="max-w-lg">
            <h1
              style={{
                fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
                fontSize: "clamp(3rem, 8vw, 6rem)",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#1a1a18",
                margin: 0,
              }}
            >
              Digital
              <br />
              Knowledge
              <br />
              Platform
            </h1>

            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#4a4a46",
                marginTop: "1.5rem",
                maxWidth: "22rem",
              }}
            >
              Ready to get started? Sign in with your university
              credentials and access the full knowledge
            </p>

            <div style={{ marginTop: "2rem" }}>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.75rem 2rem",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontFamily: "'Georgia', serif",
                    fontWeight: 400,
                    color: "#ffffff",
                    background: "#1a7f5a",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.75rem 2rem",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontFamily: "'Georgia', serif",
                    fontWeight: 400,
                    color: "#ffffff",
                    background: "#1a7f5a",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Right — Lottie animation */}
          <div className="flex items-center justify-center flex-1 max-w-xl">
            <Player
              autoplay
              loop
              src="/animation.json"
              style={{ width: "100%", maxWidth: "520px" }}
            />
          </div>

        </div>
      </div>
    </>
  );
}
