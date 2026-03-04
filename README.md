# bunny-farm

A personal two-person iOS app. The admin (you) sends messages and triggers live events to the user's phone; the user (your girlfriend) sends nudges back. Built on Expo + Node/Express + Supabase Postgres, deployed to Railway.

---

## How it works

```
iPhone (Expo app)  ←──WebSocket──→  Railway backend  ←→  Supabase (Postgres)
        ↑                                    ↓
   push notification            Expo Push Notification Service
```

- **One app binary** — everyone runs the same build. Everyone starts in user mode. Admin mode is unlocked by a hidden gesture (5 taps on the title).
- **Two Railway environments** — `prod` (her phone) and `sandbox` (your dev target). Toggled via a switch in the admin panel.
- **WebSocket** for real-time events while the app is open; push notifications for background delivery.
- **Cron job** runs every minute to fire scheduled events that have come due.

---

## Project structure

```
bunny-farm/
├── .env                         # Secrets — never commit
├── .gitignore
├── README.md
├── DEVELOPMENT.md               # Quick local dev reference
├── TASK.md                      # Original build task list
│
├── infra/                       # Terraform (Railway provider)
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── backend/                     # Node/Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts               # createApp() — Express setup, no side effects
│       ├── index.ts             # Server entry: migrations, WS, cron, listen
│       ├── db.ts                # pg Pool + runMigrations()
│       ├── db/
│       │   └── migrate.sql      # Full schema + seed (users, messages, nudges, events, game_state)
│       ├── middleware/
│       │   └── auth.ts          # requireAuth / requireAdmin / requireUser
│       ├── routes/
│       │   ├── nudge.ts         # POST /api/nudge
│       │   ├── messages.ts      # POST /api/message, GET /api/messages
│       │   ├── events.ts        # POST /api/event
│       │   └── gameState.ts     # GET/POST /api/game, POST /api/users/:id/push-token
│       ├── services/
│       │   ├── push.ts          # Expo push SDK wrapper
│       │   ├── realtime.ts      # WebSocket server + broadcast()
│       │   └── cron.ts          # Scheduled event dispatcher
│       ├── __mocks__/
│       │   └── db.ts            # Jest manual mock for pg Pool
│       └── __tests__/
│           ├── auth.test.ts
│           └── routes/
│               ├── nudge.test.ts
│               ├── messages.test.ts
│               ├── events.test.ts
│               └── gameState.test.ts
│
└── mobile/                      # Expo SDK 52, iOS only
    ├── package.json
    ├── tsconfig.json
    ├── app.config.ts            # Dynamic Expo config, injects env vars as extras
    ├── eas.json
    └── src/
        ├── App.tsx              # Root: RoleProvider → AppInner (screen router + EventOverlay)
        ├── context/
        │   └── RoleContext.tsx  # Role state, admin unlock, AsyncStorage persistence
        ├── hooks/
        │   ├── usePush.ts       # Expo push token registration
        │   ├── useWebSocket.ts  # WS connect, auth handshake, reconnect
        │   └── useGameState.ts  # Game state fetch + update
        ├── components/
        │   ├── NudgeButton.tsx  # Big button that calls POST /api/nudge
        │   ├── MessageDisplay.tsx
        │   └── EventOverlay.tsx # Full-screen modal triggered by WS 'event' messages
        ├── screens/
        │   ├── UserScreen.tsx   # Black screen, tap-5 admin unlock, nudge + messages (TODO)
        │   └── AdminScreen.tsx  # Send message, trigger event, sandbox toggle, nudge ack
        ├── lib/
        │   └── api.ts           # Typed fetch wrapper; role + sandbox aware
        └── __tests__/
            └── RoleContext.test.tsx
```

---

## Features

### User side
- Black placeholder screen (final design TBD)
- Tap the title 5 times to reveal the admin unlock modal
- Receives real-time events as full-screen overlays with confetti
- Receives push notifications when the app is backgrounded
- Sends nudges to the admin

### Admin side (unlocked with code)
- **Send message** — text message delivered to user via WebSocket + push
- **Trigger event** — named event (`surprise`, `goodnight`, etc.) with an optional message, delivered immediately or scheduled to a specific UTC time
- **Sandbox toggle** — flips all API calls to the sandbox backend; user's phone is unaffected
- **Nudge acknowledgement** — see when user sent a nudge (live, via WebSocket)
- **Lock admin mode** — reverts to user mode

### Backend
- Bearer token auth — two static tokens (`ADMIN_SECRET`, `USER_SECRET`); role attached to `req.role`
- Migrations run automatically on startup from `migrate.sql`
- WebSocket auth handshake — client sends `{"type":"auth","token":"..."}` on connect
- Cron job fires every minute to check for scheduled events

### Database tables
| Table | Purpose |
|-------|---------|
| `users` | Two fixed rows: `admin` and `user`; stores push token |
| `messages` | Messages from admin to user |
| `nudges` | Nudges from user to admin |
| `events` | Named events; can be immediate or scheduled |
| `game_state` | Shared JSON blob for future game mechanics |

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node 20+ | `brew install node` |
| npm | included with Node |
| Xcode | Mac App Store (for iOS Simulator) |
| EAS CLI | `npm install -g eas-cli` |
| Terraform | `brew install terraform` (for infra provisioning) |
| Railway CLI | `brew install railway` (optional, dashboard works too) |

Log in to EAS:
```bash
eas login
```

---

## Local development

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The dev server starts on port 3000 and reads the root `.env` automatically via dotenv. It runs migrations against `DATABASE_URL` on startup.

### 2. Mobile (iOS Simulator)

