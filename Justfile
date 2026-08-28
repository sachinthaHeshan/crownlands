# Crownlands — project commands
# Run `just` or `just --list` to see all recipes.

frontend := "frontend"

# Show available commands
default:
    @just --list

# ── Frontend (Next.js + PixiJS) ──────────────────────────────────────────────

# Install frontend dependencies
install:
    cd {{frontend}} && npm install

# Start Next.js dev server (http://localhost:3000)
dev:
    cd {{frontend}} && npm run dev

# Build frontend for production
build:
    cd {{frontend}} && npm run build

# Serve the static export (run `just build` first)
start:
    cd {{frontend}} && npm run start

# Run ESLint
lint:
    cd {{frontend}} && npm run lint

# Remove Next.js build output
clean:
    rm -rf {{frontend}}/.next {{frontend}}/out

# Install deps and build
setup: install build

# ── Capacitor (iOS / Android) ────────────────────────────────────────────────

# Build static export and copy it into iOS/Android projects
cap-sync:
    cd {{frontend}} && npm run cap:sync

# Open the iOS project in Xcode
cap-ios:
    cd {{frontend}} && npm run cap:ios

# Open the Android project in Android Studio
cap-android:
    cd {{frontend}} && npm run cap:android

# Build a sideloadable debug APK (crownlands-debug.apk in the project root)
cap-apk:
    cd {{frontend}} && npm run cap:sync
    cd {{frontend}}/android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
    cp {{frontend}}/android/app/build/outputs/apk/debug/app-debug.apk crownlands-debug.apk
    @echo "APK: {{justfile_directory()}}/crownlands-debug.apk"

# ── Bootstrap (one-time project setup) ───────────────────────────────────────

# Create Next.js app in frontend/ (skip if folder already exists)
create-frontend:
    npx create-next-app@latest {{frontend}} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack

# Add PixiJS to the frontend
add-pixi:
    cd {{frontend}} && npm install pixi.js

# Full bootstrap: create app, install PixiJS, and build
bootstrap: create-frontend add-pixi build
