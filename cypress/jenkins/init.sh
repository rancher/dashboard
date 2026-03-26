#!/bin/bash

set -e
set +x

# Source shared utilities
source cypress/jenkins/utils.sh

if cat /etc/os-release | grep -iq "Alpine Linux"; then
 apk update -q && apk add -q --no-cache gcompat g++ make
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

# Generate random prefix for hostname uniqueness
prefix_random=$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | fold -w 8 | head -n 1)

mkdir -p "${WORKSPACE}/bin"
wget -q "${GITHUB_URL}${YQ_BIN}" -O "${WORKSPACE}/bin/yq"
chmod +x "${WORKSPACE}/bin/yq"

if [ -f "${CORRAL}" ]; then rm "${CORRAL}"; fi
curl -sSL -o "${CORRAL}" "${CORRAL_DOWNLOAD_BIN}"
chmod +x "${CORRAL}"

curl -sSL -o "${GO_PKG_FILENAME}" "${GO_DL_PACKAGE}"
tar -C "${WORKSPACE}" -xzf "${GO_PKG_FILENAME}" > /dev/null

curl -sSL https://raw.githubusercontent.com/parleer/semver-bash/latest/semver -o semver
chmod +x semver
mv semver "${WORKSPACE}/bin"

export PATH=$PATH:"${WORKSPACE}/go/bin:${WORKSPACE}/bin"
export GOROOT="${WORKSPACE}/go"

if [[ ! -d "${WORKSPACE}/.ssh" ]]; then mkdir -p "${WORKSPACE}/.ssh"; fi
export PRIV_KEY="${WORKSPACE}/.ssh/jenkins_ecdsa"

if [ -f "${PRIV_KEY}" ]; then rm "${PRIV_KEY}"; fi
ssh-keygen -q -t ecdsa -b 521 -N "" -f "${PRIV_KEY}"

echo "Initializing corral configuration..."
clean_corral config --public_key "${PRIV_KEY}.pub" --user_id jenkins
clean_corral config vars set corral_user_public_key "$(cat ${PRIV_KEY}.pub)"
clean_corral config vars set corral_user_id jenkins
clean_corral config vars set aws_ssh_user "${AWS_SSH_USER}"
clean_corral config vars set aws_access_key "${AWS_ACCESS_KEY_ID}"
clean_corral config vars set aws_secret_key "${AWS_SECRET_ACCESS_KEY}"
clean_corral config vars set aws_ami "${AWS_AMI}"
clean_corral config vars set aws_region "${AWS_REGION}"
clean_corral config vars set aws_security_group "${AWS_SECURITY_GROUP}"
clean_corral config vars set aws_subnet "${AWS_SUBNET}"
clean_corral config vars set aws_vpc "${AWS_VPC}"
clean_corral config vars set aws_volume_size "${AWS_VOLUME_SIZE}"
clean_corral config vars set aws_volume_type "${AWS_VOLUME_TYPE}"
clean_corral config vars set volume_type "${AWS_VOLUME_TYPE}"
clean_corral config vars set volume_iops "${AWS_VOLUME_IOPS}"
clean_corral config vars set azure_subscription_id "${AZURE_AKS_SUBSCRIPTION_ID}"
clean_corral config vars set azure_client_id "${AZURE_CLIENT_ID}"
clean_corral config vars set azure_client_secret "${AZURE_CLIENT_SECRET}"
clean_corral config vars set create_initial_clusters "${CREATE_INITIAL_CLUSTERS}"
clean_corral config vars set gke_service_account "${GKE_SERVICE_ACCOUNT}"
clean_corral config vars set percy_token "${PERCY_TOKEN}"
clean_corral config vars set qase_automation_token "${QASE_AUTOMATION_TOKEN}"
clean_corral config vars set qase_project "${QASE_PROJECT}"
clean_corral config vars set qase_report "${QASE_REPORT}"

