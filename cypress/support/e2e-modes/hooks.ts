import { E2E_MODE_CONTROL_PATH, E2EModeControl, E2EModeControlAction, E2EModeTestEndResult } from './modes';

if (['generate', 'integration'].includes(Cypress.env('e2eMode'))) {
  const titleOf = (test?: { titlePath(): string[] }) => (test ? test.titlePath().join(' > ') : '');
  const control = (action: E2EModeControlAction, body: Omit<E2EModeControl, 'spec'> = {}) => cy.request({
    method: 'POST',
    url:    `${ Cypress.env('api') }/${ E2E_MODE_CONTROL_PATH }/${ action }`,
    body:   { spec: Cypress.spec.relative, ...body },
    log:    false,
  });

  before(() => {
    control('spec-start');
  });

  beforeEach(function() {
    control('test-start', { title: titleOf(this.currentTest) });
  });

  afterEach(function() {
    control('test-end', { title: titleOf(this.currentTest), passed: this.currentTest?.state === 'passed' }).then(({ body }: { body: E2EModeTestEndResult }) => {
      if (body.misses.length) {
        cy.log(`**${ body.misses.length } request(s) had no recording to replay**`);
        body.misses.slice(0, 25).forEach((miss) => cy.log(miss));
      }
    });
  });

  after(() => {
    control('spec-end');
  });
}
