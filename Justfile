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

# Start production server (run `just build` first)
start:
    cd {{frontend}} && npm run start

# Run ESLint
lint:
    cd {{frontend}} && npm run lint

# Remove Next.js build output
clean:
    rm -rf {{frontend}}/.next

# Install deps and build
setup: install build

# ── Bootstrap (one-time project setup) ───────────────────────────────────────

# Create Next.js app in frontend/ (skip if folder already exists)
create-frontend:
    npx create-next-app@latest {{frontend}} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack

# Add PixiJS to the frontend
add-pixi:
    cd {{frontend}} && npm install pixi.js

# Full bootstrap: create app, install PixiJS, and build
bootstrap: create-frontend add-pixi build
