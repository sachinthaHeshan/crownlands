# Capacitor iOS and Android apps from the Next.js frontend

Date: 2026-08-28

## Goal

Wrap the existing Crownlands Next.js + PixiJS frontend as native iOS and Android apps using Capacitor, so the projects can be opened in Xcode and Android Studio and run on a simulator or device.

This is not a store-ready release. No signed IPA/AAB, App Store / Play Console setup, custom icons, or splash screens.

## Decisions

- Delivery: committed native projects (`frontend/ios/`, `frontend/android/`), not store binaries.
- Build: always static-export Next.js (`output: "export"`). One production artifact (`frontend/out/`) for Capacitor and for any static web host.
- Approach: Capacitor loads the bundled static files. No live-reload `server.url` in this pass. No Capacitor plugins.
- App name: `Crownlands`
- App ID: `com.crownlands.app`

## Architecture

Capacitor lives inside `frontend/` next to the Next.js app.

```
frontend/
  src/                  existing Next.js + Pixi game
  out/                  static export (already gitignored)
  capacitor.config.ts   appId, appName, webDir: "out"
  ios/                  Xcode project (committed)
  android/              Android Studio project (committed)
```

Flow:

1. `next build` writes `frontend/out/`.
2. `npx cap sync` copies `out/` into iOS and Android web assets.
3. `npx cap open ios` / `npx cap open android` opens the IDE to run on a simulator or device.

The game remains a client-only Pixi canvas. No API routes, SSR, or Node runtime in production.

## Next.js changes

In `frontend/next.config.ts`:

- `output: "export"`
- `images.unoptimized: true` (required for static export)
- `trailingSlash: true` (Capacitor file-based routing)
- `basePath` and `assetPrefix` only when `BASE_PATH` is set; empty for Capacitor native builds

`just dev` (`next dev`) is unchanged. `just start` must stop using `next start` (incompatible with static export) and instead run `npx --yes serve out` from `frontend/` after a build.

The Pixi game already prefixes assets with `NEXT_PUBLIC_BASE_PATH`. Native builds leave that empty so `/background/land.png` and `/items/...` resolve from the bundled origin. Geist via `next/font` is downloaded at build time and ships in `out/`, so the WebView does not need the network to load fonts.

## Capacitor config

`frontend/capacitor.config.ts`:

- `appId`: `com.crownlands.app`
- `appName`: `Crownlands`
- `webDir`: `out`

Dependencies (in `frontend/`), latest stable Capacitor at implementation time:

- `@capacitor/core`
- `@capacitor/cli` (dev)
- `@capacitor/ios`
- `@capacitor/android`

No plugins in this pass (`@capacitor/status-bar`, splash screen, safe area, etc. are out of scope).

## Commands

npm scripts in `frontend/package.json`:

- `build` — `next build` (unchanged)
- `cap:sync` — `next build && cap sync`
- `cap:ios` — `cap open ios`
- `cap:android` — `cap open android`

Justfile (repo root):

- `just cap-sync` — build + sync both native projects
- `just cap-ios` — open Xcode
- `just cap-android` — open Android Studio
- `just start` — serve `frontend/out/` statically
- `just dev` — unchanged (`next dev`)
- `just clean` — also remove `frontend/out/` (keep removing `frontend/.next`)

## Git

- Commit `frontend/ios/` and `frontend/android/` so the native projects are reproducible.
- Keep ignoring `frontend/out/` (already in `frontend/.gitignore`).
- Keep the gitignores that `cap add ios` and `cap add android` create (build output, `.gradle`, `xcuserdata`). Do not gitignore `frontend/ios/` or `frontend/android/` themselves.

## Mobile WebView constraints

- Runtime is WKWebView (iOS) and Android System WebView. Pixi already uses `preference: "webgl"`; no renderer change unless a device build fails.
- Full-screen canvas; no Capacitor routing, deep links, or native navigation.
- Notch / safe-area insets are ignored. The canvas already letterboxes the map.
- Touch: canvas pointer/drag should work. HTML5 drag-and-drop from the item panel may fail on mobile; that is out of scope unless it blocks running the game on a simulator.
- Play is offline: assets are bundled in `out/`.

## Out of scope

- Custom app icons and splash screens
- Status bar, safe-area, and keyboard plugins
- Capacitor live reload against `next dev`
- Signed IPA / AAB and store listings
- Changing Pixi input for mobile beyond what already works

## Verification

- `just build` succeeds and produces `frontend/out/index.html`.
- `just cap-sync` completes for iOS and Android without error.
- `just cap-ios` opens the Xcode project; `just cap-android` opens Android Studio.
- `just dev` still serves the game in the browser.
- `just start` serves the static export.
- If Xcode and/or Android SDK are installed on this machine, add the platforms during implementation and confirm the app launches in a simulator. If a toolchain is missing, the committed project must still be valid for opening later; do not fake a successful simulator run.

## Success criteria

A developer with Xcode can open `frontend/ios`, run Crownlands on an iOS simulator, and see the Pixi map. A developer with Android Studio can open `frontend/android` and do the same on an Android emulator or device.
