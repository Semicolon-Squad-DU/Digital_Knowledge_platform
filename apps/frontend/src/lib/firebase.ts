import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase web config values are not secrets — they're compiled into the client
// bundle by design (access is gated by Firebase Security Rules, not by hiding
// these keys). They're still read from NEXT_PUBLIC_* env vars so the project can
// be swapped per environment without a code change; the literals below are the
// current project's values used as a dev fallback.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDVpkG3aMcACsdQAgP4W8pjGqN5lSQezE8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "digital-knowledge-platfo-8e294.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "digital-knowledge-platfo-8e294",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "digital-knowledge-platfo-8e294.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "11122042227",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:11122042227:web:f74a6bf003add055219106",
};

// Next.js dev remounts and Fast Refresh can re-evaluate this module; getApps()
// guards against "Firebase App named '[DEFAULT]' already exists".
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);

// Request the profile/email scopes so the Google OAuth access token returned by
// signInWithPopup is accepted by Google's userinfo endpoint — which is what the
// backend (verifyGoogleAccessToken) calls to resolve the verified email/name.
export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
  provider.addScope("https://www.googleapis.com/auth/userinfo.email");
  return provider;
}

// Sentinel returned for popup dismissals — the caller should stay silent rather
// than show an error toast when the user simply closed the popup.
export const FIREBASE_POPUP_DISMISSED = "__popup_dismissed__";

// Turns a Firebase Auth error into a human-readable, actionable message.
// Crucially it names the two failures that only appear once deployed to a real
// domain — an unauthorized domain or a disabled Google provider — instead of
// hiding them behind a generic "sign-in failed", so misconfig is diagnosable
// from the UI. Returns FIREBASE_POPUP_DISMISSED when the user just closed the
// popup, so the caller can no-op.
export function firebaseAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return FIREBASE_POPUP_DISMISSED;
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This site's domain is not authorized for Google sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this project. Enable it under Firebase Console → Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Network error reaching Google. Check your connection and try again.";
    default:
      // Surface the raw code so a misconfiguration is still identifiable in
      // the wild rather than swallowed by a vague message.
      return code
        ? `Google sign-in failed (${code}). Please try again.`
        : "Google sign-in failed. Please try again.";
  }
}
