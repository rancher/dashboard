import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class BannersPo extends ComponentPo {
  constructor() {
    super('main > div > header');
  }

  banner(): Cypress.Chainable {
    return this.self().find('.banner');
  }
}
