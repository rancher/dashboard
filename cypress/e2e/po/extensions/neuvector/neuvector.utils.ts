import ExtensionsCompatibilityUtils from '~/cypress/e2e/po/extensions/extensions-compatibility.utils';
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
    return this.self().find('[data-testid="nv-dashboard-title"]').should('contain', 'Dashboard');
  }

  controllerInstallBtnClick(): Cypress.Chainable {
    return this.self().find('[data-testid="nv-app-install-button"]').click();
  }
}

export default class NeuvectorPo extends ExtensionsCompatibilityUtils {
  dashboard() {
    return new NeuvectorDashboardPagePo();
  }
}
