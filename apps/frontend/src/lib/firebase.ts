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
