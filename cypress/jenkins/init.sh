#!/bin/bash

set -x
set -e

if cat /etc/os-release | grep -iq "Alpine Linux"; then
 apk update && apk add --no-cache gcompat g++ make
fi

OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=amd64;;
    Darwin*)    MACHINE=darwin-amd64;;
esac

case "${MACHINE}" in
 amd64*)        GOLANG_PGK_SUFFIX=linux-amd64 ;;
 darwin-amd64*) GOLANG_PGK_SUFFIX=darwin-amd64 ;;
esac

GO_DL_URL="https://go.dev/dl" 
GO_DL_VERSION="${GO_DL_VERSION:-1.20.5}"
GO_PKG_FILENAME="go${GO_DL_VERSION}.${GOLANG_PGK_SUFFIX}.tar.gz"
GO_DL_PACKAGE="${GO_DL_URL}/${GO_PKG_FILENAME}"
CORRAL_PATH="${WORKSPACE}/bin"
CORRAL="${CORRAL_PATH}/corral"
CORRAL_VERSION="${CORRAL_VERSION:-1.1.1}"
CORRAL_DOWNLOAD_URL="https://github.com/rancherlabs/corral/releases/download/"
CORRAL_DOWNLOAD_BIN="${CORRAL_DOWNLOAD_URL}v${CORRAL_VERSION}/corral-${CORRAL_VERSION}-${MACHINE}"
PATH="${CORRAL_PATH}:${PATH}"
CORRAL_PACKAGES_REPO="${CORRAL_PACKAGES_REPO:-rancherlabs/corral-packages.git}"
CORRAL_PACKAGES_BRANCH="${CORRAL_PACKAGES_BRANCH:-main}"
DASHBOARD_REPO="${DASHBOARD_REPO:-rancher/dashboard.git}"
DASHBOARD_BRANCH="${DASHBOARD_BRANCH:-master}"
GITHUB_URL="https://github.com/"
RANCHER_TYPE="${RANCHER_TYPE:-local}"
RANCHER_HELM_REPO="${RANCHER_HELM_REPO:-rancher-com-rc}"
HELM_VERSION="${HELM_VERSION:-3.13.2}"
NODEJS_VERSION="${NODEJS_VERSION:-14.19.1}"
CYPRESS_VERSION="${CYPRESS_VERSION:-13.2.0}"
YARN_VERSION="${YARN_VERSION:-1.22.19}"
KUBECTL_VERSION="${KUBECTL_VERSION:-v1.29.8}"
YQ_BIN="mikefarah/yq/releases/latest/download/yq_linux_amd64"

mkdir -p "${WORKSPACE}/bin"
wget "${GITHUB_URL}${YQ_BIN}" -O "${WORKSPACE}/bin/yq"
chmod +x "${WORKSPACE}/bin/yq"

if [ -f "${CORRAL}" ]; then rm "${CORRAL}"; fi
curl -L -o "${CORRAL}" "${CORRAL_DOWNLOAD_BIN}"
chmod +x "${CORRAL}"

curl -L -o "${GO_PKG_FILENAME}" "${GO_DL_PACKAGE}"
tar -C "${WORKSPACE}" -xzf "${GO_PKG_FILENAME}"

curl -sSL https://raw.githubusercontent.com/parleer/semver-bash/latest/semver -o semver
chmod +x semver
mv semver "${WORKSPACE}/bin"

ls -al "${WORKSPACE}"
export PATH=$PATH:"${WORKSPACE}/go/bin:${WORKSPACE}/bin"
export GOROOT="${WORKSPACE}/go"
echo "${PATH}"


ls -al "${WORKSPACE}/go"
go version


if [[ ! -d "${WORKSPACE}/.ssh" ]]; then mkdir -p "${WORKSPACE}/.ssh"; fi
export PRIV_KEY="${WORKSPACE}/.ssh/jenkins_ecdsa"

