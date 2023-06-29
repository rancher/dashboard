import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class BannersPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  /**
   * Get banner content
   * @returns
   */
  banner(): Cypress.Chainable {
    return cy.getId('banner-content');
  }

  /**
   * Get change log banner
   * @returns
   */
  changelog(): Cypress.Chainable {
    return cy.getId('changelog-banner');
  }

  /**
   * Get set login page banner
   * @returns
   */
  getLoginPageBanner(): Cypress.Chainable {
    return cy.getId('set-login-page-banner');
  }

  /**
   * Click close button
   * @returns
   */
  closeButton(): Cypress.Chainable {
    return cy.getId('banner-close').click({ force: true });
  }
}
