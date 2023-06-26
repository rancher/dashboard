import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class HomePagePo extends PagePo {
  static url = '/home'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomePagePo.url);
  }

  static goToAndWaitForGet() {
    PagePo.goToAndWaitForGet(HomePagePo.goTo, [
      'v1/counts',
      'v1/namespaces',
    ]);
  }

  constructor() {
    super(HomePagePo.url);
  }

  title(): Cypress.Chainable<string> {
    return this.self().getId('banner-title').invoke('text');
  }

  changelog(): Cypress.Chainable<string> {
    return this.self().getId('changelog-banner').invoke('text');
  }
}