if [ -f "${PRIV_KEY}" ]; then rm "${PRIV_KEY}"; fi
ssh-keygen -t ecdsa -b 521 -N "" -f "${PRIV_KEY}"
ls -al "${WORKSPACE}/.ssh/"

corral config --public_key "${PRIV_KEY}.pub" --user_id jenkins
corral config vars set corral_user_public_key "$(cat ${PRIV_KEY}.pub)"
corral config vars set corral_user_id jenkins
corral config vars set aws_ssh_user "${AWS_SSH_USER}"
corral config vars set aws_access_key "${AWS_ACCESS_KEY_ID}"
corral config vars set aws_secret_key "${AWS_SECRET_ACCESS_KEY}"
corral config vars set aws_ami "${AWS_AMI}"
corral config vars set aws_region "${AWS_REGION}"
corral config vars set aws_security_group "${AWS_SECURITY_GROUP}"
corral config vars set aws_subnet "${AWS_SUBNET}"
corral config vars set aws_vpc "${AWS_VPC}"
corral config vars set aws_volume_size "${AWS_VOLUME_SIZE}"
corral config vars set aws_volume_type "${AWS_VOLUME_TYPE}"
corral config vars set volume_type "${AWS_VOLUME_TYPE}"
corral config vars set volume_iops "${AWS_VOLUME_IOPS}"
corral config vars set azure_subscription_id "${AZURE_AKS_SUBSCRIPTION_ID}"
corral config vars set azure_client_id "${AZURE_CLIENT_ID}"
corral config vars set azure_client_secret "${AZURE_CLIENT_SECRET}"
corral config vars set create_initial_clusters "${CREATE_INITIAL_CLUSTERS}"
corral config vars set gke_service_account "${GKE_SERVICE_ACCOUNT}"
corral config vars set percy_token "${PERCY_TOKEN}"

