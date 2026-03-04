# bunny-farm Build Task List

## Decisions Made
- **Package manager**: npm
- **Platform**: iOS only
- **Infra IaC**: Terraform with `terraform-community-providers/railway` (v0.6.1)
- **Missing secrets**: ADMIN_SECRET, USER_SECRET, ADMIN_UNLOCK_CODE — generate random values, append to .env
- **Placeholder env vars**: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SANDBOX_API_URL — add as placeholders to .env

---

## Phase 0 — Bootstrap

- [ ] 0.1 Generate and append missing secrets to `.env`:
  - `ADMIN_SECRET` (random 32-char hex)
  - `USER_SECRET` (random 32-char hex)
  - `ADMIN_UNLOCK_CODE` (memorable short string)
  - `EXPO_PUBLIC_API_URL` (placeholder: `https://backend-prod.railway.app`)
  - `EXPO_PUBLIC_SANDBOX_API_URL` (placeholder: `https://backend-sandbox.railway.app`)

---

## Phase 1 — Backend

- [ ] 1.1 `backend/package.json` — dependencies: express, ws, expo-server-sdk, node-cron, pg, dotenv, cors; devDeps: typescript, @types/*
- [ ] 1.2 `backend/tsconfig.json` — target ES2022, outDir dist, strict mode
- [ ] 1.3 `backend/railway.toml` — NIXPACKS builder, `node dist/index.js` start command
- [ ] 1.4 `backend/src/db/migrate.sql` — full schema as specified (users, messages, nudges, events, game_state + seeds)
- [ ] 1.5 `backend/src/db.ts` — pg Pool using DATABASE_URL; `runMigrations()` that reads migrate.sql and executes it
- [ ] 1.6 `backend/src/middleware/auth.ts` — Bearer token → role ('admin'|'user'); attach to req.role; 401 if unrecognized
- [ ] 1.7 `backend/src/services/push.ts` — expo-server-sdk wrapper; `sendPush(token, title, body, data?)`
- [ ] 1.8 `backend/src/services/realtime.ts` — ws server; auth handshake on connect; `Map<string, WebSocket>`; `broadcast(userId, payload)`
- [ ] 1.9 `backend/src/services/cron.ts` — node-cron every minute; query untriggered scheduled events; broadcast + push + mark triggered
- [ ] 1.10 `backend/src/routes/nudge.ts` — POST /api/nudge (user only); insert nudge; push admin; broadcast admin
- [ ] 1.11 `backend/src/routes/messages.ts` — POST /api/message (admin only) + GET /api/messages (user only)
- [ ] 1.12 `backend/src/routes/events.ts` — POST /api/event (admin only); immediate or scheduled
- [ ] 1.13 `backend/src/routes/gameState.ts` — GET /api/game (any); POST /api/game (admin only); POST /api/users/:id/push-token (any)
- [ ] 1.14 `backend/src/index.ts` — Express app; run migrations on startup; attach WS server; mount routes; listen on PORT

---

## Phase 2 — Mobile

- [ ] 2.1 `mobile/package.json` — expo SDK 52, react-native, expo-notifications, @react-native-async-storage/async-storage, react-native-confetti-cannon, expo-constants
- [ ] 2.2 `mobile/tsconfig.json` — extends expo/tsconfig.base
- [ ] 2.3 `mobile/app.json` — Expo config (name: bunny-farm, slug from env, iOS bundle ID)
- [ ] 2.4 `mobile/app.config.ts` — dynamic config; expose EXPO_PUBLIC_* vars from process.env
- [ ] 2.5 `mobile/eas.json` — preview profile (internal distribution, iOS simulator + device)
- [ ] 2.6 `mobile/src/lib/api.ts` — typed fetch wrapper; reads base URL from env; attaches correct Bearer token per role; exports sendNudge, sendMessage, triggerEvent, getMessages, getGameState, registerPushToken
- [ ] 2.7 `mobile/src/context/RoleContext.tsx` — default role 'user'; attemptAdminUnlock(code); lockAdmin(); persists to AsyncStorage; compares against EXPO_PUBLIC_ADMIN_UNLOCK_CODE
- [ ] 2.8 `mobile/src/hooks/usePush.ts` — request permissions; get Expo push token; call registerPushToken with correct user id
- [ ] 2.9 `mobile/src/hooks/useWebSocket.ts` — connect to backend WS; send auth on open; dispatch events via callback/state; exponential backoff reconnect
- [ ] 2.10 `mobile/src/hooks/useGameState.ts` — fetch on mount; expose state + setter (calls POST /api/game)
- [ ] 2.11 `mobile/src/components/NudgeButton.tsx` — big button; calls sendNudge()
- [ ] 2.12 `mobile/src/components/MessageDisplay.tsx` — renders latest message content
- [ ] 2.13 `mobile/src/components/EventOverlay.tsx` — Modal; listens for 'event' WS messages; shows payload.message + confetti + dismiss button
- [ ] 2.14 `mobile/src/screens/UserScreen.tsx` — title with 5-tap gesture → admin unlock modal; MessageDisplay; NudgeButton
- [ ] 2.15 `mobile/src/screens/AdminScreen.tsx` — send message form; nudge-ack button; event trigger form (type + optional scheduled_at); sandbox/prod toggle; lock button
- [ ] 2.16 `mobile/src/App.tsx` — RoleProvider wrapper; usePush + useWebSocket on mount; route to UserScreen or AdminScreen; EventOverlay rendered on top

---

## Phase 3 — Infra (Terraform)

- [ ] 3.1 `infra/main.tf` — Railway provider config; two Railway services (backend-prod, backend-sandbox) within one project
- [ ] 3.2 `infra/variables.tf` — RAILWAY_TOKEN input variable
- [ ] 3.3 `infra/outputs.tf` — service IDs and domains
- [ ] 3.4 `infra/.terraform.lock.hcl` — note: generated on first `terraform init`, not committed
- [ ] 3.5 `infra/.gitignore` — ignore .terraform/ and *.tfstate

---

## Phase 4 — Docs

- [ ] 4.1 `README.md` — pre-requisites; first-time deploy steps; Railway env var checklist; admin unlock docs; how to trigger events

---

## Notes

### Infra approach (Terraform)
The Pulumi Railway provider does not exist in production form. Instead, use the community Terraform provider:
```hcl
terraform {
  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6"
    }
  }
}
```
Requires `terraform` CLI + Railway API token. Run `terraform init && terraform apply` from `infra/`.

### Railway env vars (set manually in dashboard after first deploy)
```
DATABASE_URL
SUPABASE_URL
SUPABASE_SECRET_KEY
ADMIN_SECRET
USER_SECRET
PORT  (Railway sets this automatically)
```

### WebSocket URL convention
- Prod:    wss://backend-prod.railway.app/ws
- Sandbox: wss://backend-sandbox.railway.app/ws
(These are placeholders — actual domains assigned by Railway after deploy)

### Push notification note
Expo's push service proxies to APNs — no Apple Developer account needed for Expo Go / preview builds. EAS production builds will need APNs credentials.
