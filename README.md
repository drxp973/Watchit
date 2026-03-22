# Watchit

Watchit is a self-contained copy of the streaming web app: browse titles, pick a server, and play streams resolved through **Stremio-compatible addons** (such as **Torrentio**).

## Torrentio / plugins

1. Sign in and open **Plugins**.
2. Add a manifest URL, e.g. `https://torrentio.strem.fun/manifest.json`, and install.
3. Keep the addon **Active** (torrent-type). Inactive addons are not used for stream resolution.
4. Choose a title with a known `stremioStreamId` (IMDb-style id in the bundled catalog), select a server, and Watchit will request streams via the server proxy (`/api/addon-streams`) and play a magnet when the addon returns one.

Playback uses **WebTorrent** in the browser; some streams may be HTTP/HLS-only and are not supported yet.

## Run locally

**Prerequisites:** Node.js

1. `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` if you use `/api/recommendations`.
3. `npm run dev` (Express + Vite on port 3000)

## Google AI Studio and “desktop” install

See **[AI_STUDIO.md](./AI_STUDIO.md)** for how to import this folder into AI Studio Build, which secrets to set, and how **`PORT` / `npm start`** work. A true `.exe` is not generated here: after deploy, use the browser **Install** / PWA flow using [`public/manifest.json`](public/manifest.json).

## Original project

Your previous **StreamZ** tree under `streamz/` is unchanged. This folder is the **Watchit** variant.
