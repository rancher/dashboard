import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class WhatsNewPagePo extends PagePo {
  static url = '/docs/whats-new'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WhatsNewPagePo.url);
  }

  constructor() {
    super(WhatsNewPagePo.url);
  }

  title(): Cypress.Chainable {
    return cy.get('.breadcrumbs');
  }
}