create_initial_clusters() {
  shopt -u nocasematch
  if [[ -n "${RANCHER_IMAGE_TAG}" ]]; then
    TARFILE="helm-v${HELM_VERSION}-linux-amd64.tar.gz"
    curl -L -o "${TARFILE}" "https://get.helm.sh/${TARFILE}"
    tar -C "${WORKSPACE}/bin" --strip-components=1 -xzf "${TARFILE}"
    
    # ============================================================================
    # Configure Helm Repositories and Chart URLs
    # ============================================================================
    # Determines which Helm chart repository to use based on RANCHER_HELM_REPO:
    # - Prime repos (rancher-prime, rancher-latest, rancher-alpha): Use production rancher-prime chart
    # - Community repos (rancher-com-alpha, rancher-community, rancher-com-rc): Use respective community chart repos
    # Sets up chart URLs, repo names, and image registries for corral configuration
    # ============================================================================
    if [[ -n "${RANCHER_HELM_REPO}" ]]; then
      if [[ "${RANCHER_HELM_REPO}" == "rancher-prime" ]]; then
      # Prime - production
        RANCHER_CHART_URL=https://charts.rancher.com/server-charts/prime
        HELM_REPO_NAME=rancher-prime
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo update
        corral config vars set rancher_image "registry.suse.com/rancher/rancher"
        RANCHER_CHART_REPO_FOR_CORRAL="prime"
      elif [[ "${RANCHER_HELM_REPO}" == "rancher-latest" ]]; then
        # Prime - staging (RC versions)
        RANCHER_CHART_URL=https://charts.rancher.com/server-charts/prime
        HELM_REPO_NAME=rancher-prime
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo add rancher-latest https://charts.optimus.rancher.io/server-charts/latest
        helm repo update
        corral config vars set rancher_image "stgregistry.suse.com/rancher/rancher"
        RANCHER_CHART_REPO_FOR_CORRAL="prime"
      elif [[ "${RANCHER_HELM_REPO}" == "rancher-alpha" ]]; then
        # Prime alpha - staging
        RANCHER_CHART_URL=https://charts.rancher.com/server-charts/prime
        HELM_REPO_NAME=rancher-prime
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo add rancher-alpha https://charts.optimus.rancher.io/server-charts/alpha
        helm repo update
        corral config vars set rancher_image "stgregistry.suse.com/rancher/rancher"
        RANCHER_CHART_REPO_FOR_CORRAL="prime"
      elif [[ "${RANCHER_HELM_REPO}" == "rancher-com-alpha" ]]; then
        # Community alpha - staging
        RANCHER_CHART_URL=https://releases.rancher.com/server-charts/alpha
        HELM_REPO_NAME=rancher-com-alpha
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo update
        RANCHER_CHART_REPO_FOR_CORRAL="alpha"
      elif [[ "${RANCHER_HELM_REPO}" == "rancher-community" ]]; then
        # Community - production
        RANCHER_CHART_URL=https://releases.rancher.com/server-charts/stable
        HELM_REPO_NAME=rancher-community
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo update
        RANCHER_CHART_REPO_FOR_CORRAL="stable"
      else
        # Community - staging (default: rancher-com-rc)
        RANCHER_CHART_URL=https://releases.rancher.com/server-charts/latest
        HELM_REPO_NAME=rancher-com-rc
        helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}"
        helm repo update
        RANCHER_CHART_REPO_FOR_CORRAL="latest"
      fi
      if [[ -n "${RANCHER_CHART_REPO_FOR_CORRAL:-}" ]]; then
        corral config vars set rancher_chart_repo "${RANCHER_CHART_REPO_FOR_CORRAL}"
      else
        corral config vars set rancher_chart_repo "${RANCHER_HELM_REPO}"
      fi
      # Extract base URL (up to server-charts)
      url_string=$(echo "${RANCHER_CHART_URL}" | grep -o '.*server-charts')
      corral config vars set rancher_chart_url "${url_string}"
    fi
    
    # ============================================================================
    # Resolve Rancher Chart Version
    # ============================================================================
    # Searches the configured Helm repository to find the matching chart version:
    # - For rancher-prime: Finds version matching the base image tag (handles both partial like "v2.13" 
    #   and full versions like "v2.13.1")
    # - For rancher-latest/rancher-alpha: Extracts major.minor version from the image tag
    #   (e.g., "2.13" from "v2.13" or "v2.13.1") to find the highest matching production 
    #   chart version (e.g., "2.13.1")
    # - For head tags: Gets the latest available version from the repo
    # ============================================================================
    version_string=$(echo "${RANCHER_IMAGE_TAG}" | cut -f1 -d"-")
    if [[ -n "${HELM_REPO_NAME}" ]]; then
      if [[ "${RANCHER_IMAGE_TAG}" == "head" ]]; then
        RANCHER_VERSION=$(helm search repo "${HELM_REPO_NAME}" --devel --versions | sed -n '1!p' | head -1 | cut -f2 | tr -d '[:space:]')
      else
        if [ "${RANCHER_HELM_REPO}" = "rancher-alpha" ] || [ "${RANCHER_HELM_REPO}" = "rancher-latest" ]; then
          major_minor=$(echo "${version_string}" | sed 's/^v//' | cut -d. -f1-2)
          RANCHER_VERSION=$(helm search repo "${HELM_REPO_NAME}" --devel --versions | grep "^${HELM_REPO_NAME}/rancher[[:space:]]" | grep "${major_minor}" | head -n 1 | cut -f2 | tr -d '[:space:]')
          # Validate that RANCHER_VERSION was found for Prime repos
          if [ -z "${RANCHER_VERSION}" ]; then
            echo "ERROR: Could not find Rancher chart version for ${RANCHER_IMAGE_TAG} (major.minor: ${major_minor}) in ${HELM_REPO_NAME} repo. Failing pipeline early."
            exit 1
          fi
        else
          RANCHER_VERSION=$(helm search repo "${HELM_REPO_NAME}" --devel --versions | grep "${version_string}" | head -n 1 | cut -f2 | tr -d '[:space:]')
        fi
      fi
      # Validate that RANCHER_VERSION was found (for non-Prime repos and head tags)
      if [ -z "${RANCHER_VERSION}" ]; then
        echo "ERROR: Could not find Rancher version for ${RANCHER_IMAGE_TAG} in ${HELM_REPO_NAME} repo. Failing pipeline early."
        exit 1
      fi
    fi
    
    # ============================================================================
    # Determine Image Tags and Registry Configuration
    # ============================================================================
    # Sets the correct image tag and registry for each repo type:
    # - rancher-prime (production): Uses chart version (from Step 2) with 'v' prefix from production registry
    # - rancher-latest (RC): Searches rancher-latest repo to find the highest matching RC image version (e.g., "2.13.1-rc1")
    # - rancher-alpha (alpha): Searches rancher-alpha repo to find the highest matching alpha image version (e.g., "2.13.2-alpha1")
    # - Community repos: Uses RANCHER_IMAGE_TAG as-is (including -head tags)
    # Configures environment variables (CATTLE_AGENT_IMAGE, RANCHER_VERSION_TYPE) for corral
    # ============================================================================
    if [ "${RANCHER_HELM_REPO}" = "rancher-prime" ] || \
       [ "${RANCHER_HELM_REPO}" = "rancher-latest" ] || \
       [ "${RANCHER_HELM_REPO}" = "rancher-alpha" ]; then
      if [[ "${RANCHER_HELM_REPO}" == "rancher-alpha" ]]; then
        found_version=$(helm search repo rancher-alpha --devel --versions | grep "^rancher-alpha/rancher[[:space:]]" | grep "${version_string}" | grep -- "-alpha" | head -n 1 | cut -f2 | tr -d '[:space:]')
        if [[ -n "${found_version}" ]]; then
          RANCHER_IMAGE_TAG_FOR_CORRAL="v${found_version}"
        else
          echo "ERROR: Could not find alpha version for ${RANCHER_IMAGE_TAG} in rancher-alpha repo. Failing pipeline early."
          exit 1
        fi
        corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG_FOR_CORRAL}"
        corral config vars set env_var_map '["CATTLE_AGENT_IMAGE|stgregistry.suse.com/rancher/rancher-agent:'${RANCHER_IMAGE_TAG_FOR_CORRAL}', RANCHER_VERSION_TYPE|prime"]'
      elif [[ "${RANCHER_HELM_REPO}" == "rancher-latest" ]]; then
        found_version=$(helm search repo rancher-latest --devel --versions | grep "^rancher-latest/rancher[[:space:]]" | grep "${version_string}" | grep -- "-rc" | head -n 1 | cut -f2 | tr -d '[:space:]')
        if [[ -n "${found_version}" ]]; then
          RANCHER_IMAGE_TAG_FOR_CORRAL="v${found_version}"
        else
          echo "ERROR: Could not find RC version for ${RANCHER_IMAGE_TAG} in rancher-latest repo. Failing pipeline early."
          exit 1
        fi
        corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG_FOR_CORRAL}"
        corral config vars set env_var_map '["CATTLE_AGENT_IMAGE|stgregistry.suse.com/rancher/rancher-agent:'${RANCHER_IMAGE_TAG_FOR_CORRAL}', RANCHER_VERSION_TYPE|prime"]'
      else
        RANCHER_IMAGE_TAG_FOR_CORRAL="v${RANCHER_VERSION}"
        corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG_FOR_CORRAL}"
        if [[ "${RANCHER_HELM_REPO}" == "rancher-prime" ]]; then
          corral config vars set env_var_map '["CATTLE_AGENT_IMAGE|registry.suse.com/rancher/rancher-agent:'${RANCHER_IMAGE_TAG_FOR_CORRAL}', RANCHER_VERSION_TYPE|prime"]'
        fi
      fi
    else
      corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG}"
    fi
  fi
  
  # ============================================================================
  # Provision AWS Infrastructure and Install Rancher
  # ============================================================================
  # Updates corral package configurations with versions, then creates AWS infrastructure:
  # - Updates rancher-k3s.yaml with Rancher, Kubernetes, and cert-manager versions
  # - Creates custom nodes for RKE1 and RKE2 clusters
  # - Creates imported K3s cluster for testing
  # - Creates Rancher installation on K3s cluster (for recurring jobs)
  # ============================================================================
  cd "${WORKSPACE}/corral-packages"
  yq -i e ".variables.rancher_version += [\"${RANCHER_VERSION}\"] | .variables.rancher_version style=\"literal\"" packages/aws/rancher-k3s.yaml
  yq -i e ".variables.kubernetes_version += [\"${K3S_KUBERNETES_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/rancher-k3s.yaml
  yq -i e ".variables.cert_manager_version += [\"${CERT_MANAGER_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/rancher-k3s.yaml

  echo $'manifest:\n  name: custom-node\ndescription: custom generated node\ntemplates:\n  - aws/nodes\nvariables:\n  instance_type:\n    - t3a.xlarge' > packages/aws/custom-node.yaml

  yq -i e ".variables.kubernetes_version += [\"${K3S_KUBERNETES_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/k3s.yaml
  cat packages/aws/rancher-k3s.yaml
  ls -al packages/aws/
  cat packages/aws/dashboard-tests.yaml
  cat packages/aws/custom-node.yaml

  prefix_random=$(cat /dev/urandom | env LC_ALL=C tr -dc 'a-z0-9' | fold -w 8 | head -n 1)

  corral config vars set bootstrap_password "${BOOTSTRAP_PASSWORD:-password}"
  corral config vars set aws_route53_zone "${AWS_ROUTE53_ZONE}"
  corral config vars set server_count "${SERVER_COUNT:-3}"
  corral config vars set agent_count "${AGENT_COUNT:-0}"
  corral config vars delete rancher_host
  if [[ "${JOB_TYPE}" == "recurring" ]]; then
    RANCHER_HOST="jenkins-${prefix_random}.${AWS_ROUTE53_ZONE}"
  fi

  K3S_KUBERNETES_VERSION="${K3S_KUBERNETES_VERSION//+/-}"
  make init
  make build
  ls -al dist
  corral config vars set node_count 1
  corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-c"
  corral config vars delete instance_type
  corral config vars set bastion_ip ""

  echo "Custom Node for RKE2 Cluster"
  corral create --skip-cleanup --recreate --debug customnode \
    "dist/aws-t3a.xlarge"
  corral config vars set custom_node_ip "$(corral vars customnode first_node_ip)"
  corral config vars set custom_node_key "$(corral vars customnode corral_private_key | base64 -w 0)"

  echo "Custom Node for RKE1 Cluster"
  corral create --skip-cleanup --recreate --debug customnoderke1 \
    "dist/aws-t3a.xlarge"
  corral config vars set custom_node_ip_rke1 "$(corral vars customnoderke1 first_node_ip)"
  corral config vars set custom_node_key_rke1 "$(corral vars customnoderke1 corral_private_key | base64 -w 0)"
  
  corral config vars set instance_type "${AWS_INSTANCE_TYPE}"
  corral config vars set aws_hostname_prefix "jenkins-${prefix_random}"
  echo "Corral Package string: ${K3S_KUBERNETES_VERSION}-${RANCHER_VERSION//v}-${CERT_MANAGER_VERSION}"
  corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-i"
  corral config vars set server_count 1
  corral create --skip-cleanup --recreate --debug importcluster \
    "dist/aws-k3s-${K3S_KUBERNETES_VERSION}"
  corral config vars set imported_kubeconfig $(corral vars importcluster kubeconfig)
  corral config vars set aws_hostname_prefix "jenkins-${prefix_random}"
  corral config vars set server_count "${SERVER_COUNT:-3}"
  if [[ "${JOB_TYPE}" == "recurring" ]]; then
    corral create --skip-cleanup --recreate --debug rancher \
      "dist/aws-k3s-rancher-${K3S_KUBERNETES_VERSION}-${RANCHER_VERSION//v}-${CERT_MANAGER_VERSION}"
  fi
}


