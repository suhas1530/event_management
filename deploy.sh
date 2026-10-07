#!/usr/bin/env bash
#
# deploy.sh — Production deployment for avān. (Next.js + Express/Prisma + MongoDB)
#
# Target: single Linux VPS running PM2 behind Nginx.
# Run from the repository root.
#
#   ./deploy.sh                 # full deploy (install → migrate → build → reload)
#   ./deploy.sh --seed          # also load demo data
#   ./deploy.sh --skip-install  # skip dependency install (lockfile unchanged)
#   ./deploy.sh --skip-migrate  # skip `prisma db push`
#   ./deploy.sh --accept-data-loss   # allow destructive schema changes (MongoDB)
#   ./deploy.sh --restart       # full restart instead of zero-downtime reload
#   ./deploy.sh --dry-run       # print what would happen, change nothing
#   ./deploy.sh --help          # full usage text
#
# Safe to re-run. Every step is idempotent.

set -Eeuo pipefail

# When sourced (e.g. for testing) define functions but do not deploy.
AVAN_DEPLOY_SOURCED="${AVAN_DEPLOY_SOURCED:-0}"

# ─── Config ─────────────────────────────────────────────────────────────────

readonly APP_NAME="avan"
readonly API_DIR="backend"
readonly WEB_DIR="."
readonly ECOSYSTEM="ecosystem.config.js"
readonly API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:5000/health}"
readonly WEB_HEALTH_URL="${WEB_HEALTH_URL:-http://127.0.0.1:3000}"
readonly HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
readonly HEALTH_DELAY="${HEALTH_DELAY:-2}"
readonly META_FILE=".deploy-meta"

# ─── Output helpers ─────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_BOLD=""
fi

step()  { printf '\n%s▸ %s%s\n' "$C_BLUE$C_BOLD" "$*" "$C_RESET"; }
info()  { printf '  %s\n' "$*"; }
ok()    { printf '  %s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn()  { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
die()   { printf '\n%s✖ %s%s\n' "$C_RED$C_BOLD" "$*" "$C_RESET" >&2; exit 1; }

on_error() {
  local code=$? line=${1:-?}
  printf '\n%s✖ Failed at line %s (exit %s)%s\n' "$C_RED$C_BOLD" "$line" "$code" "$C_RESET" >&2
  printf '  Rollback:  git -C . checkout %s && ./deploy.sh --skip-install\n' "$(git rev-parse --short HEAD 2>/dev/null || echo HEAD)" >&2 || true
  printf '  Logs:      pm2 logs --lines 100\n' >&2
  exit "$code"
}
trap 'on_error $LINENO' ERR

usage() {
  cat <<'USAGE'
Usage: ./deploy.sh [options]

  (no options)              Full deploy: install → prisma db push → build → reload
  --seed                    Also load demo data (npx tsx prisma/seed.ts)
  --skip-install            Skip dependency installation
  --skip-migrate            Skip `prisma db push`
  --accept-data-loss        Allow destructive MongoDB schema changes
  --restart                 Full restart instead of zero-downtime reload
  --dry-run                 Print what would happen, change nothing
  -h, --help                Show this help

Environment overrides:
  API_HEALTH_URL   default http://127.0.0.1:5000/health
  WEB_HEALTH_URL   default http://127.0.0.1:3000
  HEALTH_RETRIES   default 15
  HEALTH_DELAY     default 2 (seconds)

Every step is idempotent — safe to re-run.
USAGE
  exit 0
}

# Reads KEY=value from a dotenv file without sourcing it (sourcing would
# execute arbitrary content). Strips surrounding whitespace and quotes.
# Usage: read_env_value <file> <KEY>   → prints value, non-zero if absent.
read_env_value() {
  local file="$1" key="$2" line value
  [[ -f "$file" ]] || return 1
  # dotenv tolerates whitespace around '=' , so match that here too.
  line="$(grep -m1 -E "^[[:space:]]*${key}[[:space:]]*=" "$file" 2>/dev/null)" || return 1
  # Strip a UTF-8 BOM — it prefixes the first key if the file was edited on
  # Windows and would otherwise make that key unparseable.
  line="${line#$'\xEF\xBB\xBF'}"
  value="${line#*=}"
  # trim leading whitespace
  value="${value#"${value%%[![:space:]]*}"}"
  # trim trailing whitespace
  value="${value%"${value##*[![:space:]]}"}"
  # strip one layer of matching quotes
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

# ─── Arguments ──────────────────────────────────────────────────────────────

DO_SEED=false
SKIP_INSTALL=false
SKIP_MIGRATE=false
ACCEPT_DATA_LOSS=false
DO_RESTART=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)               DO_SEED=true ;;
    --skip-install)       SKIP_INSTALL=true ;;
    --skip-migrate)       SKIP_MIGRATE=true ;;
    --accept-data-loss)   ACCEPT_DATA_LOSS=true; SKIP_MIGRATE=false ;;
    --restart)            DO_RESTART=true ;;
    --dry-run)            DRY_RUN=true ;;
    -h|--help)            usage ;;
    *)                    die "Unknown option: $1  (try --help)" ;;
  esac
  shift
