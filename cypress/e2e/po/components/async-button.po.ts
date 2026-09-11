import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';

export default class AsyncButtonPo extends ComponentPo {
  click(force = false): Cypress.Chainable {
    return this.self().click({ force });
  }

  /**
   * Wait for the button to become enabled, then click it. Async buttons are often `:disabled` until
   * their step's schema/validation has loaded; force-clicking one while it is still disabled lands the
   * click but never emits the handler, so no request is sent (a downstream `cy.wait(...)` then reports
   * "no request ever occurred"). Wait for the disabled attribute to clear - pass a generous timeout via
   * `options` for CI load - before clicking.
   */
  clickWhenEnabled(options?: GetOptions, force = false): Cypress.Chainable {
    this.expectToBeEnabled(options);
    this.self(options).scrollIntoView();

    return this.click(force);
  }

  expectToBeDisabled(): Cypress.Chainable {
    return this.self().should('have.attr', 'disabled', 'disabled');
  }

  expectToBeEnabled(options?: GetOptions): Cypress.Chainable {
    return this.self(options).should('not.have.attr', 'disabled');
  }

  waitForDisabledAppearanceToDisappear(): Cypress.Chainable {
    return this.self().should('have.class', 'ready-for-action');
  }

  label(name: string): Cypress.Chainable {
    return this.self().contains(name);
  }

  action(label: string, labelDone: string): Cypress.Chainable {
    this.self().contains(label).should('exist');
    this.self().click();

    return this.self().contains(labelDone).should('exist');
  }

  apply(): Cypress.Chainable {
    return this.action('Apply', 'Applied');
  }
}