if [[ "${JOB_TYPE}" == "recurring" ]]; then 
  RANCHER_TYPE="recurring"
  create_initial_clusters
fi

if [[ "${JOB_TYPE}" == "existing" ]]; then
  RANCHER_TYPE="existing"
  shopt -s nocasematch
  if [[ "${CREATE_INITIAL_CLUSTERS}" == "yes" ]]; then
    create_initial_clusters
  fi
  shopt -u nocasematch
fi

echo "Rancher type: ${RANCHER_TYPE}"

if semver lt "${RANCHER_VERSION}" "2.9.99" && [[ "${RANCHER_IMAGE_TAG}" != "head" ]]; then NODEJS_VERSION="16.20.2"; fi

corral config vars set rancher_type "${RANCHER_TYPE}"
corral config vars set nodejs_version "${NODEJS_VERSION}"
corral config vars set dashboard_repo "${DASHBOARD_REPO}"
corral config vars set dashboard_branch "${DASHBOARD_BRANCH}"

# Exclude tagged E2E tests that don't apply to Rancher build:
# - @noVai: Jenkins pipeline runs against Vai-enabled Rancher; skip tests that assume Vai is off
#   (e.g. priority/no-vai-setup.spec.ts which disables the Vai feature flag).
# - @noPrime: on Prime/alpha/latest, skip tests that assume non-Prime defaults
#   (e.g. priority/oidc-provider-setup.spec.ts — OIDC Provider is already enabled on Prime).
if [[ -n "${CYPRESS_TAGS}" ]]; then
  if [[ "${RANCHER_HELM_REPO}" == "rancher-prime" || "${RANCHER_HELM_REPO}" == "rancher-latest" || "${RANCHER_HELM_REPO}" == "rancher-alpha" ]]; then
    CYPRESS_TAGS="${CYPRESS_TAGS}+-@noVai+-@noPrime"
  else
    CYPRESS_TAGS="${CYPRESS_TAGS}+-@noVai"
  fi
