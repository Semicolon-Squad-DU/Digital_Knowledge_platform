import { config } from "../core/config";
import { logger } from "../core/config/logger";

export interface VerifiedGoogleProfile {
  email: string;
  name: string;
  googleId: string;
}

interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  scope?: string;
  expires_in?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
}

// Verifies a Google OAuth access token server-side before trusting any
// identity claim from it. Never derive email/name from client-submitted
// request body fields for OAuth login — always go through this function.
export async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedGoogleProfile> {
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("Google access token is required");
  }

  // 1. Confirm the token is genuine and unexpired, and (if configured) that
  // it was actually issued to this application — prevents a token obtained
  // via a different OAuth client from being replayed against this backend.
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenInfoRes.ok) {
    throw new Error("Invalid or expired Google access token");
  }
  const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;
  if (tokenInfo.error) {
    throw new Error(`Google token verification failed: ${tokenInfo.error_description || tokenInfo.error}`);
  }

  if (config.auth.googleClientId) {
    const audience = tokenInfo.aud || tokenInfo.azp;
    if (audience !== config.auth.googleClientId) {
      logger.warn("Google OAuth token audience mismatch — possible token replay attempt", {
        audience,
        expected: config.auth.googleClientId,
      });
      throw new Error("Google token was not issued for this application");
    }
  } else {
    logger.warn("GOOGLE_CLIENT_ID is not configured — skipping token audience check");
  }

  // 2. Fetch the verified profile directly from Google. This — not the
  // request body — is the source of truth for email/name/providerId.
  const profileRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!profileRes.ok) {
    throw new Error("Failed to fetch verified profile for Google token");
  }
  const profile = (await profileRes.json()) as GoogleUserInfo;

  if (!profile.email || !profile.sub) {
    throw new Error("Google profile is missing required fields");
  }
  if (profile.email_verified !== true && profile.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email,
    googleId: profile.sub,
  };
}
