#!/usr/bin/env bash
# purpose --- Plain git fetch/pull for deploy (no route/metric toggling) ------
set -euo pipefail

GIT_FETCH_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-common.sh
source "${GIT_FETCH_LIB_DIR}/deploy-common.sh"

log_git_auth_failure_hint() {
  local home_clone="$1"
  local remote_url=""
  remote_url="$(git -C "${home_clone}" remote get-url origin 2>/dev/null || echo unknown)"
  log_error "Git auth failed — one-time setup required:"
  log_error "  1) SSH deploy key: docs/change/1405-03-23-server-code-update-standard/design.md (section 4)"
  log_error "  2) Or HTTPS + PAT in git credential helper"
  log_error "  Current remote: ${remote_url}"
}

git_stderr_indicates_auth_failure() {
  local err_file="$1"
  grep -qiE 'authentication failed|could not read Username|Permission denied \(publickey\)|invalid username or password|terminal prompts disabled' \
    "${err_file}" 2>/dev/null
}

run_git_direct_with_auth_hint() {
  local home_clone="$1"
  shift
  local err_file exit_code
  err_file="$(mktemp)"
  if git -C "${home_clone}" "$@" 2>"${err_file}"; then
    rm -f "${err_file}"
    return 0
  fi
  exit_code=$?
  if git_stderr_indicates_auth_failure "${err_file}"; then
    log_git_auth_failure_hint "${home_clone}"
  fi
  cat "${err_file}" >&2
  rm -f "${err_file}"
  return "${exit_code}"
}

git_fetch_origin() {
  local home_clone="$1"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] git -C ${home_clone} fetch origin"
    return 0
  fi
  log_step "git fetch origin"
  run_git_direct_with_auth_hint "${home_clone}" fetch origin
}

git_pull_origin_ff_only() {
  local home_clone="$1"
  local branch
  branch="$(resolve_branch)"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] git -C ${home_clone} pull --ff-only origin ${branch}"
    return 0
  fi
  log_step "git pull --ff-only origin ${branch}"
  run_git_direct_with_auth_hint "${home_clone}" pull --ff-only origin "${branch}"
}
