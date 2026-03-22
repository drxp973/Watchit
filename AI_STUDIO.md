# Using Watchit with Google AI Studio (Build / deploy / “desktop” install)

Google AI Studio **Build mode** runs full-stack Node apps (React + Vite + a server). Watchit matches that shape: [`server.ts`](server.ts) (Express + Vite middleware or static `dist/`) and the React app under [`src/`](src/).

There is **no separate “paste one file”** flow: you bring the **whole project** (zip or GitHub) into Build mode or continue editing there. This doc lists what must be true so the runtime and **Install app** (PWA) behavior work.

## 1. Import the project

1. Zip the **Watchit** folder (include `package.json`, `server.ts`, `vite.config.ts`, `src/`, `public/`, `index.html`, `metadata.json`, `firebase-applet-config.json`, etc.).
2. In [AI Studio Build](https://aistudio.google.com/apps), use your usual **import / upload / GitHub** workflow (the UI changes over time; look for importing an existing app or repository).
3. Let the environment run **`npm install`**. The app expects **Node 18+** (`engines` in `package.json`).

## 2. Secrets (environment variables)

In **Settings → Secrets** (or your host’s env UI), define at least:

| Name | Purpose |
|------|--------|
| `GEMINI_API_KEY` | Server route `/api/recommendations` (Gemini). Optional if you do not use that API. |
| `APP_URL` | Optional; noted in [`.env.example`](.env.example) for hosted URLs / OAuth. |

Firebase keys for this template live in [`firebase-applet-config.json`](firebase-applet-config.json) (AI Studio–style applet). Replace with your project if you remix the app.

## 3. Commands the host should use

| Phase | Command |
|-------|---------|
| Development | `npm run dev` — Express + Vite middleware (same as local). |
| Production build | `npm run build` — outputs `dist/`. |
| Production serve | Set `NODE_ENV=production`, then `npm start` — serves `dist/` and API routes. |

**Port:** The server reads **`process.env.PORT`** (Cloud Run / AI Studio set this). If unset, it falls back to **3000**.

**Start script:** `npm start` runs **`tsx server.ts`** so TypeScript runs without a separate compile step.

## 4. “Desktop app” = install the **hosted** PWA

AI Studio does not turn your repo into an Electron `.exe` automatically. After you **deploy** (e.g. Cloud Run from Build mode) or open the hosted URL:

- In **Chrome or Edge**: use **Install app** / **Create shortcut** / **Install Watchit** so it opens in its own window like a desktop app.
- [`public/manifest.json`](public/manifest.json) and the `<link rel="manifest">` in [`index.html`](index.html) support **standalone** display. Add **192×192** and **512×512** icons under `public/icons/` later if you want a richer install prompt.

## 5. Compatibility checklist

- [x] Full-stack entry: `server.ts` + Vite + React  
- [x] `metadata.json` present; `requestFramePermissions` empty (no camera/mic/geo unless you add features)  
- [x] `PORT` from environment  
- [x] `npm start` runs the TS server via `tsx`  
- [x] Web app shell + PWA manifest for install-after-deploy  

If something fails in the container, ask the Build agent to **fix build/start** or align with the [full-stack AI Studio docs](https://ai.google.dev/gemini-api/docs/aistudio-fullstack).
