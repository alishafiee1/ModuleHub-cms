#!/usr/bin/env bash
# purpose --- Full server deploy: git fetch/pull, opt sync, build, sudo restart, health ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "${SCRIPT_DIR}/lib/deploy-common.sh"
# shellcheck source=lib/git-wan-fetch.sh
source "${SCRIPT_DIR}/lib/git-wan-fetch.sh"
# shellcheck source=lib/sudo-exec.sh
source "${SCRIPT_DIR}/lib/sudo-exec.sh"

DEPLOY_FLAG_YES=false
DEPLOY_FLAG_FORCE_RESET=false
DEPLOY_FLAG_SKIP_WAN=false
DEPLOY_FLAG_DRY_RUN=false
DEPLOY_FLAG_NO_RESTART=false
DEPLOY_FLAG_FORCE_REBUILD=false
DEPLOY_SERVICE_NAME="${MODULEHUB_SERVICE:-modulehub-cms}"
DEPLOY_HEALTH_URL="${MODULEHUB_HEALTH_URL:-http://127.0.0.1:4000/health}"
DEPLOY_AUTH_URL="${MODULEHUB_AUTH_URL:-http://127.0.0.1:4000/api/auth/status}"
DEPLOY_PLAN_PULL=false
DEPLOY_PLAN_RESET=false
DEPLOY_PLAN_INSTALL=true
DEPLOY_PLAN_SKIP_ALL=false

usage() {
  cat <<'EOF'
Usage: bash scripts/deploy-full.sh [options]

Interactive full deploy on the server (run after git push from PC).

Options:
  --yes            Auto-confirm prompts
  --force-reset    Reset home clone to origin/main without asking (when local commits exist)
  --force-rebuild  Run install/build even when commit matches deployed marker
  --skip-wan       Set MODULEHUB_SKIP_WAN=1 for git/npm
  --no-restart     Build only — skip systemd restart
  --dry-run        Print planned steps only
  -h, --help       Show this help

Environment:
  MODULEHUB_SOURCE          Home git clone (default: ~/ModuleHub-cms)
  MODULEHUB_APP_DIR           Live app dir (default: /opt/modulehub-cms)
  MODULEHUB_GIT_BRANCH        Branch (default: main)
  MODULEHUB_WAN_INTERFACES    Comma-separated NIC list for git/npm fallback
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --yes) DEPLOY_FLAG_YES=true; shift ;;
      --force-reset) DEPLOY_FLAG_FORCE_RESET=true; shift ;;
      --force-rebuild) DEPLOY_FLAG_FORCE_REBUILD=true; shift ;;
      --skip-wan) DEPLOY_FLAG_SKIP_WAN=true; shift ;;
      --no-restart) DEPLOY_FLAG_NO_RESTART=true; shift ;;
      --dry-run) DEPLOY_FLAG_DRY_RUN=true; shift ;;
      -h|--help) usage; exit 0 ;;
      *) log_error "Unknown option: $1"; usage; exit 1 ;;
    esac
  done

  if [[ "${DEPLOY_FLAG_YES}" == true ]]; then
    DEPLOY_AUTO_YES=true
  fi
  if [[ "${DEPLOY_FLAG_DRY_RUN}" == true ]]; then
    DEPLOY_DRY_RUN=true
  fi
  if [[ "${DEPLOY_FLAG_SKIP_WAN}" == true ]]; then
    export MODULEHUB_SKIP_WAN=1
  fi
}

preflight_checks() {
  local home_clone opt_dir
  home_clone="$(resolve_home_clone)"
  opt_dir="$(resolve_opt_dir)"

  log_step "preflight checks"
  if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "${HOME}/.nvm/nvm.sh"
    nvm use 20 >/dev/null 2>&1 || nvm use 20
    log_ok "Node $(node -v 2>/dev/null || echo unknown)"
  else
    log_warn "nvm not found — ensure Node 20+ is in PATH"
  fi

  for cmd in git rsync curl python3; do
    if ! command -v "${cmd}" >/dev/null 2>&1; then
      log_error "missing required command: ${cmd}"
      exit 1
    fi
  done

  if [[ ! -d "${home_clone}" ]]; then
    log_error "home clone not found: ${home_clone}"
    exit 1
  fi
  if [[ ! -d "${home_clone}/.git" ]]; then
    log_error "not a git repo: ${home_clone}"
    exit 1
  fi
  if [[ ! -d "${opt_dir}" ]]; then
    log_warn "opt dir missing: ${opt_dir} (install-to-opt may create it with sudo)"
  fi

  strip_crlf_from_scripts "${home_clone}/scripts"
  log_ok "preflight passed — home=${home_clone} opt=${opt_dir}"
}

warn_dirty_worktree() {
  local home_clone="$1"
  local dirty_lines=""
  dirty_lines="$(git -C "${home_clone}" status --porcelain 2>/dev/null || true)"
  if [[ -n "${dirty_lines}" ]]; then
    log_warn "local changes in home clone (will be discarded before sync to origin):"
    printf '%s\n' "${dirty_lines}" | sed 's/^/[deploy-full]   /'
    log_warn "you usually do not edit code on the server — SCP/untracked files block git pull"
  fi
}

