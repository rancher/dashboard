#!/usr/bin/env bash
set -e
# set -x

# ---------------------------------------------------------------------------
# Dedicated Helm/k3s launcher for the Extension Compatibility test.
#
# Unlike scripts/e2e-k3s-start.sh (used by the main e2e suite) this script:
#   - Is driven entirely by env vars (per-matrix Rancher version), NOT by
#     branches-metadata.json - the compatibility matrix tests many Rancher
#     versions that do not map 1:1 to a git branch.
#   - NEVER overrides the shipped dashboard UI. The whole point of the
#     compatibility test is to exercise the *stock* UI shipped with each
#     Rancher version, loading the extension dynamically from an external
#     extension server (developer load).
#
# Why a kube version per Rancher version?
#   The old all-in-one Docker image bundled its own compatible k3s. With Helm
#   we install our own external k3s first, so each Rancher version needs a k3s
#   version it actually supports - passed in via KUBE_VERSION.
# ---------------------------------------------------------------------------

# ---------------------------------
# ----------------------- Input
# ---------------------------------

# Rancher container image (per matrix row)
RANCHER_IMG_REGISTRY=${RANCHER_IMG_REGISTRY:-}          # e.g. stgregistry.suse.com  (empty = docker hub)
RANCHER_IMG_NAMESPACE=${RANCHER_IMG_NAMESPACE:-rancher}
RANCHER_IMG_NAME=${RANCHER_IMG_NAME:-rancher}
RANCHER_IMG_TAG=${RANCHER_IMG_TAG:-head}               # e.g. v2.10-head, v2.14-head, head

# Rancher agent image (per matrix row)
RANCHER_AGENT_IMG_NAMESPACE=${RANCHER_AGENT_IMG_NAMESPACE:-rancher}
RANCHER_AGENT_IMG_NAME=${RANCHER_AGENT_IMG_NAME:-rancher-agent}
RANCHER_AGENT_IMG_TAG=${RANCHER_AGENT_IMG_TAG:-$RANCHER_IMG_TAG}

