import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import { Matcher } from '@/cypress/support/types';
import { CreateUserParams } from '@/cypress/globals';

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
  return cy.getProject(clusterId, projectName)
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
Cypress.Commands.add('getProject', (clusterId, projectName) => {
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
 * Get input field for given label
 */
Cypress.Commands.add('byLabel', (label) => {
  return cy.get('.labeled-input').contains(label).siblings('input');
});

/**
 * Wrap the cy.find() command to simplify the selector declaration of the data-testid
 */
Cypress.Commands.add('findId', (id: string, matcher?: Matcher = '') => {
  return cy.find(`[data-testid${ matcher }="${ id }"]`);
});

/**
 * Wrap the cy.get() command to simplify the selector declaration of the data-testid
 */
Cypress.Commands.add('getId', (id: string, matcher?: Matcher = '') => {
  return cy.get(`[data-testid${ matcher }="${ id }"]`);
});

/**
 * Override user preferences to default values, allowing to pass custom preferences for a deterministic scenario
 */
// eslint-disable-next-line no-undef
Cypress.Commands.add('userPreferences', (preferences: Partial<UserPreferences> = {}) => {
  return cy.intercept('/v1/userpreferences', (req) => {
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

Cypress.Commands.add('keyboardControls', (triggerKeys: any = {}, count = 1) => {
  for (let i = 0; i < count; i++) {
    cy.get('body').trigger('keydown', triggerKeys);
  }
});

/**
 * Intercept all requests and return
 * @param {array} intercepts - Array of intercepts to return
 * return {array} - Array of intercepted request strings
 * return {string} - Intercepted request string
 */
Cypress.Commands.add('interceptAllRequests', (method = '/GET/POST/PUT/PATCH/', urls = ['/v1/*']) => {
  const interceptedUrls: string[] = urls.map((cUrl, i) => {
    cy.intercept(method, cUrl).as(`interceptAllRequests${ i }`);

    return `@interceptAllRequests${ i }`;
  });

  return cy.wrap(interceptedUrls);
});

Cypress.Commands.add('iFrame', () => {
  return cy
    .get('[data-testid="ember-iframe"]', { log: false })
    .its('0.contentDocument.body', { log: false })
    .should('not.be.empty')
    .then((body) => cy.wrap(body));
});
