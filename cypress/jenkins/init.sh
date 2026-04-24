#!/usr/bin/env bash
#
# Thin wrapper: clones qa-infra-automation, builds the runner image,
# generates vars.yaml from Jenkins environment, runs the playbook in a container.
#
# No tool installation needed — everything is inside the container image.
#
set -euo pipefail
trap 'echo "FAILED at line $LINENO: $BASH_COMMAND (exit $?)"' ERR

# --- Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JENKINS_WORKSPACE="${WORKSPACE:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"

QA_INFRA_REPO="${QA_INFRA_REPO:-https://github.com/rancher/qa-infra-automation.git}"
QA_INFRA_BRANCH="${QA_INFRA_BRANCH:-main}"
QA_INFRA_DIR="${JENKINS_WORKSPACE}/qa-infra-automation"
PLAYBOOK_DIR="${QA_INFRA_DIR}/ansible/testing/dashboard-e2e"
RUNNER_IMAGE="dashboard-e2e-runner:${EXECUTOR_NUMBER:-0}"
LOCK_FD=""

# Ansible verbosity: 0=normal, 1=-v, 2=-vv, etc.
ANSIBLE_VERBOSITY="${ANSIBLE_VERBOSITY:-0}"

# Clone qa-infra-automation
clone_qa_infra() {
  if [[ -d "${QA_INFRA_DIR}/.git" ]]; then
    echo "[init] qa-infra-automation already present, updating..."
    cd "${QA_INFRA_DIR}"
    if ! git fetch origin || ! git checkout -qf "${QA_INFRA_BRANCH}" || ! git reset --hard "origin/${QA_INFRA_BRANCH}"; then
      echo "[init] ERROR: Failed to update qa-infra-automation to branch '${QA_INFRA_BRANCH}'"
      exit 1
    fi
  else
    echo "[init] Cloning qa-infra-automation (${QA_INFRA_BRANCH})..."
    git clone -b "${QA_INFRA_BRANCH}" "${QA_INFRA_REPO}" "${QA_INFRA_DIR}"
  fi
  echo "[init] qa-infra-automation (${QA_INFRA_BRANCH}) at $(git -C "${QA_INFRA_DIR}" rev-parse --short HEAD)"
}

# Build the runner image from Dockerfile.quickstart
build_runner_image() {
  echo "[init] Building ${RUNNER_IMAGE} image..."
  docker build -q --no-cache -f "${PLAYBOOK_DIR}/Dockerfile.quickstart" \
    -t "${RUNNER_IMAGE}" "${PLAYBOOK_DIR}"
}

