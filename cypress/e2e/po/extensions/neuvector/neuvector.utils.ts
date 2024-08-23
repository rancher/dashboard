import ExtensionsCompatibilityUtils from '~/cypress/e2e/po/extensions/extensions-compatibility.utils';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';

class NeuvectorDashboardPagePo extends PagePo {
  static url = '/c/local/neuvector';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NeuvectorDashboardPagePo.url);
  }

  constructor() {
    super(NeuvectorDashboardPagePo.url);
  }

  waitForTitlePreControllerInstall(): Cypress.Chainable {
    return this.self().find('[data-testid="nv-install-title"]').should('contain', 'NeuVector');
  }

  waitForTitleAfterControllerInstall(): Cypress.Chainable {
    return this.self().find('[data-testid="kw-dashboard-title"]').should('contain', 'Welcome to Kubewarden');
  }

  controllerInstallBtnClick(): Cypress.Chainable {
    return this.self().find('[data-testid="nv-app-install-button"]').click();
  }
}

export default class NeuvectorPo extends ExtensionsCompatibilityUtils {
  dashboard() {
    return new NeuvectorDashboardPagePo();
  }

  // elementalClusterSelectorTemplateBanner() {
  //   return new BannersPo('[provider="machineinventoryselectortemplate"] .banner.warning');
  // }

  // updateGroupTargetClustersSelect() {
  //   return new LabeledSelectPo('[data-testid="cluster-target"]');
  // }

  // updateGroupImageOption() {
  //   return new RadioGroupInputPo('[data-testid="upgrade-choice-selector"]');
  // }
}
