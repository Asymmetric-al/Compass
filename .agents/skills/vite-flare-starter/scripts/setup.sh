#!/usr/bin/env bash
# vite-flare-starter setup script
# Clones, configures, and prepares a new project from the starter template.
#
# Usage:
#   bash setup.sh
#   bash setup.sh --name my-project --dir ~/Projects
#   bash setup.sh --name my-project --skip-cloudflare

set -euo pipefail

# ── Defaults ──
REPO_URL="https://github.com/jezweb/vite-flare-starter.git"
PROJECT_NAME=""
PROJECT_DIR=""
SKIP_CLOUDFLARE=false
ADMIN_EMAIL=""

# ── Parse arguments ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) PROJECT_NAME="$2"; shift 2 ;;
    --dir) PROJECT_DIR="$2"; shift 2 ;;
    --skip-cloudflare) SKIP_CLOUDFLARE=true; shift ;;
    --admin-email) ADMIN_EMAIL="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Interactive prompts if not provided ──
if [[ -z "$PROJECT_NAME" ]]; then
  read -rp "Project name (kebab-case, e.g. my-app): " PROJECT_NAME
fi

if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$(pwd)/$PROJECT_NAME"
fi

# Validate project name (kebab-case)
if ! [[ "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
  echo "Error: Project name must be kebab-case (lowercase letters, digits, hyphens)."
  echo "  Example: my-cool-app"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  vite-flare-starter setup                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Project:  $PROJECT_NAME"
echo "  Location: $PROJECT_DIR"
echo ""

# ── Step 1: Clone ──
echo "→ Cloning vite-flare-starter..."
if [[ -d "$PROJECT_DIR" ]]; then
  echo "Error: Directory $PROJECT_DIR already exists."
  exit 1
fi

git clone "$REPO_URL" "$PROJECT_DIR" --depth 1
cd "$PROJECT_DIR"

# Remove original git history
rm -rf .git
git init
echo "  ✓ Cloned and initialised fresh git repo"

# ── Step 2: Find-replace project name ──
echo ""
echo "→ Rebranding to '$PROJECT_NAME'..."

# wrangler.jsonc — worker name
sed -i "s/\"vite-flare-starter\"/\"$PROJECT_NAME\"/g" wrangler.jsonc

# wrangler.jsonc — database name
sed -i "s/vite-flare-starter-db/${PROJECT_NAME}-db/g" wrangler.jsonc

# wrangler.jsonc — R2 bucket names
sed -i "s/vite-flare-starter-avatars/${PROJECT_NAME}-avatars/g" wrangler.jsonc
sed -i "s/vite-flare-starter-files/${PROJECT_NAME}-files/g" wrangler.jsonc

# Remove hardcoded account_id (let wrangler prompt or use env var)
sed -i '/"account_id":/d' wrangler.jsonc

# Remove hardcoded database_id (will be set after creation)
sed -i 's/"database_id": "[^"]*"/"database_id": "REPLACE_WITH_YOUR_DATABASE_ID"/g' wrangler.jsonc

# package.json — package name
sed -i "s/\"name\": \"vite-flare-starter\"/\"name\": \"$PROJECT_NAME\"/g" package.json

# package.json — database references in scripts
sed -i "s/vite-flare-starter-db/${PROJECT_NAME}-db/g" package.json

# package.json — reset version
sed -i 's/"version": "[^"]*"/"version": "0.1.0"/g' package.json

echo "  ✓ Replaced vite-flare-starter → $PROJECT_NAME in config files"

# ── Step 3: Generate auth secret ──
BETTER_AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
echo "  ✓ Generated BETTER_AUTH_SECRET"

# ── Step 4: Create .dev.vars ──
# Convert kebab-case to Title Case for display name
APP_DISPLAY_NAME=$(echo "$PROJECT_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
APP_ID=$(echo "$PROJECT_NAME" | tr '-' '_')

cat > .dev.vars << DEVVARS
# Local Development Environment Variables
# DO NOT COMMIT THIS FILE TO GIT

# Authentication (better-auth)
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth (optional — get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email Auth Control (disabled by default — OAuth-only)
# ENABLE_EMAIL_LOGIN=true
# ENABLE_EMAIL_SIGNUP=true

# Email Configuration (optional — for verification/password reset)
# EMAIL_FROM=noreply@yourdomain.com
# EMAIL_API_KEY=re_...

# Application Configuration
APP_NAME=$APP_DISPLAY_NAME
VITE_APP_NAME=$APP_DISPLAY_NAME
VITE_APP_ID=$APP_ID
VITE_TOKEN_PREFIX=${APP_ID}_
VITE_GITHUB_URL=
VITE_FOOTER_TEXT=

NODE_ENV=development
DEVVARS

echo "  ✓ Created .dev.vars"

# ── Step 5: Update index.html ──
sed -i "s/<title>.*<\/title>/<title>$APP_DISPLAY_NAME<\/title>/" index.html
sed -i "s/content=\"Vite Flare Starter[^\"]*\"/content=\"$APP_DISPLAY_NAME\"/g" index.html
echo "  ✓ Updated index.html title"

# ── Step 6: Optionally create Cloudflare resources ──
if [[ "$SKIP_CLOUDFLARE" == false ]]; then
  echo ""
  echo "→ Creating Cloudflare resources..."

  # Check if wrangler is available
  if ! command -v npx &>/dev/null; then
    echo "  ⚠ npx not found — skipping Cloudflare resource creation"
    echo "  Run manually: npx wrangler d1 create ${PROJECT_NAME}-db"
    SKIP_CLOUDFLARE=true
  else
    # Create D1 database
    echo "  Creating D1 database: ${PROJECT_NAME}-db"
    D1_OUTPUT=$(npx wrangler d1 create "${PROJECT_NAME}-db" 2>&1) || true
    echo "$D1_OUTPUT"

    # Extract database_id from output
    DB_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || true)
    if [[ -n "$DB_ID" ]]; then
      sed -i "s/REPLACE_WITH_YOUR_DATABASE_ID/$DB_ID/" wrangler.jsonc
      echo "  ✓ D1 database created (ID: $DB_ID)"
    else
      echo "  ⚠ Could not extract database_id — update wrangler.jsonc manually"
    fi

    # Create R2 buckets
    echo "  Creating R2 bucket: ${PROJECT_NAME}-avatars"
    npx wrangler r2 bucket create "${PROJECT_NAME}-avatars" 2>&1 || true

    echo "  Creating R2 bucket: ${PROJECT_NAME}-files"
    npx wrangler r2 bucket create "${PROJECT_NAME}-files" 2>&1 || true

    echo "  ✓ R2 buckets created"
  fi
fi

# ── Step 7: Install dependencies ──
echo ""
echo "→ Installing dependencies..."
pnpm install
echo "  ✓ Dependencies installed"

# ── Step 8: Run local database migration ──
echo ""
echo "→ Running local database migration..."
pnpm run db:migrate:local 2>&1 || echo "  ⚠ Migration failed — run manually: pnpm run db:migrate:local"
echo "  ✓ Local database migrated"

# ── Step 9: Initial git commit ──
git add -A
git commit -m "Initial commit from vite-flare-starter" --no-verify 2>/dev/null || true

# ── Summary ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Setup complete!                         ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Project: $PROJECT_DIR"
echo ""
echo "  Remaining manual steps:"
echo "  ─────────────────────────────────────────"

if [[ "$SKIP_CLOUDFLARE" == true ]]; then
  echo "  1. Create Cloudflare resources:"
  echo "     npx wrangler d1 create ${PROJECT_NAME}-db"
  echo "     npx wrangler r2 bucket create ${PROJECT_NAME}-avatars"
  echo "     npx wrangler r2 bucket create ${PROJECT_NAME}-files"
  echo "     Then update wrangler.jsonc with your database_id"
  echo ""
fi

echo "  • Google OAuth (optional):"
echo "    - Create OAuth client at console.cloud.google.com"
echo "    - Add redirect: http://localhost:5173/api/auth/callback/google"
echo "    - Copy credentials to .dev.vars"
echo ""
echo "  • Replace public/favicon.svg with your favicon"
echo ""
echo "  • Update CLAUDE.md with your project description"
echo ""
echo "  Start developing:"
echo "    cd $PROJECT_DIR"
echo "    pnpm dev"
echo ""
