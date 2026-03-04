# bunny-farm

A personal two-person app: admin sends messages and triggers live events to the user's phone; the user sends nudges back.

---

## Architecture

```
Mobile (Expo, iOS)  ←→  Railway Backend (Node/Express)  ←→  Supabase (Postgres)
                                    ↕
                        Expo Push Notification Service
```

- **Single app build** — everyone opens the same binary. Default role on launch is `user`. Admin mode is unlocked by a hidden gesture (see below).
- **Two Railway environments** — `prod` (her phone) and `sandbox` (your dev target). Toggle in admin panel.
- **WebSocket** for realtime events; push notifications for background delivery.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node 20+ | `brew install node` |
| npm | included with Node |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` |
| Railway CLI | `brew install railway` |
| curl + python3 | pre-installed on macOS |

Log in to each service:
```bash
railway login
eas login
# (no additional login needed — token is read from .env)
```

---

## First-time setup

### 1. Provision Railway services

```bash
bash infra/setup.sh
```

This calls the Railway GraphQL API to create one project with two services (`backend-prod` and `backend-sandbox`). It reads `RAILWAY_TOKEN` from your `.env` automatically. Note the printed service IDs — you'll reference them in the Railway dashboard.

### 2. Connect backend source in Railway dashboard

For each service (`backend-prod` and `backend-sandbox`):
1. Open Railway dashboard → select the service
2. Go to **Settings → Source** → connect your GitHub repo
3. Set the **Root Directory** to `backend`
4. Railway will auto-deploy on every push to `main`

### 3. Set environment variables in Railway

Set these for **both** services via Railway dashboard → service → **Variables**:

```
DATABASE_URL          # from your .env (Supabase connection string)
SUPABASE_URL          # from your .env
SUPABASE_SECRET_KEY   # from your .env (never use publishable key here)
ADMIN_SECRET          # from your .env
USER_SECRET           # from your .env
NODE_ENV              # production
```

> `PORT` is set automatically by Railway — do not add it manually.

After adding variables Railway will redeploy automatically.

### 4. Update mobile API URLs

Once Railway assigns domains to each service, copy them into your `.env`:

```bash
# In .env — replace the placeholders:
EXPO_PUBLIC_API_URL=https://backend-prod-<hash>.up.railway.app
EXPO_PUBLIC_SANDBOX_API_URL=https://backend-sandbox-<hash>.up.railway.app
```

Find the domain: Railway dashboard → service → **Settings → Networking → Public Domain**.

### 5. Run locally

```bash
# Install backend deps
cd backend && npm install

# Run backend locally (needs a local or tunnel to Supabase)
npm run dev

# Install mobile deps
cd ../mobile && npm install

# Start Expo dev server
npx expo start
```

### 6. Build for TestFlight (iOS preview)

```bash
cd mobile
eas build --platform ios --profile preview
```

Upload the resulting `.ipa` to TestFlight via App Store Connect, then install on her phone.

---

## How admin unlock works

The app launches in **user mode** for everyone. There is no visible sign that admin mode exists.

To unlock admin mode:
1. Tap the **"bunny farm 🐰" title** 5 times in quick succession (within 2 seconds)
2. A modal will appear asking for a code
3. Enter: **`bunnyhop99`** (stored in `.env` as `ADMIN_UNLOCK_CODE`)
4. Admin mode activates and persists across restarts (stored in AsyncStorage)

To exit admin mode, tap **"Lock admin mode"** at the bottom of the admin screen.

---

## How to trigger a live event

### From the admin panel (in-app)

1. Unlock admin mode
2. In the **Trigger event** section, fill in:
   - **Event type** — a short label (e.g. `surprise`, `goodnight`)
   - **Message** — text shown on the full-screen overlay
   - **Scheduled at** — ISO 8601 datetime (optional; leave blank to fire immediately)
3. Tap **Trigger**

The user's phone will:
- Show a full-screen overlay with confetti (if app is open)
- Receive a push notification (if app is in background)

### From the REST API (curl)

```bash
curl -X POST https://backend-prod-<hash>.up.railway.app/api/event \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"surprise","payload":{"message":"I love you 🐰"}}'
```

---

## Sandbox vs production

In admin mode there is a **Sandbox toggle** at the top of the screen. When enabled:
- API calls go to `EXPO_PUBLIC_SANDBOX_API_URL`
- Nudge and event rows are written with `sandbox: true` so they can be filtered separately
- The user's phone (pointing at prod) is unaffected

---

## Project structure

```
bunny-farm/
├── .env                  # Secrets — never commit
├── infra/                # Terraform (Railway provider)
├── backend/              # Express + WebSocket + cron
│   └── src/
│       ├── db.ts         # Postgres pool + migrations
│       ├── middleware/   # Bearer token auth
│       ├── routes/       # REST endpoints
│       └── services/     # push / realtime / cron
└── mobile/               # Expo (iOS)
    └── src/
        ├── context/      # RoleContext (admin unlock)
        ├── hooks/        # usePush, useWebSocket, useGameState
        ├── components/   # NudgeButton, MessageDisplay, EventOverlay
        └── screens/      # UserScreen, AdminScreen
```

---

## Required Railway env vars (checklist)

- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SECRET_KEY`
- [ ] `ADMIN_SECRET`
- [ ] `USER_SECRET`
- [ ] `NODE_ENV=production`