# ============================================================================
# Configure Helm repositories and resolve Rancher version
# ============================================================================
configure_rancher_helm() {
  if [[ -z "${RANCHER_IMAGE_TAG}" ]]; then
    return
  fi

  TARFILE="helm-v${HELM_VERSION}-linux-amd64.tar.gz"
  curl -sSL -o "${TARFILE}" "https://get.helm.sh/${TARFILE}"
  tar -C "${WORKSPACE}/bin" --strip-components=1 -xzf "${TARFILE}"

  if [[ -n "${RANCHER_HELM_REPO}" ]]; then
    if [[ "${RANCHER_HELM_REPO}" == "rancher-prime" ]]; then
      RANCHER_CHART_URL=https://charts.rancher.com/server-charts/prime
      HELM_REPO_NAME=rancher-prime
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      clean_corral config vars set rancher_image "registry.suse.com/rancher/rancher"
      RANCHER_CHART_REPO_FOR_CORRAL="prime"
    elif [[ "${RANCHER_HELM_REPO}" == "rancher-latest" ]]; then
      RANCHER_CHART_URL=https://charts.optimus.rancher.io/server-charts/latest
      HELM_REPO_NAME=rancher-latest
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      clean_corral config vars set rancher_image "stgregistry.suse.com/rancher/rancher"
      RANCHER_CHART_REPO_FOR_CORRAL="latest"
    elif [[ "${RANCHER_HELM_REPO}" == "rancher-alpha" ]]; then
      RANCHER_CHART_URL=https://charts.optimus.rancher.io/server-charts/alpha
      HELM_REPO_NAME=rancher-alpha
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      clean_corral config vars set rancher_image "stgregistry.suse.com/rancher/rancher"
      RANCHER_CHART_REPO_FOR_CORRAL="alpha"
    elif [[ "${RANCHER_HELM_REPO}" == "rancher-com-alpha" ]]; then
      RANCHER_CHART_URL=https://releases.rancher.com/server-charts/alpha
      HELM_REPO_NAME=rancher-com-alpha
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      RANCHER_CHART_REPO_FOR_CORRAL="alpha"
    elif [[ "${RANCHER_HELM_REPO}" == "rancher-community" ]]; then
      RANCHER_CHART_URL=https://releases.rancher.com/server-charts/stable
      HELM_REPO_NAME=rancher-community
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      RANCHER_CHART_REPO_FOR_CORRAL="stable"
    else
      RANCHER_CHART_URL=https://releases.rancher.com/server-charts/latest
      HELM_REPO_NAME=rancher-com-rc
      helm repo add "${HELM_REPO_NAME}" "${RANCHER_CHART_URL}" > /dev/null
      helm repo update > /dev/null
      RANCHER_CHART_REPO_FOR_CORRAL="latest"
    fi
    if [[ -n "${RANCHER_CHART_REPO_FOR_CORRAL:-}" ]]; then
      clean_corral config vars set rancher_chart_repo "${RANCHER_CHART_REPO_FOR_CORRAL}"
    else
      clean_corral config vars set rancher_chart_repo "${RANCHER_HELM_REPO}"
    fi
    url_string=$(echo "${RANCHER_CHART_URL}" | grep -o '.*server-charts')
    clean_corral config vars set rancher_chart_url "${url_string}"
  fi

  version_string=$(echo "${RANCHER_IMAGE_TAG}" | cut -f1 -d"-")
  if [[ -n "${HELM_REPO_NAME}" ]]; then
    if [[ "${RANCHER_IMAGE_TAG}" == "head" ]]; then
      RANCHER_VERSION=$(helm search repo "${HELM_REPO_NAME}" --devel --versions | sed -n '1!p' | head -1 | cut -f2 | tr -d '[:space:]')
    elif [ "${RANCHER_HELM_REPO}" = "rancher-alpha" ]; then
      RANCHER_VERSION=$(helm search repo rancher-alpha --devel --versions | grep "^rancher-alpha/rancher[[:space:]]" | grep "${version_string}" | grep -- "-alpha" | awk '{print $2}' | sort -V | tail -1 | tr -d '[:space:]')
    elif [ "${RANCHER_HELM_REPO}" = "rancher-latest" ]; then
      RANCHER_VERSION=$(helm search repo rancher-latest --devel --versions | grep "^rancher-latest/rancher[[:space:]]" | grep "${version_string}" | grep -- "-rc" | awk '{print $2}' | sort -V | tail -1 | tr -d '[:space:]')
    else
      RANCHER_VERSION=$(helm search repo "${HELM_REPO_NAME}" --devel --versions | grep "${version_string}" | awk '{print $2}' | sort -V | tail -1 | tr -d '[:space:]')
    fi
    if [ -z "${RANCHER_VERSION}" ]; then
      echo "ERROR: Could not find Rancher version for ${RANCHER_IMAGE_TAG} in ${HELM_REPO_NAME} repo."
      exit 1
    fi
  fi

  if [ "${RANCHER_HELM_REPO}" = "rancher-prime" ] || \
     [ "${RANCHER_HELM_REPO}" = "rancher-latest" ] || \
     [ "${RANCHER_HELM_REPO}" = "rancher-alpha" ]; then
    RANCHER_IMAGE_TAG_FOR_CORRAL="v${RANCHER_VERSION}"
    clean_corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG_FOR_CORRAL}"
    if [[ "${RANCHER_HELM_REPO}" == "rancher-alpha" ]] || [[ "${RANCHER_HELM_REPO}" == "rancher-latest" ]]; then
      clean_corral config vars set env_var_map '["CATTLE_AGENT_IMAGE|stgregistry.suse.com/rancher/rancher-agent:'${RANCHER_IMAGE_TAG_FOR_CORRAL}', RANCHER_VERSION_TYPE|prime"]'
    else
      clean_corral config vars set env_var_map '["CATTLE_AGENT_IMAGE|registry.suse.com/rancher/rancher-agent:'${RANCHER_IMAGE_TAG_FOR_CORRAL}', RANCHER_VERSION_TYPE|prime"]'
    fi
  else
    clean_corral config vars set rancher_image_tag "${RANCHER_IMAGE_TAG}"
  fi
}