fi
corral config vars set cypress_tags "${CYPRESS_TAGS}"

# Save all values to a file for the Slack notification script
cat > "${WORKSPACE}/notification_values.txt" << EOF
RANCHER_VERSION=${RANCHER_VERSION}
RANCHER_IMAGE_TAG=${RANCHER_IMAGE_TAG_FOR_CORRAL:-${RANCHER_IMAGE_TAG}}
RANCHER_CHART_URL=${RANCHER_CHART_URL}
RANCHER_HELM_REPO=${RANCHER_HELM_REPO}
HELM_REPO_NAME=${HELM_REPO_NAME:-}
CYPRESS_TAGS=${CYPRESS_TAGS}
EOF
corral config vars set cypress_version "${CYPRESS_VERSION}"
corral config vars set yarn_version "${YARN_VERSION}"
corral config vars set kubectl_version "${KUBECTL_VERSION}"

if [[ -n "${RANCHER_USERNAME}" ]]; then
   corral config vars set rancher_username "${RANCHER_USERNAME}"
fi

if [[ -n "${RANCHER_PASSWORD}" ]]; then
   corral config vars set rancher_password "${RANCHER_PASSWORD}"
fi

if [[ -n "${RANCHER_HOST}" ]]; then
   corral config vars set rancher_host "${RANCHER_HOST}"
fi

if [[ -n "${CHROME_VERSION}" ]]; then
   corral config vars set chrome_version "${CHROME_VERSION}"
fi

cd "${WORKSPACE}/corral-packages"
make init
make build
echo "${PWD}"
chmod -R 766 "${WORKSPACE}/corral-packages"
corral config vars set node_count 1
corral config vars set bastion_ip ""
corral config vars delete instance_type
corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-ci"
corral create --skip-cleanup --recreate --debug ci dist/aws-dashboard-tests-t3a.xlarge
corral config vars -o yaml
corral vars ci corral_private_key -o yaml
NODE_EXTERNAL_IP="$(corral vars ci first_node_ip)"
cd "${WORKSPACE}"
echo "${PWD}"
