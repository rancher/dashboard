import { Matcher } from '@/cypress/support/types';

// Custom violation callback function that prints a list of violations
const severityIndicators = {
  minor:    '⚪',
  moderate: '🟡',
  serious:  '🟠',
  critical: '🔴',
};

function printAccessibilityViolations(violations) {
  violations.forEach((violation) => {
    const nodes = Cypress.$(violation.nodes.map((item) => item.target).join(','));

    Cypress.log({
      name:         `${ severityIndicators[violation.impact] } A11y`,
      consoleProps: () => violation,
      $el:          nodes,
      message:      `[${ violation.help }][${ violation.helpUrl }]`
    });

    violation.nodes.forEach(({ target }) => {
      Cypress.log({
        name:         `🔨`,
        consoleProps: () => violation,
        $el:          Cypress.$(target.join(',')),
        message:      target
      });
    });
  });
}
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
Cypress.Commands.add('interceptAllRequests', (method = '/GET/POST/PUT/PATCH/', urls = [/v1\/(.+)/]) => {
  const interceptedUrls: string[] = urls.map((cUrl, i) => {
    cy.intercept(method, cUrl).as(`interceptAllRequests${ i }`);

    return `@interceptAllRequests${ i }`;
  });

  return cy.wrap(interceptedUrls);
});

/**
 * Logout of Rancher
 */
Cypress.Commands.add('logout', () => {
  cy.intercept('POST', '/v3/tokens?action=logout').as('loggedOut');
  cy.visit('/auth/logout?logged-out=true');
  cy.wait('@loggedOut').its('response.statusCode').should('eq', 200);
});

Cypress.Commands.add('iFrame', () => {
  return cy
    .get('[data-testid="ember-iframe"]', { log: false })
    .its('0.contentDocument.body', { log: false })
    .should('not.be.empty')
    .then((body) => cy.wrap(body));
});

/**
 * Create resource name
 */
const runTimestamp = +new Date();

Cypress.Commands.add('createE2EResourceName', (context) => {
  return cy.wrap(`e2e-test-${ runTimestamp }-${ context }`);
});

// skipFailures = true will not fail the test when there are accessibility failures
Cypress.Commands.add(
  'checkPageAccessibility',
  { prevSubject: 'optional' },
  (subject, { skipFailures = true } = {}) => {
    cy.checkA11y(subject, null, printAccessibilityViolations, skipFailures);
  },
);