confirm_discard_local_changes() {
  local home_clone="$1"
  if ! has_dirty_worktree "${home_clone}"; then
    return 0
  fi
  if [[ "${DEPLOY_FLAG_FORCE_RESET}" == true || "${DEPLOY_AUTO_YES}" == true ]]; then
    log_info "auto-discard local changes in home clone"
    return 0
  fi
  confirm "Discard ALL local changes and untracked files in home clone?" false
}

sync_clone_to_origin() {
  local home_clone="$1"
  local branch="$2"
  local origin_ref="origin/${branch}"

  log_step "sync home clone to ${origin_ref} (reset --hard + clean)"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] git reset --hard ${origin_ref} && git clean -fd"
    return 0
  fi

  git -C "${home_clone}" reset --hard "${origin_ref}"
  git -C "${home_clone}" clean -fd
  log_ok "home clone matches ${origin_ref}"
}

compare_commits_and_plan() {
  local home_clone="$1"
  local branch origin_ref head_sha origin_sha deployed_sha
  branch="$(resolve_branch)"
  origin_ref="origin/${branch}"
  head_sha="$(git_full_sha "${home_clone}")"
  origin_sha="$(git -C "${home_clone}" rev-parse "${origin_ref}" 2>/dev/null || true)"
  deployed_sha="$(read_deployed_commit)"

  if [[ -z "${origin_sha}" ]]; then
    log_error "cannot resolve ${origin_ref} — fetch may have failed"
    exit 1
  fi

  if [[ -n "${deployed_sha}" ]]; then
    log_info "HEAD=${head_sha:0:12} origin/${branch}=${origin_sha:0:12} deployed=${deployed_sha:0:12}"
  else
    log_info "HEAD=${head_sha:0:12} origin/${branch}=${origin_sha:0:12} deployed=none"
  fi

  DEPLOY_PLAN_PULL=false
  DEPLOY_PLAN_RESET=false
  DEPLOY_PLAN_INSTALL=true
  DEPLOY_PLAN_SKIP_ALL=false

  if git -C "${home_clone}" merge-base --is-ancestor "${head_sha}" "${origin_sha}" 2>/dev/null \
    && [[ "${head_sha}" != "${origin_sha}" ]]; then
    log_info "remote is ahead — will sync to origin/${branch} (discard local if any)"
    DEPLOY_PLAN_PULL=true
  elif [[ "${head_sha}" == "${origin_sha}" ]]; then
    log_ok "home clone matches origin/${branch}"
    if [[ -n "${deployed_sha}" && "${deployed_sha}" == "${head_sha}" && "${DEPLOY_FLAG_FORCE_REBUILD}" != true ]]; then
      log_ok "deployed marker matches — no update needed"
      DEPLOY_PLAN_SKIP_ALL=true
      DEPLOY_PLAN_INSTALL=false
    elif [[ -n "${deployed_sha}" && "${deployed_sha}" != "${head_sha}" ]]; then
      log_warn "opt deploy marker differs — will sync/build without pull"
    fi
  elif git -C "${home_clone}" merge-base --is-ancestor "${origin_sha}" "${head_sha}" 2>/dev/null; then
    log_warn "server HEAD is AHEAD of origin/${branch} — local commits not on GitHub:"
    git -C "${home_clone}" log --oneline "${origin_ref}..HEAD" 2>/dev/null | sed 's/^/[deploy-full]   /' || true
    if [[ "${DEPLOY_FLAG_FORCE_RESET}" == true ]]; then
      DEPLOY_PLAN_RESET=true
    elif confirm "Reset home clone to origin/${branch}? (discards local commits)" true; then
      DEPLOY_PLAN_RESET=true
    else
      log_error "deploy aborted — resolve local commits first or use --force-reset"
      exit 1
    fi
  else
    log_warn "histories diverged — will attempt reset to origin/${branch}"
    if [[ "${DEPLOY_FLAG_FORCE_RESET}" == true ]] \
      || confirm "Reset to origin/${branch}? (discards local commits/changes)" true; then
      DEPLOY_PLAN_RESET=true
    else
      log_error "deploy aborted"
      exit 1
    fi
  fi
}

run_git_sync() {
  local home_clone="$1"
  local branch
  branch="$(resolve_branch)"

  log_step "git fetch with WAN fallback"
  git_fetch_with_wan_fallback "${home_clone}"

  log_step "compare commits and plan deploy"
  compare_commits_and_plan "${home_clone}"

  if [[ "${DEPLOY_PLAN_SKIP_ALL}" == true ]]; then
    return 0
  fi

  if [[ "${DEPLOY_PLAN_RESET}" == true || "${DEPLOY_PLAN_PULL}" == true ]]; then
    if ! confirm_discard_local_changes "${home_clone}"; then
      log_error "deploy aborted — clean home clone manually or use --yes / --force-reset"
      exit 1
    fi
    sync_clone_to_origin "${home_clone}" "${branch}"
  fi
}