# ============================================================================
# Prepare corral packages and shared configuration for cluster provisioning
# ============================================================================
prepare_corral_packages() {
  cd "${WORKSPACE}/corral-packages"

  if [[ -n "${RANCHER_VERSION}" ]]; then
    yq -i e ".variables.rancher_version += [\"${RANCHER_VERSION}\"] | .variables.rancher_version style=\"literal\"" packages/aws/rancher-k3s.yaml
    yq -i e ".variables.kubernetes_version += [\"${K3S_KUBERNETES_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/rancher-k3s.yaml
    yq -i e ".variables.cert_manager_version += [\"${CERT_MANAGER_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/rancher-k3s.yaml
  fi

  echo $'manifest:\n  name: custom-node\ndescription: custom generated node\ntemplates:\n  - aws/nodes\nvariables:\n  instance_type:\n    - t3a.xlarge' > packages/aws/custom-node.yaml

  yq -i e ".variables.kubernetes_version += [\"${K3S_KUBERNETES_VERSION}\"] | .variables.kubernetes_version style=\"literal\"" packages/aws/k3s.yaml

  clean_corral config vars set bootstrap_password "${BOOTSTRAP_PASSWORD:-password}"
  clean_corral config vars set aws_route53_zone "${AWS_ROUTE53_ZONE}"
  clean_corral config vars set server_count "${SERVER_COUNT:-3}"
  clean_corral config vars set agent_count "${AGENT_COUNT:-0}"
  clean_corral config vars delete rancher_host
  if [[ "${JOB_TYPE}" == "recurring" ]]; then
    RANCHER_HOST="jenkins-${prefix_random}.${AWS_ROUTE53_ZONE}"
  fi

  K3S_KUBERNETES_VERSION="${K3S_KUBERNETES_VERSION//+/-}"
  make -s init > /dev/null 2>&1
  make -s build > /dev/null 2>&1
}

# ============================================================================
# Create test infrastructure: custom node and import cluster
# ============================================================================
create_test_clusters() {
  clean_corral config vars set node_count 1
  clean_corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-c"
  clean_corral config vars delete instance_type
  clean_corral config vars set bastion_ip ""

  clean_corral create --skip-cleanup --recreate --debug customnode "dist/aws-t3a.xlarge"
  clean_corral config vars set custom_node_ip "$(clean_corral vars customnode first_node_ip)"
  clean_corral config vars set custom_node_key "$(clean_corral vars customnode corral_private_key | base64 -w 0)"

  clean_corral config vars set instance_type "${AWS_INSTANCE_TYPE}"
  clean_corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-i"
  clean_corral config vars set server_count 1
  clean_corral create --skip-cleanup --recreate --debug importcluster "dist/aws-k3s-${K3S_KUBERNETES_VERSION}"
  clean_corral config vars set imported_kubeconfig $(clean_corral vars importcluster kubeconfig)
}

# ============================================================================
# Create Rancher server
# ============================================================================
create_rancher_server() {
  clean_corral config vars set instance_type "${AWS_INSTANCE_TYPE}"
  clean_corral config vars set aws_hostname_prefix "jenkins-${prefix_random}"
  clean_corral config vars set server_count "${SERVER_COUNT:-3}"
  clean_corral create --skip-cleanup --recreate --debug rancher "dist/aws-k3s-rancher-${K3S_KUBERNETES_VERSION}-${RANCHER_VERSION//v}-${CERT_MANAGER_VERSION}"
}

# ============================================================================
# Orchestration: provision infrastructure based on JOB_TYPE
# ============================================================================
if [[ "${JOB_TYPE}" == "recurring" ]]; then
  RANCHER_TYPE="recurring"
  configure_rancher_helm
  prepare_corral_packages
  create_rancher_server

  shopt -s nocasematch
  if [[ "${CREATE_INITIAL_CLUSTERS}" != "no" ]]; then
    create_test_clusters
  fi
  shopt -u nocasematch
fi

if [[ "${JOB_TYPE}" == "existing" ]]; then
  RANCHER_TYPE="existing"
  shopt -s nocasematch
  if [[ "${CREATE_INITIAL_CLUSTERS}" == "yes" ]]; then
    prepare_corral_packages
    create_test_clusters
  fi
  shopt -u nocasematch
fi