# Generate vars.yaml from Jenkins environment variables
generate_vars() {
  local vars_file="${PLAYBOOK_DIR}/vars.yaml"

  if [[ -z "${VARS_YAML_CONFIG:-}" ]]; then
    echo "[init] ERROR: VARS_YAML_CONFIG is required — configure it in the Jenkins job"
    exit 1
  fi

  touch "${vars_file}"
  chmod 600 "${vars_file}"
  # Strip Windows carriage returns that corrupt YAML parsing
  printf '%s\n' "${VARS_YAML_CONFIG}" | tr -d '\r' > "${vars_file}"

  # The playbook reads AWS infra values via env lookups; export them from the config
  # so the playbook's env-based vars pick them up.
  for var in aws_ami aws_route53_zone aws_vpc aws_subnet aws_security_group; do
    local val
    val=$(grep "^${var}:" "${vars_file}" | head -1 | sed "s/^${var}:[[:space:]]*//" | sed 's/[[:space:]]*#.*//' | tr -d "\"'")
    if [[ -n "${val}" ]]; then
      declare -x "$(echo "${var}" | tr '[:lower:]' '[:upper:]')=${val}"
    fi
  done

  # Inject credentials from Jenkins env that the user shouldn't put in the text area
  yaml_escape() { echo "${1//\'/\'\'}"; }
  {
    echo ""
    echo "# Credentials injected from Jenkins environment"
    [[ -n "${QASE_AUTOMATION_TOKEN:-}" ]]    && echo "qase_token: '$(yaml_escape "${QASE_AUTOMATION_TOKEN}")'"
    [[ -n "${PERCY_TOKEN:-}" ]]              && echo "percy_token: '$(yaml_escape "${PERCY_TOKEN}")'"
    [[ -n "${AZURE_CLIENT_ID:-}" ]]          && echo "azure_client_id: '$(yaml_escape "${AZURE_CLIENT_ID}")'"
    [[ -n "${AZURE_CLIENT_SECRET:-}" ]]      && echo "azure_client_secret: '$(yaml_escape "${AZURE_CLIENT_SECRET}")'"
    [[ -n "${AZURE_AKS_SUBSCRIPTION_ID:-}" ]] && echo "azure_subscription_id: '$(yaml_escape "${AZURE_AKS_SUBSCRIPTION_ID}")'"
    [[ -n "${GKE_SERVICE_ACCOUNT:-}" ]]      && echo "gke_service_account: '$(yaml_escape "${GKE_SERVICE_ACCOUNT}")'"
  } >> "${vars_file}"

  export PREFIX="${PREFIX:-$(od -An -tx1 -N4 /dev/urandom | tr -d ' \n')}"
  echo "[init] prefix=${PREFIX}"
  echo "[init] Wrote vars.yaml from VARS_YAML_CONFIG"
}

