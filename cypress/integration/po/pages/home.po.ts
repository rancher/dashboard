import PagePo from '@/cypress/integration/po/pages/page.po';

export default class HomePagePo extends PagePo {
  static url: string = '/home'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomePagePo.url);
  }

  constructor() {
    super(HomePagePo.url);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('[data-testid="banner-title"]').invoke('text');
  }

  changelog(): Cypress.Chainable<string> {
    return this.self().find('[data-testid="changelog-banner"]').invoke('text');
  }
}