# Helm chart repo that serves the -head charts for the target Rancher version.
#  - master/head:      https://charts.optimus.rancher.io/server-charts/release-2.15
#  - a release branch: https://charts.optimus.rancher.io/server-charts/release-2.XX
RANCHER_HELM_REPO_URL=${RANCHER_HELM_REPO_URL:-https://charts.optimus.rancher.io/server-charts/release-2.15}

# k3s version the target Rancher version supports (MUST be set per matrix row).
KUBE_VERSION=${KUBE_VERSION:?KUBE_VERSION must be set (e.g. v1.35.2+k3s1)}

# sslip.io magic domain - resolves *.sslip.io to the embedded IP, so the
# Rancher ingress hostname and the browser both use a real DNS name over TLS.
TEST_BASE_URL=${TEST_BASE_URL:-https://127.0.0.1.sslip.io}

RANCHER_IMG_REPO=$RANCHER_IMG_NAMESPACE/$RANCHER_IMG_NAME
RANCHER_AGENT_IMG=$RANCHER_AGENT_IMG_NAMESPACE/$RANCHER_AGENT_IMG_NAME:$RANCHER_AGENT_IMG_TAG

DASHBOARD_URL="${TEST_BASE_URL#https://}"
RANCHER_NAMESPACE=cattle-system

# - See https://ranchermanager.docs.rancher.com/how-to-guides/advanced-user-guides/enable-api-audit-log (0 off, 3 everything)
RANCHER_AUDIT_LOG_LEVEL=3

echo "--------------------------------------"
echo "Extension compatibility - Rancher via Helm"
echo
echo "KUBE_VERSION:          ${KUBE_VERSION}"
echo "RANCHER_HELM_REPO_URL: ${RANCHER_HELM_REPO_URL}"
echo "RANCHER_IMG_REGISTRY:  ${RANCHER_IMG_REGISTRY:-<docker hub>}"
echo "RANCHER_IMG_REPO:      ${RANCHER_IMG_REPO}"
echo "RANCHER_IMG_TAG:       ${RANCHER_IMG_TAG}"
echo "RANCHER_AGENT_IMG:     ${RANCHER_AGENT_IMG}"
echo "TEST_BASE_URL:         ${TEST_BASE_URL}"
echo "--------------------------------------"

# ---------------------------------
# ----------------------- Install k3s + helm
# ---------------------------------

echo "Installing k3s (with kubectl).........."
# The install.sh itself is version-agnostic; INSTALL_K3S_VERSION selects the binary.
curl -sfL -o k3s-script https://raw.githubusercontent.com/k3s-io/k3s/v1.35.3%2Bk3s1/install.sh
chmod +x k3s-script
INSTALL_K3S_VERSION="$KUBE_VERSION" sh k3s-script

export KUBECONFIG=~/.kube/config
mkdir ~/.kube 2> /dev/null || true
sudo k3s kubectl config view --raw > "$KUBECONFIG"
chmod 600 "$KUBECONFIG"

echo "Installing helm.........."
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

# ---------------------------------
# ----------------------- cert-manager + rancher repo
# ---------------------------------

echo "Installing cert-manager.........."
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.7.1/cert-manager.crds.yaml
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.7.1

echo "Cert manager pods should be up"
kubectl get pods --namespace cert-manager

echo "Setting up Rancher Repo.........."
RANCHER_HELM_REPO_NAME=rancher-helm
helm repo add $RANCHER_HELM_REPO_NAME $RANCHER_HELM_REPO_URL
helm repo update
helm search repo $RANCHER_HELM_REPO_NAME --devel

# ---------------------------------------
# ----------------------- Install Rancher
# ---------------------------------------

echo "Installing Rancher.........."
kubectl create ns $RANCHER_NAMESPACE
helm install rancher $RANCHER_HELM_REPO_NAME/rancher \
  --namespace $RANCHER_NAMESPACE \
  --devel \
  --set hostname=$DASHBOARD_URL \
  --set replicas="1" \
  --set systemDefaultRegistry=$RANCHER_IMG_REGISTRY \
  --set image.repository="$RANCHER_IMG_REPO" \
  --set image.tag="$RANCHER_IMG_TAG" \
  --set image.pullPolicy="Always" \
  --set auditLog.enabled=true \
  --set auditLog.level=$RANCHER_AUDIT_LOG_LEVEL \
  --set extraEnv\[0\].name="CATTLE_AGENT_IMAGE" \
  --set-string extraEnv\[0\].value="$RANCHER_AGENT_IMG" \
  --set extraEnv\[1\].name="CATTLE_UI_OFFLINE_PREFERRED" \
  --set-string extraEnv\[1\].value="true" \
  --set extraEnv\[2\].name="CATTLE_BOOTSTRAP_PASSWORD" \
  --set-string extraEnv\[2\].value="${CATTLE_BOOTSTRAP_PASSWORD:-password}" \
  --set extraEnv\[3\].name="CATTLE_PASSWORD_MIN_LENGTH" \
  --set-string extraEnv\[3\].value="3"

# ----------------------------------------------------
# ----------------------- Wait for Rancher to be ready
# ----------------------------------------------------

echo "Waiting for Rancher to come up.........."
kubectl -n $RANCHER_NAMESPACE rollout status deploy/rancher --timeout=600s

echo "Waiting for dashboard UI to be reachable.........."
okay=0
while [ $okay -lt 60 ]; do
  STATUS=$(curl --silent --location --head -k $DASHBOARD_URL/dashboard/ | awk -F'HTTP/2 ' '{print $2}' | awk 'length { print $1}')
  echo "Status: $STATUS (Try: $okay)"
  okay=$((okay+1))
  if [ "$STATUS" == "200" ]; then
    okay=100
  else
    sleep 5
  fi
done

if [ "$STATUS" != "200" ]; then
  echo "Dashboard did not become available in a reasonable time"
  kubectl -n $RANCHER_NAMESPACE get pods
  exit 1
fi

echo "Dashboard UI is ready (stock UI - not overridden)"

echo "Waiting for rancher-webhook to be running..."
okay=0
while [ $okay -lt 30 ] ; do
  if kubectl -n $RANCHER_NAMESPACE get po -l app=rancher-webhook | grep -q '1/1.*Running' ; then
    break
  else
    echo "Webhook not ready, checking again in 10s..."
    okay=$((okay+1))
    sleep 10
  fi
done

# Let the cluster settle before Cypress starts. Right after boot, Rancher spins up the fleet,
# provisioning and CAPI controllers, which pull images and saturate the runner - that CPU/IO churn
# is what races Cypress's browser launch ("Timed out waiting for the browser to connect") and makes
# the UI re-render under the setup clicks (detached-from-DOM). Blocking until these Deployments are
# Available costs seconds when healthy and only waits as long as genuinely needed.
echo "Waiting for cattle workloads to settle (so the runner is quiet when Cypress starts)..."
kubectl wait --for=condition=Available --timeout=600s deployment --all -n $RANCHER_NAMESPACE || \
  echo "Warning: not all ${RANCHER_NAMESPACE} deployments reported Available; continuing"
for ns in cattle-fleet-system cattle-fleet-local-system cattle-provisioning-capi-system cattle-capi-system; do
  if kubectl get ns "$ns" >/dev/null 2>&1; then
    echo "  settling namespace ${ns}..."
    kubectl wait --for=condition=Available --timeout=300s deployment --all -n "$ns" || \
      echo "  Warning: not all ${ns} deployments reported Available; continuing"
  fi
done

echo "Cluster workloads settled:"
kubectl get deploy -A | grep -E 'cattle|fleet|capi' || true

echo "Rancher is ready"