done

run() {
  if [[ "$DRY_RUN" == true ]]; then
    printf '  [dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

# ─── Preflight ──────────────────────────────────────────────────────────────

preflight() {
  step "Preflight checks"

  [[ "$(uname -s)" == "Linux" ]] || warn "Not Linux (detected $(uname -s)) — PM2 targets a Linux VPS."

  command -v node >/dev/null 2>&1 || die "node not found. Install Node.js 20.9+ (https://nodejs.org)."
  command -v npm  >/dev/null 2>&1 || die "npm not found."

  local node_major
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( node_major < 20 )); then
    die "Node $(node -v) is too old. Next.js 16 requires Node >= 20.9.0."
  fi
  ok "Node $(node -v)"

  command -v pnpm >/dev/null 2>&1 || die "pnpm not found. Run: corepack enable && corepack prepare pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]") --activate"
  ok "pnpm $(pnpm -v)"

  command -v pm2 >/dev/null 2>&1 || die "pm2 not found. Run: npm i -g pm2"
  ok "pm2 $(pm2 -v)"

  command -v curl >/dev/null 2>&1 || die "curl not found."
  command -v git  >/dev/null 2>&1 || warn "git not found — rollback hint in error handler will be unavailable."

  [[ -f "$ECOSYSTEM" ]] || die "$ECOSYSTEM not found in $(pwd). See README.PM2.md step 8."
  ok "ecosystem config present"

  # The API compiles to dist/ via `tsc`; the seed script is excluded from that
  # build and runs through tsx, so backend dev deps must remain installed.
  [[ -f "$API_DIR/package-lock.json" ]] || warn "$API_DIR/package-lock.json missing — will fall back to 'npm install'."
  ok "layout verified"

  validate_env
}

