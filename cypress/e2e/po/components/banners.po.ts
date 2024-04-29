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
   * Gets an element within a banner
   * @param element The HTML element to target
   */
  bannerElement(element: string) {
    return this.self().getId('banner-content').find(element);
  }

  /**
   * Click close button
   * @returns
   */
  closeButton(): Cypress.Chainable {
    return this.self().getId('banner-close').click({ force: true });
  }
}
