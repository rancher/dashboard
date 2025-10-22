import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import { CreateUserParams, CreateAmazonRke2ClusterParams, CreateAmazonRke2ClusterWithoutMachineConfigParams } from '@/cypress/globals';
import { groupByPayload } from '@/cypress/e2e/blueprints/user_preferences/group_by';
import { CypressChainable } from '~/cypress/e2e/po/po.types';
import { MEDIUM_API_DELAY } from '~/cypress/support/utils/api-endpoints';

// This file contains commands which makes API requests to the rancher API.
// It includes the `login` command to store the `token` to use

let token: any;

/**
 * Login local authentication, including first login and bootstrap if not cached
 */
Cypress.Commands.add('login', (
  username = Cypress.env('username'),
  password = Cypress.env('password'),
  cacheSession = true,
  skipNavigation = false,
  acceptConfirmation = '', // Use when we expect the confirmation dialog to be present (expected button text)
) => {
  const login = () => {
    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    if (!skipNavigation) {
      LoginPagePo.goTo(); // Needs to happen before the page element is created/located
    }
    const loginPage = new LoginPagePo();

    loginPage
      .checkIsCurrentPage(!skipNavigation);

    if (!!acceptConfirmation) {
      loginPage.confirmationAcceptButton().shouldContainText(acceptConfirmation);
      loginPage.confirmationAcceptButton().self().click();
    }

    loginPage.switchToLocal();

    loginPage.canSubmit()
      .should('eq', true);

    loginPage.username()
      .set(username);

    loginPage.password()
      .set(password);

    loginPage.canSubmit()
      .should('eq', true);
    loginPage.submit();

    cy.wait('@loginReq').its('request.body')
      .should(
        'deep.equal',
        {
          username,
          password,
          description:  'UI session',
          responseType: 'cookie'
        }
      );
  };

  if (cacheSession) {
    (cy as any).session([username, password], login);
    cy.getCookie('CSRF').then((c) => {
      token = c;
    });
  } else {
    login();
  }
});

/**
 * Create user via api request
 */
Cypress.Commands.add('createUser', (params: CreateUserParams, options = { }) => {
  const {
    username, globalRole, clusterRole, projectRole, password
  } = params;

  return cy.createE2EResourceName(username, options?.createNameOptions)
    .then((e2eName) => {
      return cy.request({
        method:           'POST',
        url:              `${ Cypress.env('api') }/v3/users`,
        failOnStatusCode: false,
        headers:          {
          'x-api-csrf': token.value,
          Accept:       'application/json'
        },
        body: {
          type:               'user',
          enabled:            true,
          mustChangePassword: false,
          username:           e2eName,
          password:           password || Cypress.env('password')
        }
      });
    })
    .then((resp) => {
      if (resp.status === 422 && resp.body.message === 'Username is already in use.') {
        cy.log('User already exists. Skipping user creation');

        return '';
      } else {
        expect(resp.status).to.eq(201);

        const userPrincipalId = resp.body.principalIds[0];

        if (globalRole) {
          return cy.setGlobalRoleBinding(resp.body.id, globalRole.role)
            .then(() => {
              if (clusterRole) {
                const { clusterId, role } = clusterRole;

                return cy.setClusterRoleBinding(clusterId, userPrincipalId, role);
              }
            })
            .then(() => {
              if (projectRole) {
                const { clusterId, projectName, role } = projectRole;

                return cy.setProjectRoleBinding(clusterId, userPrincipalId, projectName, role);
              }
            })
            .then(() => {
              // return response of original user
              return resp;
            });
        }
      }
    });
});

/**
 * Set global role binding for user via api request
 */
