import ExtensionsCompatibiliyPo from '@/cypress/e2e/po/extensions/extensions-compatibility.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
export default class ElementalPo extends ExtensionsCompatibiliyPo {
  static url = '/elemental/c/_/dashboard';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ElementalPo.url);
  }

  constructor() {
    super(ElementalPo.url);
  }

  installOperatorBtnClick(): Cypress.Chainable {
    return this.self().getId('charts-install-button').click();
  }

  dashboardCreateElementalClusterClick() {
    return this.self().getId('button-create-elemental-cluster').click();
  }

  dashboardCreateUpdateGroupClick() {
    return this.self().getId('create-update-group-btn').click();
  }

  elementalClusterSelectorTemplateBanner() {
    return new BannersPo('[provider="machineinventoryselectortemplate"] .banner.warning');
  }

  updateGroupTargetClustersSelect() {
    return new LabeledSelectPo('[data-testid="cluster-target"]');
  }

  updateGroupImageOption() {
    return new RadioGroupInputPo('[data-testid="upgrade-choice-selector"]');
  }
}
