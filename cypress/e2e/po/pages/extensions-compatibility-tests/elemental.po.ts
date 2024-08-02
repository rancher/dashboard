import ExtensionsCompatibiliyPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/extensions-compatibility.po';

export default class ElementalPo extends ExtensionsCompatibiliyPo {
  static url = '/elemental/c/_/dashboard';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ElementalPo.url);
  }

  constructor(url: string) {
    super(ElementalPo.url);
  }

  installOperatorBtnClick(): Cypress.Chainable {
    return this.self().getId('charts-install-button').click();
  }
}
