import { Matcher } from '@/cypress/globals';

/**
 * Get input field for given label
 */
Cypress.Commands.add('byLabel', (label: string): Cypress.Chainable<Element> => {
  return cy.get('.labeled-input').contains(label).siblings('input') as unknown as Cypress.Chainable<Element>;
});

/**
 * Wrap the cy.find() command to simplify the selector declaration of the data-testid
 */
Cypress.Commands.add('findId', (id: string, matcher: Matcher = ''): Cypress.Chainable<Element> => {
  return cy.find(`[data-testid${ matcher }="${ id }"]`) as unknown as Cypress.Chainable<Element>;
});

/**
 * Wrap the cy.get() command to simplify the selector declaration of the data-testid
 */
Cypress.Commands.add('getId', (id: string, matcher: Matcher = ''): Cypress.Chainable<Element> => {
  return cy.get(`[data-testid${ matcher }="${ id }"]`) as unknown as Cypress.Chainable<Element>;
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
Cypress.Commands.add('interceptAllRequests', (method = '/GET/POST/PUT/PATCH/', urls: string[] = ['/v1/']) => {
  const interceptedUrls: string[] = urls.map((cUrl, i) => {
    cy.intercept(method, cUrl).as(`interceptAllRequests${ i }`);

    return `@interceptAllRequests${ i }`;
  });

  // Return the first intercepted alias as Cypress.Chainable<string>
  return cy.wrap(interceptedUrls[0]);
});

/**
 * Logout of Rancher
 */
Cypress.Commands.add('logout', () => {
  // Commented the incercept here as per issue: https://github.com/rancher/rancher/issues/46795
  //   cy.intercept('POST', '/v3/tokens?action=logout').as('loggedOut');
  cy.visit('/auth/logout?logged-out=true');
  //   cy.wait('@loggedOut').its('response.statusCode').should('eq', 200);
});

Cypress.Commands.add('iFrame', () => {
  return cy
    .get('[data-testid="ember-iframe"]', { log: false })
    .its('0.contentDocument.body', { log: false })
    .should('not.be.empty')
    .then((body) => cy.wrap(body) as unknown as Cypress.Chainable<Element>);
});

const runTimestamp = +new Date();

/**
 * Get root resource name
 */
Cypress.Commands.add('getRootE2EResourceName', () => {
  return cy.wrap(`e2e-test-${ runTimestamp }`);
});

/**
 * Create resource name
 */
Cypress.Commands.add('createE2EResourceName', (context, options = { prefixContext: false, onlyContext: false }) => {
  if (options?.onlyContext) {
    return cy.wrap(context);
  }

  return cy.getRootE2EResourceName().then((root) => options?.prefixContext ? `${ context }-${ root }` : `${ root }-${ context }`);
});

// See: https://stackoverflow.com/questions/74785083/how-can-i-get-a-custom-css-variable-from-any-element-cypress
Cypress.Commands.add('shouldHaveCssVar', { prevSubject: true }, (subject, styleName, cssVarName) => {
  cy.document().then((doc) => {
    const dummy = doc.createElement('span');

    dummy.style.setProperty(styleName, `var(${ cssVarName })`);
    doc.body.appendChild(dummy);

    const evaluatedStyle = window.getComputedStyle(dummy).getPropertyValue(styleName).trim();

    dummy.remove();

    cy.wrap(subject)
      .then(($el) => window.getComputedStyle($el[0]).getPropertyValue(styleName).trim())
      .should('eq', evaluatedStyle);
  });
});
Cypress.Commands.add('hideElementBySelector', (selector:string) => {
  cy.get(selector).invoke('css', 'opacity', '0');
});
