# Capacitor Native Apps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the Crownlands Next.js + Pixi frontend as Capacitor iOS and Android apps that open in Xcode / Android Studio and run on a simulator or device.

**Architecture:** Next.js always static-exports to `frontend/out/`. Capacitor (`webDir: "out"`) copies that folder into committed `frontend/ios/` and `frontend/android/` native projects. The Pixi game is unchanged; native apps are a WebView over the static export.

**Tech Stack:** Next.js 16.3.3 (static export), Capacitor latest stable, Justfile, Xcode, Android Studio.

## Global Constraints

- App ID: `com.crownlands.app`
- App name: `Crownlands`
- Capacitor `webDir`: `out`
- No Capacitor plugins
- No live-reload `server.url`
- No signed IPA/AAB, icons, or splash screens
- Keep `just dev` as `next dev`
- Do not commit unless the user asks
- If Xcode or Android SDK is missing, still add/commit valid platform projects; do not claim a simulator run succeeded

## File map

- Modify: `frontend/next.config.ts` — static export
- Modify: `frontend/package.json` — Capacitor deps and scripts; `start` serves `out/`
- Create: `frontend/capacitor.config.ts` — appId, appName, webDir
- Modify: `Justfile` — `start`, `clean`, `cap-sync`, `cap-ios`, `cap-android`
- Create via CLI: `frontend/ios/`, `frontend/android/`

---

### Task 1: Next.js static export

**Files:**
- Modify: `frontend/next.config.ts`
- Modify: `frontend/package.json` (`start` script)
- Modify: `Justfile` (`start`, `clean`)

**Interfaces:**
- Consumes: existing empty `nextConfig`
- Produces: `next build` writes `frontend/out/index.html`; `BASE_PATH` optional; `just start` serves `out/`

- [x] **Step 1: Write `frontend/next.config.ts`**

```ts
import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";
const assetPrefix = basePath ? `${basePath}/` : undefined;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix,
};

export default nextConfig;
```

- [ ] **Step 2: Change `start` in `frontend/package.json`**

Replace `"start": "next start"` with `"start": "npx --yes serve out"`.

- [ ] **Step 3: Update Justfile `start` comment and `clean`**

`start` stays `cd {{frontend}} && npm run start` but the comment must say it serves the static export (run `just build` first).

Replace `clean` with:

```
clean:
    rm -rf {{frontend}}/.next {{frontend}}/out
```

- [ ] **Step 4: Verify static export**

Run: `just build`

Expected: exit 0, file `frontend/out/index.html` exists.

---

### Task 2: Capacitor packages, config, and scripts

**Files:**
- Create: `frontend/capacitor.config.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `frontend/out/` from Task 1
- Produces: `cap` CLI available; config `{ appId: "com.crownlands.app", appName: "Crownlands", webDir: "out" }`

- [ ] **Step 1: Install Capacitor in `frontend/`**

Run:

```bash
cd frontend && npm install @capacitor/core @capacitor/ios @capacitor/android && npm install -D @capacitor/cli
```

Expected: packages in `dependencies` / `devDependencies`, no peer-dep errors that block the CLI.

- [ ] **Step 2: Write `frontend/capacitor.config.ts`**

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.crownlands.app",
  appName: "Crownlands",
  webDir: "out",
};

export default config;
```

Do not add a `plugins` key. Do not add `server.url`.

- [ ] **Step 3: Add npm scripts in `frontend/package.json`**

Keep `dev`, `build`, `start`, `lint`. Add:

```json
"cap:sync": "next build && cap sync",
"cap:ios": "cap open ios",
"cap:android": "cap open android"
```

- [ ] **Step 4: Confirm CLI sees the config**

Run: `cd frontend && npx cap ls`

Expected: command runs. Platforms may be "not installed" until Task 3.

---

### Task 3: Add iOS and Android platforms and sync

**Files:**
- Create: `frontend/ios/` (via `npx cap add ios`)
- Create: `frontend/android/` (via `npx cap add android`)

**Interfaces:**
- Consumes: `capacitor.config.ts` and `frontend/out/`
- Produces: native projects that contain the synced web assets

- [ ] **Step 1: Ensure `out/` exists**

Run: `just build` if `frontend/out/index.html` is missing.

- [ ] **Step 2: Add iOS**

Run: `cd frontend && npx cap add ios`

Expected: `frontend/ios/` exists. If Xcode is missing, capture the error, stop this step, and continue Android. Do not invent an ios folder.

- [ ] **Step 3: Add Android**

Run: `cd frontend && npx cap add android`

Expected: `frontend/android/` exists. If the Android SDK is missing, `cap add android` can still create the Gradle project — keep it. If the command fails entirely, capture the error and do not fake the folder.

- [ ] **Step 4: Sync**

Run: `cd frontend && npx cap sync`

Expected: copies `out/` into both platforms that exist. No plugin warnings that fail the command (plugins are not used).

- [ ] **Step 5: Add Justfile Capacitor recipes**

After the frontend `clean` recipe, add:

```
# Build static export and copy it into iOS/Android projects
cap-sync:
    cd {{frontend}} && npm run cap:sync

# Open the iOS project in Xcode
cap-ios:
    cd {{frontend}} && npm run cap:ios

# Open the Android project in Android Studio
cap-android:
    cd {{frontend}} && npm run cap:android
```

---

### Task 4: Verify

**Files:** none (commands only)

**Interfaces:**
- Consumes: all previous tasks
- Produces: evidence listed below

- [ ] **Step 1: `just build`**

Expected: `frontend/out/index.html` exists.

- [ ] **Step 2: `just cap-sync`**

Expected: exit 0 for every platform that was added.

- [ ] **Step 3: Confirm native projects**

- `frontend/ios/` exists if Step 2 of Task 3 succeeded
- `frontend/android/` exists if Step 3 of Task 3 succeeded
- Platform `.gitignore` files from Capacitor are left in place
- `frontend/out/` remains gitignored

- [ ] **Step 4: Toolchain check (do not fake success)**

- If `xcodebuild -version` works, the iOS project is openable with `just cap-ios`
- If `ANDROID_HOME` or `~/Library/Android/sdk` exists, the Android project is openable with `just cap-android`
- Do not run `cap open` during automated verification (it launches GUIs). Report that the developer should run `just cap-ios` / `just cap-android` locally.

- [ ] **Step 5: `just start` smoke**

`just start` uses `serve` and is long-running. Do not leave it running. Confirm `frontend/package.json` `"start"` is `npx --yes serve out`.

---

## Spec coverage

| Spec requirement | Task |
| --- | --- |
| `output: "export"`, unoptimized images, trailingSlash, BASE_PATH | 1 |
| `just start` serves `out/`; `just clean` removes `out/` | 1 |
| Capacitor config appId/appName/webDir, no plugins | 2 |
| npm `cap:sync` / `cap:ios` / `cap:android` | 2 |
| `ios/` and `android/` via cap add + sync | 3 |
| Justfile cap recipes | 3 |
| Verification commands | 4 |
| No icons/splash/signing/live-reload | omitted on purpose |