validate_env() {
  step "Validating environment"

  # Backend env
  if [[ -f "$API_DIR/.env" ]]; then
    ok "$API_DIR/.env present"
    local jwt_secret="" jwt_refresh="" node_env=""
    # Read without sourcing the file (avoids executing arbitrary content).
    jwt_secret=$(read_env_value "$API_DIR/.env" "JWT_SECRET" || true)
    jwt_refresh=$(read_env_value "$API_DIR/.env" "JWT_REFRESH_SECRET" || true)
    node_env=$(read_env_value "$API_DIR/.env" "NODE_ENV" || true)

    if [[ -z "$jwt_secret" ]]; then
      die "JWT_SECRET is not set in $API_DIR/.env — the server would fall back to an insecure default (backend/src/config/index.ts:14)."
    fi
    if [[ "$jwt_secret" == *"change-in-production"* ]]; then
      die "JWT_SECRET is still the placeholder value. Generate one with: openssl rand -hex 32"
    fi
    if (( ${#jwt_secret} < 32 )); then
      warn "JWT_SECRET is only ${#jwt_secret} chars — use at least 32."
    fi
    if [[ -z "$jwt_refresh" || "$jwt_refresh" == *"change-in-production"* ]]; then
      die "JWT_REFRESH_SECRET is unset or still the placeholder. Generate one with: openssl rand -hex 32"
    fi
    ok "JWT secrets set"

    if ! grep -qE '^DATABASE_URL=.+' "$API_DIR/.env"; then
      die "DATABASE_URL is not set in $API_DIR/.env"
    fi
    ok "DATABASE_URL set"

    if grep -qE '^CORS_ORIGIN=(http://)?(localhost|127\.0\.0\.1)' "$API_DIR/.env"; then
      warn "CORS_ORIGIN points at localhost — browser requests from the real domain will be blocked."
    fi
    if [[ "$node_env" != "production" ]]; then
      warn "NODE_ENV=${node_env:-<unset>} in $API_DIR/.env (expected 'production')."
    fi
  else
    die "$API_DIR/.env not found. Copy $API_DIR/.env.example and fill it in (README.PM2.md step 3.1)."
  fi

  # Frontend env — NEXT_PUBLIC_* is inlined at build time, so it must exist NOW.
  local frontend_env=""
  for candidate in .env.production.local .env.local .env.production; do
    [[ -f "$candidate" ]] && frontend_env="$candidate" && break
  done

  if [[ -z "$frontend_env" ]]; then
    die "No frontend env file found (.env.production.local). NEXT_PUBLIC_* must be set before 'next build' (README.PM2.md step 3.2)."
  fi
  ok "$frontend_env present"

  if ! grep -qE '^NEXT_PUBLIC_API_URL=.+' "$frontend_env"; then
    die "NEXT_PUBLIC_API_URL is not set in $frontend_env"
  fi
  local api_url
  api_url=$(read_env_value "$frontend_env" "NEXT_PUBLIC_API_URL" || true)
  if [[ "$api_url" == *"localhost"* || "$api_url" == *"127.0.0.1"* ]]; then
    die "NEXT_PUBLIC_API_URL points at localhost ('$api_url') — it gets baked into the client bundle."
  fi
  ok "NEXT_PUBLIC_API_URL = $api_url"

  # Non-blocking advisory — the limit lives in compiled TS.
  if grep -qE 'maxRequests:\s*100' "$API_DIR/src/config/index.ts" 2>/dev/null; then
    warn "API rate limit is still maxRequests: 100 per 15 min (backend/src/config/index.ts:26) — will throttle real users."
  fi
}

# ─── Steps ──────────────────────────────────────────────────────────────────

install_deps() {
  step "Installing dependencies"

  if [[ "$SKIP_INSTALL" == true ]]; then
    info "skipped (--skip-install)"
    return
  fi

  info "backend — npm ci"
  if [[ -f "$API_DIR/package-lock.json" ]]; then
    run bash -c "cd '$API_DIR' && npm ci"
  else
    warn "no lockfile — using npm install"
    run bash -c "cd '$API_DIR' && npm install"
  fi

  info "frontend — pnpm install --frozen-lockfile"
  run bash -c "cd '$WEB_DIR' && pnpm install --frozen-lockfile"
}

migrate_db() {
  step "Database (prisma db push)"

  if [[ "$SKIP_MIGRATE" == true ]]; then
    info "skipped (--skip-migrate)"
    return
  fi

  # MongoDB has no migration engine — `prisma migrate dev` errors out.
  # `db push` syncs the schema directly and is safe to re-run.
  local args=(db push --skip-generate)
  if [[ "$ACCEPT_DATA_LOSS" == true ]]; then
    warn "--accept-data-loss: destructive schema changes will be applied"
    args+=(--accept-data-loss)
  fi

  run bash -c "cd '$API_DIR' && npx prisma ${args[*]}"
  ok "schema synced"

  if [[ "$DO_SEED" == true ]]; then
    warn "seeding demo data (tsx is a devDependency and must still be installed)"
    run bash -c "cd '$API_DIR' && npx tsx prisma/seed.ts"
    ok "seed complete"
  fi
}

generate_prisma() {
  step "Generating Prisma client"
  # Explicit because @prisma/client's install hook no-ops when dev deps are pruned.
  run bash -c "cd '$API_DIR' && npx prisma generate"
}

build() {
  step "Building"

  info "backend — tsc → dist/"
  run bash -c "cd '$API_DIR' && npm run build"
  [[ -f "$API_DIR/dist/index.js" ]] || die "$API_DIR/dist/index.js missing after build"
  ok "backend built"

  info "frontend — next build (inlines NEXT_PUBLIC_*)"
  run bash -c "cd '$WEB_DIR' && pnpm build"
  ok "frontend built"
}

reload() {
  step "Reloading PM2"

  mkdir -p logs

  # `reload` restarts instances one at a time (zero downtime).
  # kill_timeout in ecosystem.config.js gives the API time to drain Prisma.
  if [[ "$DO_RESTART" == true ]]; then
    run pm2 restart "$ECOSYSTEM" --update-env
  else
    run pm2 reload "$ECOSYSTEM" --update-env
  fi

  run pm2 save
  run pm2 status
}

health_check() {
  step "Health checks"
  ok "API — $API_HEALTH_URL"
  ok "Web — $WEB_HEALTH_URL"

  local api_ok=false web_ok=false

  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    curl -fsS --max-time 5 "$API_HEALTH_URL" >/dev/null 2>&1 && api_ok=true
    curl -fsS --max-time 5 "$WEB_HEALTH_URL" >/dev/null 2>&1 && web_ok=true
    if [[ "$api_ok" == true && "$web_ok" == true ]]; then break; fi
    sleep "$HEALTH_DELAY"
  done

  if [[ "$api_ok" != true ]]; then
    printf '\n%s✖ API health check failed after %s attempts%s\n' "$C_RED$C_BOLD" "$HEALTH_RETRIES" "$C_RESET" >&2
    run bash -c "pm2 logs avan-api --lines 60 --nostream" || true
    return 1
  fi

  if [[ "$web_ok" != true ]]; then
    printf '\n%s✖ Web health check failed after %s attempts%s\n' "$C_RED$C_BOLD" "$HEALTH_RETRIES" "$C_RESET" >&2
    run bash -c "pm2 logs avan-web --lines 60 --nostream" || true
    return 1
  fi

  ok "all services healthy"
}

write_meta() {
  local sha="unknown" branch="unknown"
  if command -v git >/dev/null 2>&1; then
    sha=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
  fi
  printf 'sha=%s\nbranch=%s\ndeployed_at=%s\nnode=%s\n' \
    "$sha" "$branch" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(node -v)" > "$META_FILE"
  ok "wrote $META_FILE"
}

print_summary() {
  step "Done"
  cat <<EOF
  Frontend  $(pm2 jlist 2>/dev/null | grep -c avan-web || echo '?') process(es) → http://127.0.0.1:3000
  API       $(pm2 jlist 2>/dev/null | grep -c avan-api || echo '?') process(es) → http://127.0.0.1:5000
  Logs      pm2 logs
  Monitor   pm2 monit

  If Nginx is in front, verify the public URLs too:
    curl -sI https://\$(hostname) | head -1
    curl -s  https://api.\$(hostname)/health
EOF
}

# ─── Main ───────────────────────────────────────────────────────────────────

main() {
  printf '\n%s%s — deployment%s\n' "$C_BOLD" "$APP_NAME" "$C_RESET"
  [[ -f "$META_FILE" ]] && info "previous: $(tr '\n' ' ' < "$META_FILE")"
  [[ "$DRY_RUN" == true ]] && warn "DRY RUN — no changes will be made"
  info "cwd: $(pwd)"

  preflight
  install_deps
  migrate_db
  generate_prisma
  build
  reload
  health_check
  write_meta
  print_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
else
  AVAN_DEPLOY_SOURCED=1
fi