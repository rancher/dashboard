// Copyright (c) 2022, Oracle and/or its affiliates.
// Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

// Added by Verrazzano

pipeline {
    agent {
       docker {
            image "${RUNNER_DOCKER_IMAGE_1_3}"
            args "${RUNNER_DOCKER_ARGS_1_3}"
            registryUrl "${RUNNER_DOCKER_REGISTRY_URL}"
            registryCredentialsId 'ocir-pull-and-push-account'
        }
    }

    parameters {
        string (name: 'RANCHER_UPSTREAM_VERSION',
                defaultValue: '2.6.8',
                description: 'Verrazzano Rancher upstream version to build, default 2.6.8',
                trim: true)

        booleanParam (name: 'TRIGGER_UPSTREAM', defaultValue: false,
                description: 'Trigger the build for Verrazzano Rancher, similar to nightly build.')
    }

    environment {
        DASHBOARD_VERSION = "2.6.8"
        OCI_CLI_AUTH = "instance_principal"
        OCI_OS_NAMESPACE = credentials('oci-os-namespace')
        OCI_OS_BUCKET = "verrazzano-builds"
        GITHUB_ACCESS_TOKEN = credentials('github-api-token-release-process')
    }

    stages {
        stage('set version') {
            steps {
                script {
                    env.VERSION = get_artifact_version()
                    env.GIT_TAG =  "rancher-dashboard-" + "${env.VERSION}"
                    env.DRONE_TAG = "${env.GIT_TAG}"
                    env.TAR_FILE_NAME = "${env.DRONE_TAG}" + ".tar.gz"
                }
            }
        }

        stage('build') {
            steps {
                sh """
                    ./scripts/build-embedded
                """
            }
        }

        stage('publish') {
            steps {
                sh """
                    oci --region us-phoenix-1 os object put --force --namespace ${OCI_OS_NAMESPACE} -bn ${OCI_OS_BUCKET} --name  rancher-dashboard/${env.TAR_FILE_NAME} --file dist/${env.TAR_FILE_NAME}
                """
            }
        }

         stage('release') {
            when {
                allOf {
                    branch "oracle/release/*"
                    buildingTag()
                }
            }
            steps {
                sh """
                    echo "${env.GITHUB_ACCESS_TOKEN}" | gh auth login --with-token
                    gh release upload ${TAG_NAME} dist/${env.TAR_FILE_NAME} --clobber --repo https://github.com/verrazzano/rancher-dashboard
                """
            }
        }

        stage('Call Downstream Job') {
            when {
                // Trigger upstream build WHEN new changes for Rancher Dashboard are committed to the release branch, OR the user demands it
                anyOf {
                    allOf {
                        branch 'oracle/release/2.6.8'
                        expression {
                            currentBuild.changeSets.size() > 0
                        }
                    }
                    expression { return params.TRIGGER_UPSTREAM }
                }
            }
            steps {
                archiveArtifacts artifacts: "dist/${env.TAR_FILE_NAME}"

                build job: "Build from Source/rancher/oracle%2Frelease%2F${params.RANCHER_UPSTREAM_VERSION}",
                    propagate: false,
                    wait: false,
                    parameters: [
                        string(name: "CATTLE_DASHBOARD_TAR_URL", value: "${OCI_OS_BUILD_URL}/rancher-dashboard%2F${env.TAR_FILE_NAME}")
                    ]
            }
        }
    }
}

def get_artifact_version() {
    def time_stamp = sh(returnStdout: true, script: "date +%Y%m%d%H%M%S").trim()
    def short_commit_sha = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
    def version_prefix

    if (env.TAG_NAME?.trim()) {
        version_prefix = "${env.TAG_NAME}"
    } else if (env.BRANCH_NAME.startsWith("oracle/release/${DASHBOARD_VERSION}")) {
        version_prefix = "v" + "${DASHBOARD_VERSION}"
    } else {
        version_prefix = env.BRANCH_NAME.replaceAll("/","_")
    }

    dashboard_version = [version_prefix, time_stamp, short_commit_sha].join("-")
    println("dashboard version: " + dashboard_version)
    return dashboard_version
}