Cypress.Commands.add('setGlobalRoleBinding', (userId, role) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v3/globalrolebindings`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      type:         'globalRoleBinding',
      globalRoleId: role,
      userId
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * Set cluster role binding for user via api request
 *
 */
Cypress.Commands.add('setClusterRoleBinding', (clusterId, userPrincipalId, role) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v3/clusterroletemplatebindings`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      type:           'clusterRoleTemplateBinding',
      clusterId,
      roleTemplateId: role,
      userPrincipalId
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * Set project role binding for user via api request
 *
 */
Cypress.Commands.add('setProjectRoleBinding', (clusterId, userPrincipalId, projectName, role) => {
  return cy.getProjectByName(clusterId, projectName)
    .then((project: any) => cy.request({
      method:  'POST',
      url:     `${ Cypress.env('api') }/v3/projectroletemplatebindings`,
      headers: {
        'x-api-csrf': token.value,
        Accept:       'application/json'
      },
      body: {
        type:           'projectroletemplatebinding',
        roleTemplateId: role,
        userPrincipalId,
        projectId:      project.id
      }
    }))
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * Get the project with the given name
 */
Cypress.Commands.add('getProjectByName', (clusterId, projectName) => {
  return cy.request({
    method:  'GET',
    url:     `${ Cypress.env('api') }/v3/projects?name=${ projectName }&clusterId=${ clusterId }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
  })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body?.data?.length).to.eq(1);

      return resp.body.data[0];
    });
});

/**
 * create a project
 */
Cypress.Commands.add('createProject', (projName, clusterId, userId) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v3/projects`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      type:                          'project',
      name:                          projName,
      annotations:                   {},
      labels:                        {},
      clusterId,
      creatorId:                     `${ clusterId }://${ userId }`,
      containerDefaultResourceLimit: {},
      resourceQuota:                 {},
      namespaceDefaultResourceQuota: {}
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * create a namespace in project
 */
Cypress.Commands.add('createNamespaceInProject', (nsName, projId) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v1/namespaces`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      metadata: {
        annotations: {
          'field.cattle.io/containerDefaultResourceLimit': '{}',
          'field.cattle.io/projectId':                     projId
        },
        labels: {
          'field.cattle.io/projectId':                  projId.split(':')[1],
          'pod-security.kubernetes.io/enforce':         'privileged',
          'pod-security.kubernetes.io/enforce-version': 'latest'
        },
        name: nsName
      },
      disableOpenApiValidation: false
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * create a namespace
 */
Cypress.Commands.add('createNamespace', (nsName) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v1/namespaces`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      type:     'namespace',
      metadata: {
        annotations: { 'field.cattle.io/containerDefaultResourceLimit': '{}' },
        name:        nsName
      },
      disableOpenApiValidation: false
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * Create pod
 */
Cypress.Commands.add('createPod', (nsName, podName, image, failOnStatusCode = true, options = { }) => {
  return cy.createE2EResourceName(podName, options?.createNameOptions)
    .then((e2eName) => {
      return cy.request({
        method:  'POST',
        url:     `${ Cypress.env('api') }/v1/pods`,
        headers: {
          'x-api-csrf': token.value,
          Accept:       'application/json'
        },
        failOnStatusCode,
        body: {
          type:     'pod',
          metadata: {
            namespace: nsName, labels: { 'workload.user.cattle.io/workloadselector': `${ e2eName }` }, name: `${ e2eName }`, annotations: {}
          },
          spec: {
            selector:   { matchLabels: { 'workload.user.cattle.io/workloadselector': `${ e2eName }` } },
            containers: [{
              imagePullPolicy: 'Always', name: 'container-0', _init: false, volumeMounts: [], env: [], envFrom: [], image: `${ image }`, __active: true
            }],
            initContainers:   [],
            imagePullSecrets: [],
            volumes:          [],
            affinity:         {}
          }
        }
      });
    })
    .then((resp) => {
      if (failOnStatusCode) {
        expect(resp.status).to.eq(201);
      }

      return resp;
    });
});

/**
 * create aws cloud credentials
 */
Cypress.Commands.add('createAwsCloudCredentials', (nsName, cloudCredName, defaultRegion, accessKey, secretKey) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v3/cloudcredentials`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      type:                      'provisioning.cattle.io/cloud-credential',
      metadata:                  { generateName: 'cc-', namespace: `${ nsName }` },
      _name:                     `${ cloudCredName }`,
      annotations:               { 'provisioning.cattle.io/driver': 'aws' },
      amazonec2credentialConfig: {
        defaultRegion: `${ defaultRegion }`, accessKey: `${ accessKey }`, secretKey: `${ secretKey }`
      },
      _type: 'provisioning.cattle.io/cloud-credential',
      name:  `${ cloudCredName }`
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

/**
 * Override user preferences to default values, allowing to pass custom preferences for a deterministic scenario
 */
// eslint-disable-next-line no-undef
Cypress.Commands.add('userPreferences', (preferences: Partial<UserPreferences> = {}) => {
  return cy.intercept('/v1/userpreferences*', (req) => {
    req.reply({
      statusCode: 201,
      body:       {
        data: [{
          type: 'userpreference',
          data: {
            'after-login-route': '\"home\"',
            cluster:             'local',
            'group-by':          'none',
            'home-page-cards':   '',
            'last-namespace':    'default',
            'last-visited':      '',
            'ns-by-cluster':     '',
            provisioner:         '',
            'read-whatsnew':     '',
            'seen-whatsnew':     '2.x.x',
            theme:               '',
            ...preferences,
          },
        }]
      },
    });
  });
});

Cypress.Commands.add('requestBase64Image', (url: string) => {
  return cy.request({
    url,
    method:   'GET',
    encoding: 'binary',
    headers:  { Accept: 'image/png; charset=UTF-8' },
  })
    .its('body')
    .then((favicon) => {
      const blob = Cypress.Blob.binaryStringToBlob(favicon);

      return Cypress.Blob.blobToBase64String(blob);
    });
});

/**
 * Get a v3 / v1 resource
 * url is constructed based if resourceId is supplied or not
 */

Cypress.Commands.add('getRancherResource', (prefix, resourceType, resourceId?, expectedStatusCode = 200) => {
  let url = `${ Cypress.env('api') }/${ prefix }/${ resourceType }`;

  if (resourceId) {
    url += `/${ resourceId }`;
  }

  return cy.request({
    method:  'GET',
    url,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
  })
    .then((resp) => {
      if (expectedStatusCode) {
        expect(resp.status).to.eq(expectedStatusCode);
      }

      return resp;
    });
});

/**
 * set a v3 / v1 resource
 */
Cypress.Commands.add('setRancherResource', (prefix, resourceType, resourceId, body) => {
  return cy.request({
    method:  'PUT',
    url:     `${ Cypress.env('api') }/${ prefix }/${ resourceType }/${ resourceId }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body
  })
    .then((resp) => {
      expect(resp.status).to.eq(200);

      return resp;
    });
});

/**
 * delete a v3 / v1 resource
 */
Cypress.Commands.add('deleteRancherResource', (prefix, resourceType, resourceId, failOnStatusCode = true) => {
  return cy.request({
    method:  'DELETE',
    url:     `${ Cypress.env('api') }/${ prefix }/${ resourceType }/${ resourceId }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    failOnStatusCode,
  })
    .then((resp) => {
      if (failOnStatusCode) {
        expect(resp.status).to.be.oneOf([200, 204]);
      }
    });
});

/**
 * create a v3 / v1 resource
 */
Cypress.Commands.add('createRancherResource', (prefix, resourceType, body, failOnStatusCode = true) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/${ prefix }/${ resourceType }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body,
    failOnStatusCode
  })
    .then((resp) => {
      if (failOnStatusCode) {
      // Expect 200 or 201, Created HTTP status code
        expect(resp.status).to.be.oneOf([200, 201]);
      }
    });
});

Cypress.Commands.add('waitForRancherResource', (prefix, resourceType, resourceId, testFn, retries = 20, config) => {
  const url = `${ Cypress.env('api') }/${ prefix }/${ resourceType }/${ resourceId }`;

  const retry = () => {
    cy.request({
      method:  'GET',
      url,
      headers: {
        'x-api-csrf': token.value,
        Accept:       'application/json'
      },
      failOnStatusCode: config?.failOnStatusCode === undefined ? true : !!config?.failOnStatusCode,
    })
      .then((resp) => {
        if (!testFn(resp)) {
          retries = retries - 1;
          if (retries === 0) {
            cy.log(`waitForRancherResource: Failed to wait for updated state for ${ url }`);

            return Promise.resolve(false);
          }
          cy.wait(1500); // eslint-disable-line cypress/no-unnecessary-waiting

          return retry();
        }

        return Promise.resolve(true);
      });
  };

  return retry();
});

Cypress.Commands.add('waitForRancherResources', (prefix, resourceType, expectedResourcesTotal, greaterThan = undefined) => {
  const url = `${ Cypress.env('api') }/${ prefix }/${ resourceType }`;
  let retries = 20;

  const retry = () => {
    cy.request({
      method:  'GET',
      url,
      headers: {
        'x-api-csrf': token.value,
        Accept:       'application/json'
      },
    })
      .then((resp) => {
        if (greaterThan) {
          if (resp.body.count > expectedResourcesTotal) {
            return resp;
          }
        } else if (resp.body.count === expectedResourcesTotal) {
          return resp;
        }

        retries = retries - 1;
        if (retries === 0) return resp;
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
        retry();
      });
  };

  return retry();
});

/**
 * Wait for repository to be downloaded and ready
 */
Cypress.Commands.add('waitForRepositoryDownload', (prefix, resourceType, resourceId, retries = 20) => {
  return cy.waitForRancherResource(prefix, resourceType, resourceId, (resp) => {
    const conditions = resp.body.status?.conditions || [];

    return conditions.some((condition) => condition.type === 'Downloaded' && condition.status === 'True'
    );
  }, retries);
});

/**
 * Wait for repository to be state
 */
Cypress.Commands.add('waitForResourceState', (prefix, resourceType, resourceId, resourceState = 'active', retries = 20) => {
  return cy.waitForRancherResource(prefix, resourceType, resourceId, (resp) => {
    const state = resp.body.metadata?.state;

    return state && state.transitioning === false && state.name === resourceState;
  }, retries);
});

/**
 * delete a node template
 */
Cypress.Commands.add('deleteNodeTemplate', (nodeTemplateId, timeout = 30000, failOnStatusCode = false) => {
  let retries = 10;

  const retry = () => {
    cy.request({
      method:  'DELETE',
      url:     `${ Cypress.env('api') }/v3/nodetemplate/${ nodeTemplateId }`,
      failOnStatusCode,
      headers: {
        'x-api-csrf': token.value,
        Accept:       'application/json'
      },
    }).then((resp) => {
      if (resp.status === 200 || resp.status === 204) return resp;
      else {
        cy.log(`error message: ${ resp.body.message }. Lets retry node deletion after ${ timeout } milliseconds`);
        cy.wait(timeout); // eslint-disable-next-line cypress/no-unnecessary-waiting

        retries = retries - 1;
        if (retries === 0) return resp;
        retry();
      }
    });
  };

  return retry();
});

/**
 * Create RKE2 cluster with Amazon EC2 cloud provider
 */
Cypress.Commands.add('createAmazonRke2Cluster', (params: CreateAmazonRke2ClusterParams) => {
  const {
    machineConfig, rke2ClusterAmazon, cloudCredentialsAmazon, metadata
  } = params;

  return cy.createAwsCloudCredentials(cloudCredentialsAmazon.workspace, cloudCredentialsAmazon.name, cloudCredentialsAmazon.region, cloudCredentialsAmazon.accessKey, cloudCredentialsAmazon.secretKey)
    .then((resp: Cypress.Response<any>) => {
      const cloudCredentialId = resp.body.id;

      return cy.createAmazonMachineConfig(
        machineConfig.instanceType, machineConfig.region, machineConfig.vpcId, machineConfig.zone, machineConfig.type, machineConfig.clusterName, machineConfig.namespace)
        .then((resp: Cypress.Response<any>) => {
          const machineConfigId = resp.body.id.split('/');

          return cy.request({
            method:           'POST',
            url:              `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters`,
            failOnStatusCode: true,
            headers:          {
              'x-api-csrf': token.value,
              Accept:       'application/json'
            },
            body: {
              type:     'provisioning.cattle.io.cluster',
              metadata: {
                namespace:   rke2ClusterAmazon.namespace,
                annotations: {
                  'field.cattle.io/description': `${ rke2ClusterAmazon.clusterName }-description`,
                  ...(metadata?.annotations || {}),
                },
                labels: metadata?.labels || {},
                name:   rke2ClusterAmazon.clusterName
              },
              spec: {
                rkeConfig: {
                  chartValues:     { 'rke2-calico': {} },
                  upgradeStrategy: {
                    controlPlaneConcurrency:  '1',
                    controlPlaneDrainOptions: {
                      deleteEmptyDirData:              true,
                      disableEviction:                 false,
                      enabled:                         false,
                      force:                           false,
                      gracePeriod:                     -1,
                      ignoreDaemonSets:                true,
                      skipWaitForDeleteTimeoutSeconds: 0,
                      timeout:                         120
                    },
                    workerConcurrency:  '1',
                    workerDrainOptions: {
                      deleteEmptyDirData:              true,
                      disableEviction:                 false,
                      enabled:                         false,
                      force:                           false,
                      gracePeriod:                     -1,
                      ignoreDaemonSets:                true,
                      skipWaitForDeleteTimeoutSeconds: 0,
                      timeout:                         120
                    }
                  },
                  dataDirectories: {
                    systemAgent:  '',
                    provisioning: '',
                    k8sDistro:    ''
                  },
                  machineGlobalConfig: {
                    cni:                   'calico',
                    'disable-kube-proxy':  false,
                    'etcd-expose-metrics': false
                  },
                  machineSelectorConfig: [
                    { config: { 'protect-kernel-defaults': false } }
                  ],
                  etcd: {
                    disableSnapshots:     false,
                    s3:                   null,
                    snapshotRetention:    5,
                    snapshotScheduleCron: '0 */5 * * *'
                  },
                  registries: {
                    configs: {},
                    mirrors: {}
                  },
                  machinePools: [
                    {
                      name:                 'pool1',
                      etcdRole:             true,
                      controlPlaneRole:     true,
                      workerRole:           true,
                      hostnamePrefix:       '',
                      labels:               {},
                      quantity:             3,
                      unhealthyNodeTimeout: '0m',
                      machineConfigRef:     {
                        kind: 'Amazonec2Config',
                        name: machineConfigId[1]
                      },
                      drainBeforeDelete: true
                    }
                  ]
                },
                machineSelectorConfig: [
                  { config: {} }
                ],
                kubernetesVersion:                                    'v1.29.4+rke2r1',
                defaultPodSecurityAdmissionConfigurationTemplateName: '',
                cloudCredentialSecretName:                            cloudCredentialId,
                localClusterAuthEndpoint:                             {
                  enabled: false,
                  caCerts: '',
                  fqdn:    ''
                }
              }
            }
          })
            .then((resp: Cypress.Response<any>) => {
              expect(resp.status).to.eq(201);
            });
        });
    });
});

/**
 * Create RKE2 cluster with Amazon EC2 cloud provider without machine config
 */
Cypress.Commands.add('createAmazonRke2ClusterWithoutMachineConfig', (params: CreateAmazonRke2ClusterWithoutMachineConfigParams) => {
  const { rke2ClusterAmazon, cloudCredentialsAmazon } = params;

  return cy.createAwsCloudCredentials(cloudCredentialsAmazon.workspace, cloudCredentialsAmazon.name, cloudCredentialsAmazon.region, cloudCredentialsAmazon.accessKey, cloudCredentialsAmazon.secretKey)
    .then((resp: Cypress.Response<any>) => {
      const cloudCredentialId = resp.body.id;

      return cy.request({
        method:           'POST',
        url:              `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters`,
        failOnStatusCode: true,
        headers:          {
          'x-api-csrf': token.value,
          Accept:       'application/json'
        },
        body: {
          type:     'provisioning.cattle.io.cluster',
          metadata: {
            namespace:   rke2ClusterAmazon.namespace,
            annotations: { 'field.cattle.io/description': `${ rke2ClusterAmazon.clusterName }-description` },
            name:        rke2ClusterAmazon.clusterName
          },
          spec: {
            rkeConfig: {
              chartValues:     { 'rke2-calico': {} },
              upgradeStrategy: {
                controlPlaneConcurrency:  '1',
                controlPlaneDrainOptions: {
                  deleteEmptyDirData:              true,
                  disableEviction:                 false,
                  enabled:                         false,
                  force:                           false,
                  gracePeriod:                     -1,
                  ignoreDaemonSets:                true,
                  skipWaitForDeleteTimeoutSeconds: 0,
                  timeout:                         120
                },
                workerConcurrency:  '1',
                workerDrainOptions: {
                  deleteEmptyDirData:              true,
                  disableEviction:                 false,
                  enabled:                         false,
                  force:                           false,
                  gracePeriod:                     -1,
                  ignoreDaemonSets:                true,
                  skipWaitForDeleteTimeoutSeconds: 0,
                  timeout:                         120
                }
              },
              dataDirectories: {
                systemAgent:  '',
                provisioning: '',
                k8sDistro:    ''
              },
              machineGlobalConfig: {
                cni:                   'calico',
                'disable-kube-proxy':  false,
                'etcd-expose-metrics': false
              },
              machineSelectorConfig: [
                { config: { 'protect-kernel-defaults': false } }
              ],
              etcd: {
                disableSnapshots:     false,
                s3:                   null,
                snapshotRetention:    5,
                snapshotScheduleCron: '0 */5 * * *'
              },
              registries: {
                configs: {},
                mirrors: {}
              },
              machinePools: [
                {
                  name:                 'pool1',
                  etcdRole:             true,
                  controlPlaneRole:     true,
                  workerRole:           true,
                  hostnamePrefix:       '',
                  labels:               {},
                  quantity:             3,
                  unhealthyNodeTimeout: '0m',
                  machineConfigRef:     {},
                  drainBeforeDelete:    true
                }
              ]
            },
            machineSelectorConfig: [
              { config: {} }
            ],
            kubernetesVersion:                                    'v1.29.4+rke2r1',
            defaultPodSecurityAdmissionConfigurationTemplateName: '',
            cloudCredentialSecretName:                            cloudCredentialId,
            localClusterAuthEndpoint:                             {
              enabled: false,
              caCerts: '',
              fqdn:    ''
            }
          }
        }
      })
        .then((resp: Cypress.Response<any>) => {
          expect(resp.status).to.eq(201);
        });
    });
});

/**
 * Create Amazon Machine config
 */
Cypress.Commands.add('createAmazonMachineConfig', (instanceType, region, vpcId, zone, type, clusterName, namespace) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v1/rke-machine-config.cattle.io.amazonec2configs/${ namespace }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    body: {
      instanceType,
      metadata: {
        annotations: {}, generateName: `nc-${ clusterName }-pool1-`, labels: {}, namespace
      },
      region,
      securityGroup:         ['rancher-nodes'],
      securityGroupReadonly: false,
      subnetId:              null,
      vpcId,
      zone,
      type
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(201);
    });
});

// update resource list view preference
Cypress.Commands.add('updateNamespaceFilter', (clusterName: string, groupBy:string, namespaceFilter: string, iteration = 0) => {
  return cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
    const userId = resp.body.data[0].id.trim();

    const payload = groupByPayload(userId, clusterName, groupBy, namespaceFilter);

    cy.log(`updateNamespaceFilter: /v1/userpreferences/${ userId }. Payload: ${ JSON.stringify(payload) }`);

    cy.setRancherResource('v1', 'userpreferences', userId, payload).then(() => {
      return cy.waitForRancherResource('v1', 'userpreferences', userId, (resp: any) => compare(resp?.body, payload), 5)
        .then((res) => {
          if (res) {
            cy.log(`updateNamespaceFilter: Success!`);
          } else {
            if (iteration < 3) {
              cy.log(`updateNamespaceFilter: Failed! Going to retry...`);

              return cy.updateNamespaceFilter(clusterName, groupBy, namespaceFilter, iteration + 1);
            }

            cy.log(`updateNamespaceFilter: Failed! Giving up...`);

            return Promise.reject(new Error('updateNamespaceFilter failed'));
          }
        });
    });
  });
});

const compare = (core, subset) => {
  const entries = Object.entries(subset);
  let result = true;

  for (let i = 0; i < entries.length; i++) {
    const [key, subsetValue] = entries[i];
    const coreValue = core[key];

    if (typeof subsetValue === 'object') {
      if (!compare(coreValue, subsetValue)) {
        cy.log(`Compare Failed: Key: "${ key }"`);

        result = false;
        break;
      }
    } else if (subsetValue !== coreValue) {
      cy.log(`Compare Failed: Key: "${ key }". Comparison "${ subsetValue }" !== "` + `${ coreValue }"`);

      result = false;
      break;
    }
  }

  if (!result) {
    cy.log(`Compare Failed: Result: Actual State ${ JSON.stringify(core) }`);
    cy.log(`Compare Failed: Result: Expected Sub-state ${ JSON.stringify(subset) }`);
  }

  return result;
};

/**
 * Create token (API Keys)
 */
Cypress.Commands.add('createToken', (description: string, ttl = 3600000, failOnStatusCode = true, clusterId?: string) => {
  return cy.request({
    method:  'POST',
    url:     `${ Cypress.env('api') }/v3/tokens`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    },
    failOnStatusCode,
    body: {
      type:     'token',
      metadata: {},
      description,
      clusterId,
      ttl
    }
  })
    .then((resp) => {
      if (failOnStatusCode) {
        expect(resp.status).to.eq(201);
      }

      return resp;
    });
});

/**
 * Create global role
 */
Cypress.Commands.add('createGlobalRole', (name, apiGroups: string[], resourceNames: string[], resources: string[], verbs: string[], newUserDefault = false, failOnStatusCode = true, options = { }) => {
  return cy.createE2EResourceName(name, options?.createNameOptions)
    .then((e2eName) => {
      return cy.request({
        method:  'POST',
        url:     `${ Cypress.env('api') }/v3/globalroles`,
        headers: {
          'x-api-csrf': token.value,
          Accept:       'application/json'
        },
        failOnStatusCode,
        body: {
          type:  'globalRole',
          name:  e2eName,
          rules: [{
            apiGroups,
            resourceNames,
            resources,
            verbs
          }],
          newUserDefault
        }
      });
    })
    .then((resp) => {
      if (failOnStatusCode) {
        expect(resp.status).to.eq(201);
      }

      return resp;
    });
});

/**
* Create fleet workspace
*/
Cypress.Commands.add('createFleetWorkspace', (name: string, description?: string, failOnStatusCode = true, options = { }) => {
  return cy.createE2EResourceName(name, options?.createNameOptions)
    .then((e2eName) => {
      return cy.request({
        method:  'POST',
        url:     `${ Cypress.env('api') }/v3/fleetworkspaces`,
        headers: {
          'x-api-csrf': token.value,
          Accept:       'application/json'
        },
        failOnStatusCode,
        body: {
          type:        'fleetworkspace',
          name:        e2eName,
          annotations: { 'field.cattle.io/description': description },
          labels:      {}
        }
      });
    })
    .then((resp) => {
      if (failOnStatusCode) {
        expect(resp.status).to.eq(201);
      }

      return resp;
    });
});

/**
 * Fetch the steve `revision` / timestamp of request
 */
Cypress.Commands.add('fetchRevision', () => {
  return cy.getRancherResource('v1', 'management.cattle.io.settings', undefined, 200)
    .then((res) => {
      return res.body.revision;
    });
});

/**
 * Check if the vai FF is enabled
 */
Cypress.Commands.add('isVaiCacheEnabled', () => {
  return cy.getRancherResource('v1', 'management.cattle.io.features', 'ui-sql-cache', 200)
    .then((res) => {
      // copy of shell/models/management.cattle.io.feature.js enabled

      if (res.body.status.lockedValue !== null) {
        return res.body.status.lockedValue;
      }

      return (res.body.spec.value !== null) ? res.body.spec.value : res.body.status.default;
    });
});

Cypress.Commands.add('tableRowsPerPageAndPreferences', (rows: number, preferences: { clusterName: string, groupBy: string, namespaceFilter: string, allNamespaces: string}, iteration = 0) => {
  const {
    clusterName, groupBy, namespaceFilter, allNamespaces
  } = preferences;

  return cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
    const userId = resp.body.data[0].id.trim();
    const payload = {
      id:   `${ userId }`,
      type: 'userpreference',
      data: {
        cluster:          clusterName,
        'per-page':       `${ rows }`,
        'group-by':       groupBy,
        'ns-by-cluster':  namespaceFilter,
        'all-namespaces': allNamespaces,
      }
    };

    cy.log(`tableRowsPerPageAndPreferences: /v1/userpreferences/${ userId }. Payload: ${ JSON.stringify(payload) }`);

    cy.setRancherResource('v1', 'userpreferences', userId, payload).then(() => {
      return cy.waitForRancherResource('v1', 'userpreferences', userId, (resp: any) => compare(resp?.body, payload))
        .then((res) => {
          if (res) {
            cy.log(`tableRowsPerPageAndPreferences: Success!`);
          } else {
            if (iteration < 3) {
              cy.log(`tableRowsPerPageAndPreferences: Failed! Going to retry...`);

              return cy.tableRowsPerPageAndPreferences(rows, preferences, iteration + 1);
            }

            cy.log(`tableRowsPerPageAndPreferences: Failed! Giving up...`);

            return Promise.reject(new Error('tableRowsPerPageAndPreferences failed'));
          }
        });
    });
  });
});

Cypress.Commands.add('tableRowsPerPageAndNamespaceFilter', (rows: number, clusterName: string, groupBy: string, namespaceFilter: string) => {
  return cy.tableRowsPerPageAndPreferences(rows, {
    clusterName, groupBy, namespaceFilter
  });
});

// Update the user preferences by over-writing the given preference
Cypress.Commands.add('setUserPreference', (prefs: any) => {
  return cy.getRancherResource('v1', 'userpreferences').then((resp: Cypress.Response<any>) => {
    const update = resp.body.data[0];

    update.data = {
      ...update.data,
      ...prefs
    };

    delete update.links;

    return cy.setRancherResource('v1', 'userpreferences', update.id, update);
  });
});

/**
 * Create a secret via api request
 */
Cypress.Commands.add('createSecret', (namespace: string, name: string, options: { type?: string; metadata?: any; data?: any } = {}) => {
  const defaultData = {
    'tls.crt': Buffer.from('MOCKCERT').toString('base64'),
    'tls.key': Buffer.from('MOCKPRIVATEKEY').toString('base64')
  };

  const body = {
    type:     options.type || 'kubernetes.io/tls',
    metadata: {
      namespace,
      name,
      ...(options.metadata || {})
    },
    data: options.data || defaultData
  };

  return cy.createRancherResource('v1', 'secrets', body).then((resp) => {
    return resp.body.metadata.name;
  });
});

/**
 * Create a configmap via api request
 */
Cypress.Commands.add('createConfigMap', (namespace: string, name: string, options: { metadata?: any; data?: any } = {}) => {
  const defaultData = { foo: 'bar' };

  const body = {
    metadata: {
      namespace,
      name,
      ...(options.metadata || {})
    },
    data: options.data || defaultData
  };

  return cy.createRancherResource('v1', 'configmaps', body).then((resp) => {
    return resp.body.metadata.name;
  });
});

/**
 * Create a service via api request
 */
Cypress.Commands.add('createService', (namespace: string, name: string, options: { type?: string; ports?: any[]; spec?: any; metadata?: any } = {}) => {
  const defaultSpec = {
    ports: options.ports || [{
      name:       'myport',
      port:       8080,
      protocol:   'TCP',
      targetPort: 80
    }],
    sessionAffinity: 'None',
    type:            options.type || 'ClusterIP'
  };

  const body = {
    type:     'service',
    metadata: {
      namespace,
      name,
      ...(options.metadata || {})
    },
    spec: options.spec || defaultSpec
  };

  return cy.createRancherResource('v1', 'services', body).then((resp) => {
    return resp.body.metadata.name;
  });
});

Cypress.Commands.add('createManyNamespacedResources', ({
  namespace, context, createResource, count = 22, wait = MEDIUM_API_DELAY
}: {
  /**
   * Used to create the namespace
   */
  context?: string,
  namespace?: string,
  createResource: ({ ns, i }) => CypressChainable
  count?: number,
  wait?: number,
}): Cypress.Chainable<{ ns: string, workloadNames: string[]}> => {
  const dynamicNs = namespace ? cy.wrap(namespace) : cy.createE2EResourceName(context).then((ns) => {
    // create namespace
    cy.createNamespace(ns);

    return cy.wrap(ns);
  });

  return dynamicNs
    .then((ns) => {
      // create workloads
      const workloadNames: string[] = [];

      cy.loopProcessWait({
        iterables: Array.from({ length: count }, () => 0),
        process:   ({ iteration }) => {
          return createResource({ ns, i: iteration }).then((resp) => {
            workloadNames.push(resp.body.metadata.name);
          });
        },
        wait
      });

      // finish off with result
      return cy.wrap({
        ns,
        workloadNames
      });
    });
});

Cypress.Commands.add('deleteNamespace', (namespaces: string[]) => {
  for (let i = 0; i < namespaces.length; i++) {
    const ns = namespaces[i];

    cy.deleteRancherResource('v1', 'namespaces', ns);
    cy.waitForRancherResource('v1', 'namespaces', ns, (resp) => resp.status === 404, 20, { failOnStatusCode: false });
  }
});

Cypress.Commands.add('deleteManyResources', <T = any>({ toDelete, deleteFn, wait = MEDIUM_API_DELAY }: {
  toDelete: T[],
  deleteFn: (arg0: T) => CypressChainable,
  wait?: number
}) => {
  return cy.loopProcessWait({
    iterables: toDelete,
    process:   ({ entry }) => deleteFn(entry),
    wait
  });
});

Cypress.Commands.add('loopProcessWait', <T = any>({ iterables, process, wait = MEDIUM_API_DELAY }: {
  iterables: T[],
  process: ({ entry, iteration }: {entry: T, iteration: number}) => CypressChainable
  wait?: number
}) => {
  for (let i = 0; i < iterables.length; i++) {
    process({ entry: iterables[i], iteration: i });
    if (wait && i % 5 === 0) {
      cy.wait(wait); // eslint-disable-line cypress/no-unnecessary-waiting
    }
  }
});

/**
 * Get cluster ID by cluster name
 */
Cypress.Commands.add('getClusterIdByName', (clusterName: string) => {
  return cy.getRancherResource('v3', 'clusters').then((resp: Cypress.Response<any>) => {
    const body = resp.body;
    const cluster = body.data.find((item: any) => item.name === clusterName);

    if (cluster) {
      return cluster.id;
    } else {
      throw new Error(`Cluster with name '${ clusterName }' not found`);
    }
  });
});
