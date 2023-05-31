import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import { Matcher } from '@/cypress/support/types';

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

    cy.wait('@loginReq').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      const apiKey = request.headers['x-api-csrf'];

      if (username === 'admin') {
        cy.createUser(apiKey);
        cy.setGlobalRoleBinding(apiKey, 'user');
      }
    });
  };

  if (cacheSession) {
    (cy as any).session([username, password], login);
  } else {
    login();
  }
});

/**
 * Create standard user via api request
 */
Cypress.Commands.add('createUser', (apiKey) => {
  return cy.request({
    method:  'POST',
    url:     'v3/users',
    headers: {
      'x-api-csrf': apiKey,
      Accept:       'application/json'
    },
    body: {
      type:               'user',
      enabled:            true,
      mustChangePassword: false,
      username:           `user${ Date.now() }`,
      password:           Cypress.env('password')
    }
  }).then((resp) => {
    expect(resp.status).to.eq(201);
    Cypress.env('userInfo').push(resp.body.username);
    Cypress.env('userInfo').push(resp.body.id);
  });
});

/**
 * Set global role binding for user via api request
 */
Cypress.Commands.add('setGlobalRoleBinding', (apiKey, role) => {
  return cy.request({
    method:  'POST',
    url:     'v3/globalrolebindings',
    headers: {
      'x-api-csrf': apiKey,
      Accept:       'application/json'
    },
    body: {
      type:         'globalRoleBinding',
      globalRoleId: role,
      userId:       Cypress.env('userInfo')[1]
    }
  }).then((resp) => {
    expect(resp.status).to.eq(201);
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

Cypress.Commands.add('iFrame', () => {
  return cy
    .get('[data-testid="ember-iframe"]', { log: false })
    .its('0.contentDocument.body', { log: false })
    .should('not.be.empty')
    .then((body) => cy.wrap(body));
});
