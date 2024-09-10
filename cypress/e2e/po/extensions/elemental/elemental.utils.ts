import ExtensionsCompatibilityUtils from '~/cypress/e2e/po/extensions/extensions-compatibility.utils';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';

class DashboardPagePo extends PagePo {
  private static url = '/elemental/c/_/dashboard';

  constructor() {
    super(DashboardPagePo.url);
  }

  waitForTitle(): Cypress.Chainable {
    return this.self().find('h1').should('contain', 'OS Management');
  }

  installOperator(): Cypress.Chainable {
    return this.self().getId('charts-install-button').click();
  }

  createElementalCluster() {
    return this.self().getId('button-create-elemental-cluster').click();
  }

  createUpdateGroupClick() {
    return this.self().getId('create-update-group-btn').click();
  }
}

export default class ElementalPo extends ExtensionsCompatibilityUtils {
  dashboard() {
    return new DashboardPagePo();
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