Create `.env.local` in the **project root** (this file overrides `.env` for local dev only and is gitignored):

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SANDBOX_API_URL=http://localhost:3000
```

Then start the Expo dev server:

```bash
cd mobile
npm install
npx expo start --ios
```

Expo will open the app in the iOS Simulator automatically.

### Testing admin unlock in the Simulator

1. App opens to a **black screen** with "bunny farm 🐰" in white.
2. Tap the title **5 times** (within 2 seconds between taps).
3. A modal appears asking for a code.
4. Enter `bunnyhop99` (the value of `ADMIN_UNLOCK_CODE` in `.env`).
5. Tap **Unlock** — the AdminScreen appears.
6. Role is persisted in AsyncStorage; it survives app restarts.
7. Tap **Lock admin mode** at the bottom of AdminScreen to go back to user mode.

---

## Running tests

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

28 tests across 5 suites. All DB, push, and WebSocket dependencies are mocked — no database connection needed.

Test coverage:
- `auth.test.ts` — `requireAuth`, `requireAdmin`, `requireUser` middleware (8 tests)
- `routes/nudge.test.ts` — auth guards, broadcast call, conditional push (4 tests)
- `routes/messages.test.ts` — POST message, GET messages, auth guards (5 tests)
- `routes/events.test.ts` — immediate vs scheduled, auth guards, cron trigger update (4 tests)
- `routes/gameState.test.ts` — game state CRUD, push token registration (7 tests)

### Mobile (jest-expo)

```bash
cd mobile
npm test
```

5 tests in `RoleContext.test.tsx`:
- Default role is `'user'`
- Wrong unlock code returns false, role unchanged
- Correct code returns true, role becomes `'admin'`, AsyncStorage written
- `lockAdmin()` reverts to `'user'`, AsyncStorage written
- Persisted `'admin'` in AsyncStorage loads on mount

---

## API reference

All endpoints require `Authorization: Bearer <token>`. Admin endpoints require `ADMIN_SECRET`; user endpoints require `USER_SECRET`.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/api/nudge` | user | Record a nudge, notify admin |
| `POST` | `/api/message` | admin | Send message to user |
| `GET` | `/api/messages` | user | Fetch all messages (marks as read) |
| `POST` | `/api/event` | admin | Trigger or schedule an event |
| `GET` | `/api/game` | any | Get shared game state |
| `POST` | `/api/game` | admin | Update shared game state |
| `POST` | `/api/users/:id/push-token` | any | Register push token |

### Sandbox header

Add `x-sandbox: true` to any request to tag the row as sandbox. The user's prod device only receives rows without this flag.

### Example: trigger an event

```bash
curl -X POST https://<backend-prod-url>/api/event \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"surprise","payload":{"message":"I love you 🐰"}}'
```

### Example: schedule an event

```bash
curl -X POST https://<backend-prod-url>/api/event \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"goodnight","payload":{"message":"Sleep well 🌙"},"scheduled_at":"2025-12-31T22:00:00Z"}'
```

The cron job checks every minute and fires events whose `scheduled_at` has passed.

---

## First-time deploy

### 1. Provision Railway infrastructure

```bash
cd infra
terraform init
terraform apply -var="railway_token=<your-token>"
```

Note the printed service IDs.

### 2. Connect backend source in Railway dashboard

For both `backend-prod` and `backend-sandbox`:
1. Railway dashboard → select service → **Settings → Source**
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Railway auto-deploys on push to `main`

### 3. Set environment variables in Railway

Set these for **both** services via Railway dashboard → service → **Variables**:

```
DATABASE_URL          (Supabase connection string)
SUPABASE_URL
SUPABASE_SECRET_KEY   (post-Nov 2025: called SUPABASE_SECRET_KEY, not service_role)
ADMIN_SECRET
USER_SECRET
NODE_ENV=production
```

> `PORT` is set automatically by Railway — do not add it manually.

### 4. Update mobile API URLs

Once Railway assigns domains, update `.env`:

```
EXPO_PUBLIC_API_URL=https://backend-prod-<hash>.up.railway.app
EXPO_PUBLIC_SANDBOX_API_URL=https://backend-sandbox-<hash>.up.railway.app
```

### 5. Build for TestFlight

```bash
cd mobile
eas build --platform ios --profile preview
```

Upload the `.ipa` to TestFlight via App Store Connect, install on her phone.

---

## Environment variables

### Root `.env` (never committed)

```
# Railway
RAILWAY_TOKEN=

# Supabase
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SECRET_KEY=

# Auth tokens (48-char hex)
ADMIN_SECRET=
USER_SECRET=

# Admin unlock
ADMIN_UNLOCK_CODE=bunnyhop99

# Mobile API URLs (update after terraform apply)
EXPO_PUBLIC_API_URL=https://backend-prod-placeholder.railway.app
EXPO_PUBLIC_SANDBOX_API_URL=https://backend-sandbox-placeholder.railway.app
```

### Root `.env.local` (local dev only, gitignored)

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SANDBOX_API_URL=http://localhost:3000
```

### Railway env var checklist

- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SECRET_KEY`
- [ ] `ADMIN_SECRET`
- [ ] `USER_SECRET`
- [ ] `NODE_ENV=production`

---

## WebSocket protocol

The client connects to `wss://<backend-url>/ws`. After the TCP handshake, the client must immediately send:

```json
{"type": "auth", "token": "<ADMIN_SECRET or USER_SECRET>"}
```

On success the server replies:

```json
{"type": "auth_ok", "userId": "admin"}
```

If the client doesn't authenticate within 5 seconds the connection is closed with code `4001`. The mobile app handles reconnection with exponential backoff.

Server-to-client event payloads:

| Event | Sent to | Payload |
|-------|---------|---------|
| `message` | user | `{type, content, message_type, id}` |
| `event` | user | `{type, event_type, payload}` |
| `nudge` | admin | `{type, sandbox}` |
