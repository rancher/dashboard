import RootClusterPage from '~/cypress/e2e/po/pages/root-cluster-page';

export class SettingsPagePo extends RootClusterPage {
  static url: string = '/c/_/settings/management.cattle.io.setting'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SettingsPagePo.url);
  }

  constructor() {
    super(SettingsPagePo.url);
  }
}
