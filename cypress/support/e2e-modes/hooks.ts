import { E2E_MODE_TASKS, E2EModeTestEndResult } from './modes';

if (['generate', 'integration'].includes(Cypress.env('e2eMode'))) {
  const titleOf = (test?: { titlePath(): string[] }) => (test ? test.titlePath().join(' > ') : '');

  before(() => {
    cy.task(E2E_MODE_TASKS.specStart, { spec: Cypress.spec.relative }, { log: false });
  });

  beforeEach(function() {
    cy.task(E2E_MODE_TASKS.testStart, { spec: Cypress.spec.relative, title: titleOf(this.currentTest) }, { log: false });
  });

  afterEach(function() {
    const passed = this.currentTest?.state === 'passed';

    cy.task<E2EModeTestEndResult>(E2E_MODE_TASKS.testEnd, {
      spec: Cypress.spec.relative, title: titleOf(this.currentTest), passed
    }, { log: false }).then(({ misses }) => {
      if (misses.length) {
        cy.log(`**${ misses.length } request(s) had no recording to replay**`);
        misses.slice(0, 25).forEach((miss) => cy.log(miss));
      }
    });
  });

  after(() => {
    cy.task(E2E_MODE_TASKS.specEnd, { spec: Cypress.spec.relative }, { log: false });
  });
}
