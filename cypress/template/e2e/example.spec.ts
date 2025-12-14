// Example of Page Object from @rancher/cypress
import ComponentPo from '@rancher/cypress/e2e/po/components/component.po';

describe('Example Test', () => {
  it('should work', () => {
    cy.visit('/');
    cy.contains('Welcome');
  });
});
