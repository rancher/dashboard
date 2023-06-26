import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class BannerGraphicPo extends ComponentPo {
  constructor(selector: string = '.dashboard-root') {
    super(selector);
  }

  graphicBanner(): Cypress.Chainable {
    return cy.getId('home-banner-graphic');
  }

  graphicBannerCloseButton(): Cypress.Chainable {
    return cy.getId('graphic-banner-close').click({ force: true });
  }
}
