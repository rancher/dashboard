#!/bin/bash

set -x
set -e

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
NODEJS_VERSION="${NODEJS_VERSION:-v14.19.1}"

mkdir -p "${WORKSPACE}/bin"

if [ -f "${CORRAL}" ]; then rm "${CORRAL}"; fi
curl -L -o "${CORRAL}" "${CORRAL_DOWNLOAD_BIN}"
chmod +x "${CORRAL}"

curl -L -o "${GO_PKG_FILENAME}" "${GO_DL_PACKAGE}"
tar -C "${WORKSPACE}" -xzf "${GO_PKG_FILENAME}"

ls -al "${WORKSPACE}"
export PATH=$PATH:"${WORKSPACE}/go/bin:${WORKSPACE}/bin"

go version

if [[ ! -d "${WORKSPACE}/.ssh" ]]; then mkdir -p "${WORKSPACE}/.ssh"; fi
export PRIV_KEY="${WORKSPACE}/.ssh/jenkins_ecdsa"
if [ -f "${PRIV_KEY}" ]; then rm "${PRIV_KEY}"; fi
ssh-keygen -t ecdsa -b 521 -N "" -f "${PRIV_KEY}"

corral config --public_key "${WORKSPACE}/.ssh/jenkins_ecdsa.pub" --user_id jenkins
corral config vars set corral_user_public_key "$(cat ${WORKSPACE}/.ssh/jenkins_ecdsa.pub)"
corral config vars set corral_user_id jenkins
corral config vars set aws_ssh_user ${AWS_SSH_USER}
corral config vars set aws_access_key ${AWS_ACCESS_KEY_ID}
corral config vars set aws_secret_key ${AWS_SECRET_ACCESS_KEY}
corral config vars set aws_ami ${AWS_AMI}
corral config vars set aws_region ${AWS_REGION}
corral config vars set aws_security_group ${AWS_SECURITY_GROUP}
corral config vars set aws_subnet ${AWS_SUBNET}
corral config vars set aws_vpc ${AWS_VPC}
corral config vars set volume_type ${AWS_VOLUME_TYPE}
corral config vars set volume_iops ${AWS_VOLUME_IOPS}
corral config vars set rancher_type ${RANCHER_TYPE}
corral config vars set nodejs_version ${NODEJS_VERSION}
corral config vars set dashboard_repo ${DASHBOARD_REPO}
corral config vars set dashboard_branch ${DASHBOARD_BRANCH}
corral config vars set cypress_tags ${CYPRESS_TAGS}

if [[ -n "${RANCHER_USERNAME}" ]]; then
   corral config vars set rancher_username ${RANCHER_USERNAME}
fi

if [[ -n "${RANCHER_PASSWORD}" ]]; then
   corral config vars set rancher_password ${RANCHER_PASSWORD}
fi

if [[ -n "${RANCHER_HOST}" ]]; then
   corral config vars set rancher_host ${RANCHER_HOST}
fi

if [[ -n "${CYPRESS_DOCKER_BRANCH}" ]]; then
   corral config vars set cypress_docker_branch ${CYPRESS_DOCKER_BRANCH}
fi

cd "${WORKSPACE}/corral-packages"
make init
make build
echo "${PWD}"
chmod -R 766 "${WORKSPACE}/corral-packages"
corral create --skip-cleanup --recreate --debug ci dist/aws-dashboard-tests-t3a.xlarge
corral config vars -o yaml
NODE_EXTERNAL_IP="$(corral vars ci single_ip)"
cd ${WORKSPACE}
echo "${PWD}"
