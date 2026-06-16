#!/usr/bin/env bash
# set -x

# ---------------------------------
# ----------------------- Input
# ---------------------------------

USE_LOCAL_BRANCH_METADATA=true # we use an updated branch_metadata. once that's in master we can toggle this to false
USE_K3S=${USE_K3S:-true} # use k3s, or k3d
OVERRIDE_UIS=${USE_K3S:-false} # use provided UIs (built externally, used in github CI) or not
TEST_BASE_URL=${TEST_BASE_URL:-https://127.0.0.1.sslip.io}

# --------------------------------------
# ----------------------- Setup Env Vars
# --------------------------------------

# Get container image from branch-metadata. when testing locally update to pass in your target branch
if [ "$USE_LOCAL_BRANCH_METADATA" = "true" ]; then
  BRANCH_DATA=$(./scripts/get-branch-metadata.sh --local ${GITHUB_BASE_REF:-${GITHUB_REF_NAME}})
else
  BRANCH_DATA=$(./scripts/get-branch-metadata.sh ${GITHUB_BASE_REF:-${GITHUB_REF_NAME}})
fi

if [ -n "$BRANCH_DATA" ]; then
  KUBE_VERSION=$(echo "$BRANCH_DATA" | jq -r '.e2e["kube"].version')

  # Helm Repo Info
  # - rancher-latest will have released versions (--devel rc's)
  #   - RANCHER_HELM_REPO_URL=https://releases.rancher.com/server-charts/latest
  # - rancher-alpha will have alphas (--devel required)
  # - charts.optimus.rancher.io/server-charts/$RANCHER_RELEASE will have the latest and greatest chart
  RANCHER_HELM_REPO_URL=$(echo "$BRANCH_DATA" | jq -r '.e2e["helm"]["repo-url"]')

  ## {registry}/{repo namespace}/{repo name}:{tag}
  ## stgregistry.suse.com/rancher/rancher:v2-13-head

  # Helm Image version
  RANCHER_IMG_REGISTRY=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-image"].registry // ""')
  RANCHER_IMG_NAMESPACE=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-image"].namespace')
  RANCHER_IMG_NAME=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-image"].name')
  RANCHER_IMG_REPO=$RANCHER_IMG_NAMESPACE/$RANCHER_IMG_NAME

  RANCHER_IMG_TAG=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-image"].tag')

  RANCHER_AGENT_IMG_NAMESPACE=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-agent"].namespace')
  RANCHER_AGENT_IMG_NAME=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-agent"].name')
  RANCHER_AGENT_IMG_TAG=$(echo "$BRANCH_DATA" | jq -r '.e2e["rancher-agent"].tag')

  RANCHER_AGENT_IMG=$RANCHER_AGENT_IMG_NAMESPACE/$RANCHER_AGENT_IMG_NAME:$RANCHER_AGENT_IMG_TAG
else
  echo "Error: Failed to get branch metadata"
  exit 1
fi

echo "--------------------------------------"
echo "Using the following configuration:"
echo "KUBE_VERSION: ${KUBE_VERSION}"
echo "RANCHER_HELM_REPO_URL: ${RANCHER_HELM_REPO_URL}"
echo "RANCHER_IMG_REPO: ${RANCHER_IMG_REPO}"
echo "RANCHER_IMG_TAG: ${RANCHER_IMG_TAG}"
echo "RANCHER_AGENT_IMG: ${RANCHER_AGENT_IMG}"
echo "--------------------------------------"


DASHBOARD_URL="${TEST_BASE_URL#https://}"
RANCHER_NAMESPACE=cattle-system

DIR=$(cd $(dirname $0)/..; pwd)

# See `script/build-e2e`. This is the ui builds we wish to test
DASHBOARD_DIST=${DIR}/dist
EMBER_DIST=${DIR}/dist_ember

# - See https://ranchermanager.docs.rancher.com/how-to-guides/advanced-user-guides/enable-api-audit-log (0 off, 3 everything)
# - logs sent to side-car container in rancher pod
# - e2e-k3s-logs package task will capture logs in all containers in all rancher pods
RANCHER_AUDIT_LOG_LEVEL=3

# ---------------------------------
# ----------------------- Setup Env
# ---------------------------------

if [ "$USE_K3S" = "true" ]; then
  echo "Installing k3s (with kubectl).........."
  export K3S_CHECKSUM=8598e002e61d658fed7b7542fc6d2c66d8da6eae69e088830105d2ee1ffb6d91
  curl -sfL -o k3s-script https://raw.githubusercontent.com/k3s-io/k3s/v1.35.3%2Bk3s1/install.sh

  DOWNLOADED_CHECKSUM=$(sha256sum k3s-script | awk '{print $1}')
  if [ "$DOWNLOADED_CHECKSUM" != "${K3S_CHECKSUM}" ]; then
    echo "Error: K3S checksum mismatch! Expected ${K3S_CHECKSUM} but got $DOWNLOADED_CHECKSUM"
    exit 1
  fi

  INSTALL_K3S_VERSION="$KUBE_VERSION" sh k3s-script
  export KUBECONFIG=~/.kube/config
  mkdir ~/.kube 2> /dev/null
  sudo k3s kubectl config view --raw > "$KUBECONFIG"
  chmod 600 "$KUBECONFIG"
  
  echo "Installing helm.........."
  export HELM_CHECKSUM=38b65f882d9cae3891755bdb03becc6a01ae6f9cb24826c191f219ddfee70a5d
  curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3

  DOWNLOADED_CHECKSUM=$(sha256sum get_helm.sh | awk '{print $1}')
  if [ "$DOWNLOADED_CHECKSUM" != "${HELM_CHECKSUM}" ]; then
    echo "Error: Helm checksum mismatch! Expected ${HELM_CHECKSUM} but got $DOWNLOADED_CHECKSUM"
    exit 1
  fi

  chmod 700 get_helm.sh
  ./get_helm.sh
else
  K3D_VERSION=${KUBE_VERSION/+/-}
  k3d cluster delete e2e 
  k3d cluster create e2e --image rancher/k3s:$K3D_VERSION -p 80:80@loadbalancer -p 443:443@loadbalancer --agents 1
fi

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
  --namespace cattle-system \
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
  --set-string extraEnv\[2\].value="password" \
  --set extraEnv\[3\].name="CATTLE_PASSWORD_MIN_LENGTH" \
  --set-string extraEnv\[3\].value="3" \
  --set 'extraEnv[4].name=CATTLE_FEATURES' \
  --set 'extraEnv[4].value=oidc-provider=true'

# ----------------------------------------------------
# ----------------------- Wait for Rancher to be ready
# ----------------------------------------------------


echo "Waiting for Rancher to come up.........."
kubectl -n cattle-system rollout status deploy/rancher

echo "Waiting for dashboard UI to be reachable.........."

okay=0

while [ $okay -lt 20 ]; do
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
  exit 1
fi


if [ "$OVERRIDE_UIS" == "true" ]; then
  echo "Updating UI within Rancher container.........."
  # Note - these will pick the first container within the pod, so replicas=1 above is important
  POD_NAME=$(kubectl get pods --selector=app=rancher -n $RANCHER_NAMESPACE | tail -n 1 | cut -d ' ' -f1)
  echo "POD NAME: $POD_NAME"
  if [ "$POD_NAME" == "" ]; then
    echo "Failed to find rancher pod"
    exit 1
  fi

  # Remove root folders that container UIs
  kubectl exec $POD_NAME -n $RANCHER_NAMESPACE -- sh -c 'rm -rf /usr/share/rancher/ui-dashboard/dashboard'
  kubectl exec $POD_NAME -n $RANCHER_NAMESPACE -- sh -c 'rm -rf /usr/share/rancher/ui'

  # Copy local builds to root folders that should contain UIs
  mv $DASHBOARD_DIST dashboard
  mv $EMBER_DIST ui
  kubectl cp dashboard $POD_NAME:/usr/share/rancher/ui-dashboard -n $RANCHER_NAMESPACE
  kubectl cp ui $POD_NAME:/usr/share/rancher -n $RANCHER_NAMESPACE

  # Final validation
  STATUS=$(curl --silent --location --head -k $DASHBOARD_URL/dashboard/ | awk -F'HTTP/2 ' '{print $2}' | awk 'length { print $1}')
  echo "Status: $STATUS"

  if [ "$STATUS" != "200" ]; then
    echo "After updating dashboard with dev build it is no longer available"
    exit 1
  fi
fi

echo "Dashboard UI is ready"

echo "Waiting for rancher-webhook to be running..."
okay=0
while [ $okay -lt 30 ] ; do
  if kubectl -n cattle-system get po -l app=rancher-webhook | grep -q '1/1.*Running' ; then
    break
  else
    echo "Webhook not ready, checking again in 10s..."
    okay=$((okay+1))
    sleep 10
  fi
done

echo "Waiting for capi-webhook-service to exist..."
okay=0
while [ $okay -lt 30 ] ; do
  if kubectl -n cattle-capi-system get service capi-webhook-service | grep '443/TCP' ; then
    break
  else
    echo "capi-webhook-service does not exist, checking again in 10s..."
    okay=$((okay+1))
    sleep 10
  fi
done

echo "Rancher is ready"
