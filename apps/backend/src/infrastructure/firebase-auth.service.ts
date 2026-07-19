import jwt, { type JwtHeader, type SigningKeyCallback } from "jsonwebtoken";
import { config } from "../core/config";
import { logger } from "../core/config/logger";

export interface VerifiedFirebaseProfile {
  email: string;
  name: string;
  firebaseUid: string;
}

// Firebase ID tokens are RS256 JWTs signed by Google. Their public signing
// certificates are published (and rotated) at this endpoint as a map of
// kid -> x509 cert. We cache them until the response's max-age elapses so we're
// not fetching on every login, then re-fetch when a token references an unseen
// kid or the cache expires.
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: Record<string, string> = {};
let certCacheExpiresAt = 0;

async function getSigningCert(kid: string): Promise<string> {
  const now = Date.now();
  if (now < certCacheExpiresAt && certCache[kid]) {
    return certCache[kid];
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error("Could not fetch Google signing certificates");
  }
  certCache = (await res.json()) as Record<string, string>;

  // Respect Cache-Control: max-age so we honour Google's rotation cadence.
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  certCacheExpiresAt = now + maxAgeSeconds * 1000;

  const cert = certCache[kid];
  if (!cert) {
    throw new Error("Firebase token signed by an unknown key");
  }
  return cert;
}

// Verifies a Firebase ID token server-side before trusting any identity claim.
// This validates the RS256 signature against Google's public certs and enforces
// the issuer/audience/expiry claims Firebase mandates — no service-account key
// or Google Cloud billing required. The token's own claims (never the request
// body) are the source of truth for email/name/uid.
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseProfile> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Firebase ID token is required");
  }

  const projectId = config.auth.firebaseProjectId;
  if (!projectId) {
    // Fail closed: without the expected audience we can't prove the token was
    // minted for THIS Firebase project, so any token would be accepted.
    throw new Error("FIREBASE_PROJECT_ID is not configured on the server");
  }

  // Resolve the signing key from the token's `kid` header before verifying.
  const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
    if (!header.kid) {
      callback(new Error("Firebase token has no key id"));
      return;
    }
    getSigningCert(header.kid)
      .then((cert) => callback(null, cert))
      .catch((err) => callback(err as Error));
  };

  const payload = await new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ["RS256"],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
      },
      (err, decoded) => {
        if (err) {
          reject(new Error(`Invalid Firebase ID token: ${err.message}`));
          return;
        }
        resolve(decoded as jwt.JwtPayload);
      }
    );
  });

  // Firebase-specific claim checks beyond what jwt.verify covers: `sub` is the
  // stable user id and must be non-empty, and the email must be verified before
  // we treat it as an authenticated identity.
  const uid = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const emailVerified = payload.email_verified === true;
  const name = typeof payload.name === "string" && payload.name ? payload.name : email;

  if (!uid) {
    throw new Error("Firebase token is missing a subject (uid)");
  }
  if (!email) {
    throw new Error("Firebase token is missing an email address");
  }
  if (!emailVerified) {
    logger.warn("Firebase sign-in rejected: email not verified", { email });
    throw new Error("Email address is not verified");
  }

  return { email, name, firebaseUid: uid };
}
