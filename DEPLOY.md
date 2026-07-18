# Deploying this project

## 1. Configure environment

```
cp .env.example .env
```

Fill in `.env` with real values. See the comments in `.env.example` for what each
variable does. Do not commit the filled-in `.env`.

## 2. Google Sign-In setup

This app only needs a Google OAuth **Client ID** — no client secret is used
anywhere (the backend verifies Google access tokens directly via Google's
`tokeninfo`/`userinfo` endpoints, it never exchanges an authorization code).

1. Go to https://console.cloud.google.com -> APIs & Services -> Credentials
2. Open the existing OAuth 2.0 Client ID (or create one, type "Web application")
3. Under **Authorized JavaScript origins**, add your real deploy domain
   (e.g. `https://yourdomain.com`), in addition to `http://localhost:3000`
4. Copy the Client ID into **both** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_ID` in `.env` — they must be identical.

If you forget step 3, the Google popup opens but sign-in fails with an
origin/redirect mismatch error — that's the most common deploy issue here,
not a missing secret.

`NEXT_PUBLIC_*` variables are baked into the frontend JS bundle at **build
time**, not read at container start. That's why the Docker Compose setup below
passes them as build `args`, not just runtime `environment`.

## 3. Build and run

```
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

This starts Postgres, Redis, Elasticsearch, ClamAV, MinIO, MailHog, the
backend (port 4000), and the frontend (port 3000).

Check backend health:
```
curl http://localhost:4000/health
```

## 4. Changing the Google Client ID later

Because it's baked in at build time, changing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
requires rebuilding the frontend image, not just restarting the container:

```
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d frontend
```