run_install_and_build() {
  local home_clone opt_dir
  home_clone="$(resolve_home_clone)"
  opt_dir="$(resolve_opt_dir)"

  log_step "install-to-opt (rsync home → opt)"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] bash ${home_clone}/scripts/install-to-opt.sh"
  else
    MODULEHUB_SOURCE="${home_clone}" MODULEHUB_APP_DIR="${opt_dir}" \
      bash "${home_clone}/scripts/install-to-opt.sh"
  fi

  log_step "deploy-on-server build (skip pull/restart)"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] bash ${opt_dir}/scripts/deploy-on-server.sh --skip-pull --skip-restart"
    return 0
  fi

  local deploy_args=(--skip-pull --skip-restart)
  if [[ "${DEPLOY_FLAG_SKIP_WAN}" == true ]]; then
    deploy_args+=(--skip-wan)
  fi

  (
    cd "${opt_dir}"
    bash scripts/deploy-on-server.sh "${deploy_args[@]}"
  )
}

run_service_restart() {
  local home_clone opt_dir service_file
  home_clone="$(resolve_home_clone)"
  opt_dir="$(resolve_opt_dir)"
  service_file="${opt_dir}/config/systemd/${DEPLOY_SERVICE_NAME}.service"

  if [[ "${DEPLOY_FLAG_NO_RESTART}" == true ]]; then
    log_warn "skipping service restart (--no-restart)"
    return 0
  fi

  log_step "sudo: install unit and restart ${DEPLOY_SERVICE_NAME}"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] systemctl restart ${DEPLOY_SERVICE_NAME}"
    return 0
  fi

  detect_sudo_mode
  if [[ -f "${service_file}" ]]; then
    sudo_exec_run "cp '${service_file}' '/etc/systemd/system/${DEPLOY_SERVICE_NAME}.service' && systemctl daemon-reload && systemctl enable '${DEPLOY_SERVICE_NAME}'"
  fi
  sudo_exec_run "systemctl restart '${DEPLOY_SERVICE_NAME}'"
  sleep 2
}

run_optional_extras() {
  local home_clone
  home_clone="$(resolve_home_clone)"

  if confirm "Install/update logrotate config?" true; then
    log_step "optional: logrotate"
    if [[ "${DEPLOY_DRY_RUN}" != true ]]; then
      detect_sudo_mode 2>/dev/null || true
      if [[ "${SUDO_EXEC_MODE:-}" != "unknown" && "${SUDO_EXEC_MODE:-}" != "dry-run" ]]; then
        sudo_exec_run "cp '${home_clone}/config/logrotate/modulehub-cms' '/etc/logrotate.d/modulehub-cms' && chmod 644 '/etc/logrotate.d/modulehub-cms'"
        log_ok "logrotate config installed"
      else
        bash "${home_clone}/scripts/install-logrotate.sh" || log_warn "logrotate install failed"
      fi
    fi
  fi

  if confirm "Restart nginx?" true; then
    log_step "optional: nginx reload"
    if [[ "${DEPLOY_DRY_RUN}" != true ]]; then
      detect_sudo_mode
      sudo_exec_run "nginx -t && systemctl reload nginx"
    fi
  fi

  if confirm "Enable dev Super Admin (MODULEHUB_DEV)?" true; then
    log_step "optional: enable-dev-admin"
    if [[ "${DEPLOY_DRY_RUN}" != true ]]; then
      detect_sudo_mode
      sudo_exec_run "bash '${home_clone}/scripts/enable-dev-admin-on-server.sh'"
    fi
  fi
}

run_health_checks() {
  log_step "health and auth checks"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] bash scripts/run-checks.sh"
    return 0
  fi

  local home_clone
  home_clone="$(resolve_home_clone)"
  if MODULEHUB_CMS_URL="${DEPLOY_HEALTH_URL%/health}" bash "${home_clone}/scripts/run-checks.sh"; then
    log_ok "health checks OK"
  else
    log_error "health checks failed (run-checks.sh)"
    exit 1
  fi
}

write_summary() {
  local home_clone head_sha
  home_clone="$(resolve_home_clone)"
  head_sha="$(git_full_sha "${home_clone}")"

  if [[ "${DEPLOY_DRY_RUN}" != true && -n "${head_sha}" && "${DEPLOY_PLAN_SKIP_ALL}" != true ]]; then
    write_deployed_commit "${head_sha}"
  fi

  log_step "summary"
  log_ok "deploy complete"
  log_info "commit: $(git_short_sha "${home_clone}") ${head_sha}"
  log_info "site: ${MODULEHUB_PUBLIC_URL:-https://example.com} (hard refresh: Ctrl+Shift+R)"
}

main() {
  local home_clone
  parse_args "$@"
  home_clone="$(resolve_home_clone)"

  preflight_checks
  warn_dirty_worktree "${home_clone}"
  run_git_sync "${home_clone}"

  if [[ "${DEPLOY_PLAN_SKIP_ALL}" == true ]]; then
    log_ok "already up to date — nothing to deploy"
    exit 0
  fi

  if [[ "${DEPLOY_PLAN_INSTALL}" == true ]]; then
    run_install_and_build
    run_service_restart
    run_optional_extras
    run_health_checks
  fi

  write_summary
}

main "$@"
