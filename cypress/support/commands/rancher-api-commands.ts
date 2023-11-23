import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import { CreateUserParams } from '@/cypress/globals';

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
) => {
  const login = () => {
    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    LoginPagePo.goTo(); // Needs to happen before the page element is created/located
    const loginPage = new LoginPagePo();

    loginPage
      .checkIsCurrentPage();

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
Cypress.Commands.add('createUser', (params: CreateUserParams) => {
  const {
    username, globalRole, clusterRole, projectRole
  } = params;

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
      username,
      password:           Cypress.env('password')
    }
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
 * create a namespace
 */
Cypress.Commands.add('createNamespace', (nsName, projId) => {
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
        annotations: {
          'field.cattle.io/containerDefaultResourceLimit': '{}',
          'field.cattle.io/projectId':                     projId
        },
        labels: { 'field.cattle.io/projectId': projId.split(':')[1] },
        name:   nsName
      },
      disableOpenApiValidation: false
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
    });
});

/**
 * delete a v3 / v1 resource
 */
Cypress.Commands.add('deleteRancherResource', (prefix, resourceType, resourceId) => {
  return cy.request({
    method:  'DELETE',
    url:     `${ Cypress.env('api') }/${ prefix }/${ resourceType }/${ resourceId }`,
    headers: {
      'x-api-csrf': token.value,
      Accept:       'application/json'
    }
  })
    .then((resp) => {
      expect(resp.status).to.eq(200);
    });
});
