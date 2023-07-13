import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class BannersPo extends ComponentPo {
  /**
   * Get banner content
   * @returns
   */
  banner(): Cypress.Chainable {
    return this.self().getId('banner-content');
  }

  /**
   * Click close button
   * @returns
   */
  closeButton(): Cypress.Chainable {
    return this.self().getId('banner-close').click({ force: true });
  }
}