yaml_get_scalar() {
  local key="${1}"
  local file="${2:-${PLAYBOOK_DIR}/vars.yaml}"
  local line value

  line=$(grep -E "^${key}:" "${file}" 2>/dev/null | head -1 || true)
  value="${line#${key}:}"
  value=$(echo "${value}" | sed 's/[[:space:]]*#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  printf '%s' "${value}"
}

is_valid_ipv4() {
  local ip="${1}"
  local o1 o2 o3 o4

  [[ "${ip}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1
  IFS='.' read -r o1 o2 o3 o4 <<< "${ip}"
  for octet in "${o1}" "${o2}" "${o3}" "${o4}"; do
    ((octet >= 0 && octet <= 255)) || return 1
  done
}

is_valid_fqdn() {
  local host="${1}"
  [[ ${#host} -le 253 ]] || return 1
  [[ "${host}" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$ ]]
}

validate_existing_host() {
  local host="${1}"

  if is_valid_ipv4 "${host}" || is_valid_fqdn "${host}"; then
    return 0
  fi

  echo "[init] ERROR: rancher_host must be an IPv4 address or FQDN (no scheme). Got: '${host}'"
  exit 1
}

sanitize_name_component() {
  echo "${1}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_.-]/-/g'
}

resolve_rancher_host() {
  if [[ -n "${RANCHER_HOST:-}" ]]; then
    printf '%s' "${RANCHER_HOST}"
    return 0
  fi

  if [[ -f "${PLAYBOOK_DIR}/.env" ]]; then
    local base_url host
    base_url=$(grep '^TEST_BASE_URL=' "${PLAYBOOK_DIR}/.env" 2>/dev/null | head -1 | cut -d'=' -f2- || true)
    host="${base_url#https://}"
    host="${host#http://}"
    host="${host%%/*}"
    if [[ -n "${host}" ]]; then
      printf '%s' "${host}"
      return 0
    fi
  fi

  printf '%s' "dashboard-e2e"
}

build_cypress_container_name() {
  local host exec_tag prefix_tag
  host=$(sanitize_name_component "$(resolve_rancher_host)")
  exec_tag=$(sanitize_name_component "${EXECUTOR_NUMBER:-0}")
  prefix_tag=$(sanitize_name_component "${PREFIX:-local}")
  printf '%s' "cypress-${exec_tag}-${prefix_tag}-${host}"
}

acquire_existing_host_lock() {
  local host="${1}"
  local safe_host lock_file

  if ! command -v flock >/dev/null 2>&1; then
    echo "[init] ERROR: flock is required for job_type=existing host locking"
    exit 1
  fi

  safe_host=$(sanitize_name_component "${host}")
  lock_file="/tmp/ui-qa-existing-${safe_host}.lock"
  exec {LOCK_FD}> "${lock_file}"

  if ! flock -n "${LOCK_FD}"; then
    echo "[init] ERROR: rancher_host '${host}' is already in use by another run."
    echo "[init] Lock file: ${lock_file}"
    exit 1
  fi

  echo "[init] Acquired existing-host lock for ${host}"
}

# Run the playbook inside the runner container
run_container() {
  local tags="${1:-}"
  local skip_tags="${2:-}"

  local verbose_flags=()
  if [[ "${ANSIBLE_VERBOSITY}" -gt 0 ]]; then
    verbose_flags=("-$(printf 'v%.0s' $(seq 1 "${ANSIBLE_VERBOSITY}"))")
  fi

  local tag_args=()
  if [[ -n "${tags}" ]]; then
    tag_args=(--tags "${tags}")
  fi

  local skip_args=()
  if [[ -n "${skip_tags}" ]]; then
    skip_args=(--skip-tags "${skip_tags}")
  fi

  local vars_file="${PLAYBOOK_DIR}/vars.yaml"
  local yaml_image_tag yaml_job_type
  yaml_image_tag=$(grep '^rancher_image_tag:' "${vars_file}" 2>/dev/null | head -1 | sed 's/^rancher_image_tag:[[:space:]]*//' | tr -d "\"'")
  yaml_job_type=$(grep '^job_type:' "${vars_file}" 2>/dev/null | head -1 | sed 's/^job_type:[[:space:]]*//' | tr -d "\"'")

  echo "============================================================"
  echo " Dashboard E2E Pipeline (Containerized)"
  echo " job_type=${yaml_job_type:-recurring}"
  echo " rancher_image_tag=${yaml_image_tag:-v2.14-head}"
  echo "============================================================"

  echo "[init] ansible-playbook args: ${verbose_flags[*]:-} ${tag_args[*]:-} ${skip_args[*]:-}"

  docker run --rm -t --init \
    --label "jenkins_build=${BUILD_TAG:-local}" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${PLAYBOOK_DIR}:/playbook" \
    -v "${QA_INFRA_DIR}:/qa-infra" \
    -e QA_INFRA_DIR=/qa-infra \
    -e HOST_DASHBOARD_DIR="${PLAYBOOK_DIR}/dashboard" \
    -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
    -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
    -e PREFIX="${PREFIX:-}" \
    -e EXECUTOR_NUMBER="${EXECUTOR_NUMBER:-0}" \
    -e BUILD_TAG="${BUILD_TAG:-local}" \
    "${RUNNER_IMAGE}" \
    "${verbose_flags[@]}" \
    "${tag_args[@]}" \
    "${skip_args[@]}"
}

# --- Main ---
if [[ "${1:-}" == "destroy" ]]; then
  clone_qa_infra
  if ! docker image inspect "${RUNNER_IMAGE}" &>/dev/null; then
    build_runner_image
  fi

  if [[ ! -f "${PLAYBOOK_DIR}/vars.yaml" ]]; then
    echo "[cleanup] No vars.yaml found — nothing to destroy"
    exit 0
  fi

  echo "[cleanup] Destroying infrastructure via playbook..."
  run_container "cleanup,never" "" || true
  [[ -d "${PLAYBOOK_DIR}/outputs" ]] && rm -rf "${PLAYBOOK_DIR}/outputs" 2>/dev/null || true
  echo "[cleanup] Done."
else
  clone_qa_infra
  build_runner_image
  generate_vars

  # Validate vars.yaml has required keys
  vars_file="${PLAYBOOK_DIR}/vars.yaml"
  yaml_job_type=""
  yaml_rancher_host=""
  for key in rancher_image_tag cypress_tags job_type; do
    if ! grep -q "^${key}:" "${vars_file}"; then
      echo "[init] ERROR: vars.yaml is missing required key '${key}'"
      exit 1
    fi
  done

  yaml_job_type=$(yaml_get_scalar "job_type" "${vars_file}")
  yaml_rancher_host=$(yaml_get_scalar "rancher_host" "${vars_file}")
  if [[ "${yaml_job_type:-recurring}" == "existing" ]]; then
    if [[ -z "${yaml_rancher_host}" ]]; then
      echo "[init] ERROR: rancher_host is required when job_type=existing"
      exit 1
    fi
    validate_existing_host "${yaml_rancher_host}"
    export RANCHER_HOST="${yaml_rancher_host}"
    acquire_existing_host_lock "${yaml_rancher_host}"
  fi

  # Run playbook: provision + setup (skip test — Docker run is below for streaming)
  run_container "" "test"

  # Run Cypress in Docker directly for real-time log streaming in Jenkins
  echo "[init] Running Cypress tests (docker)..."

  if ! docker image inspect "dashboard-test:${EXECUTOR_NUMBER:-0}" &>/dev/null; then
    echo "[init] ERROR: dashboard-test:${EXECUTOR_NUMBER:-0} image not found — playbook build may have failed"
    exit 1
  fi
  if [[ ! -f "${PLAYBOOK_DIR}/.env" ]]; then
    echo "[init] ERROR: .env not found — playbook setup may have failed"
    exit 1
  fi

  container_name="$(build_cypress_container_name)"
  docker rm -f "${container_name}" 2>/dev/null || true

  # Kill the cypress container on abort (SIGTERM/SIGINT) to prevent zombies
  trap 'docker rm -f "${container_name}" 2>/dev/null || true; exit 1' SIGINT SIGTERM

  cypress_exit=0
  docker run --rm -t --init \
    --name "${container_name}" \
    --label "jenkins_build=${BUILD_TAG:-local}" \
    --shm-size=2g \
    --env-file "${PLAYBOOK_DIR}/.env" \
    -e NODE_PATH="" \
    -v "${PLAYBOOK_DIR}/dashboard:/e2e" \
    -w /e2e \
    dashboard-test:${EXECUTOR_NUMBER:-0} || cypress_exit=$?

  # Restore default trap after container exits
  trap - SIGINT SIGTERM

  echo "[init] Cypress exited with code ${cypress_exit}"

  # Fix ownership — Docker runs as root, Jenkins needs to read/clean these files
  chown -R "$(id -u):$(id -g)" "${PLAYBOOK_DIR}/dashboard" 2>/dev/null || true

  # Copy results to workspace for Jenkins artifact collection
  dashboard_dir="${PLAYBOOK_DIR}/dashboard"
  copy_ok=true
  cp "${dashboard_dir}/results.xml" "${JENKINS_WORKSPACE}/" 2>/dev/null || copy_ok=false
  mkdir -p "${JENKINS_WORKSPACE}/html"
  cp -r "${dashboard_dir}/cypress/reports/html/"* "${JENKINS_WORKSPACE}/html/" 2>/dev/null || copy_ok=false

  # Warn only on a genuine container crash (all three must be true):
  #   1. Artifact copy failed
  #   2. Source results.xml doesn't exist (Cypress never finished)
  #   3. Exit code is a known Docker crash signal, not a Cypress failure count
  #     - 125=daemon error, 126=cannot invoke, 127=not found
  #     - 134=SIGABRT, 137=SIGKILL/OOM, 139=SIGSEGV, 143=SIGTERM
  crash=false
  case "${cypress_exit}" in
    125|126|127|134|137|139|143) crash=true ;;
  esac

  if [[ "${copy_ok}" == false && ! -f "${dashboard_dir}/results.xml" && "${crash}" == true ]]; then
    echo "[init] WARNING: artifacts failed to copy — container likely crashed (exit ${cypress_exit})"
  fi

  exit "${cypress_exit}"
fi