if semver lt "${RANCHER_VERSION}" "2.14.0" > /dev/null && [[ "${RANCHER_IMAGE_TAG}" != "head" ]]; then NODEJS_VERSION="22.14.0"; fi

clean_corral config vars set rancher_type "${RANCHER_TYPE}"
clean_corral config vars set nodejs_version "${NODEJS_VERSION}"
clean_corral config vars set dashboard_repo "${DASHBOARD_REPO}"
clean_corral config vars set dashboard_branch "${DASHBOARD_BRANCH}"

if [[ -n "${CYPRESS_TAGS}" ]]; then
  if [[ "${CYPRESS_TAGS}" =~ "@bypass" ]]; then
    echo "Bypassing automatic tag additions..."
    CYPRESS_TAGS=$(clean_tags "${CYPRESS_TAGS}")
  else
    # Automatically exclude @noPrime tests on Prime/Alpha/Latest environments
    if [[ "${RANCHER_HELM_REPO}" == "rancher-prime" || "${RANCHER_HELM_REPO}" == "rancher-latest" || "${RANCHER_HELM_REPO}" == "rancher-alpha" ]]; then
      if [[ ! "${CYPRESS_TAGS}" =~ "@noPrime" ]]; then
        CYPRESS_TAGS="${CYPRESS_TAGS}+-@noPrime"
      fi
    # Automatically exclude @prime tests on Community environments
    else
      if [[ ! "${CYPRESS_TAGS}" =~ "@prime" ]]; then
        CYPRESS_TAGS="${CYPRESS_TAGS}+-@prime"
      fi
    fi
    # Always exclude @noVai unless explicitly requested
    if [[ ! "${CYPRESS_TAGS}" =~ "@noVai" ]]; then
      CYPRESS_TAGS="${CYPRESS_TAGS}+-@noVai"
    fi
  fi
  # Normalize tags for storage (handle spaces, etc.)
  CYPRESS_TAGS=$(clean_tags "${CYPRESS_TAGS}")
fi
clean_corral config vars set cypress_tags "${CYPRESS_TAGS}"

cat > "${WORKSPACE}/notification_values.txt" << EOF
RANCHER_VERSION=${RANCHER_VERSION}
RANCHER_IMAGE_TAG=${RANCHER_IMAGE_TAG_FOR_CORRAL:-${RANCHER_IMAGE_TAG}}
RANCHER_CHART_URL=${RANCHER_CHART_URL}
RANCHER_HELM_REPO=${RANCHER_HELM_REPO}
HELM_REPO_NAME=${HELM_REPO_NAME:-}
CYPRESS_TAGS=${CYPRESS_TAGS}
EOF
clean_corral config vars set cypress_version "${CYPRESS_VERSION}"
clean_corral config vars set yarn_version "${YARN_VERSION}"
clean_corral config vars set kubectl_version "${KUBECTL_VERSION}"

if [[ -n "${RANCHER_USERNAME}" ]]; then
   clean_corral config vars set rancher_username "${RANCHER_USERNAME}"
fi

if [[ -n "${RANCHER_PASSWORD}" ]]; then
   clean_corral config vars set rancher_password "${RANCHER_PASSWORD}"
fi

if [[ -n "${RANCHER_HOST}" ]]; then
   clean_corral config vars set rancher_host "${RANCHER_HOST}"
fi

if [[ -n "${CHROME_VERSION}" ]]; then
   clean_corral config vars set chrome_version "${CHROME_VERSION}"
fi

cd "${WORKSPACE}/corral-packages"
echo "Building corral packages..."
make -s init > /dev/null 2>&1
make -s build > /dev/null 2>&1
chmod -R 766 "${WORKSPACE}/corral-packages"
clean_corral config vars set node_count 1
clean_corral config vars set bastion_ip ""
clean_corral config vars delete instance_type
clean_corral config vars set aws_hostname_prefix "jenkins-${prefix_random}-ci"
echo "Provisioning CI infrastructure..."
clean_corral create --skip-cleanup --recreate --debug ci dist/aws-dashboard-tests-t3a.xlarge
cd "${WORKSPACE}"

CYPRESS_COMPLETED=$(corral vars ci cypress_completed || echo "failed")
CYPRESS_EXIT_CODE=$(corral vars ci cypress_exit_code || echo "1")

if [[ ! "${CYPRESS_EXIT_CODE}" =~ ^[0-9]+$ ]] || [ "${CYPRESS_EXIT_CODE}" = "<nil>" ]; then
  CYPRESS_EXIT_CODE=1
fi

if [ "${CYPRESS_COMPLETED}" != "completed" ] || [ "${CYPRESS_COMPLETED}" = "<nil>" ]; then
  echo "ERROR: Cypress tests failed or did not complete. Exit code: ${CYPRESS_EXIT_CODE}."
  exit "${CYPRESS_EXIT_CODE}"
fi

echo "Setup finished successfully."
