import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import SettingsEditPo from '@/cypress/e2e/po/edit/settings.po';
export class SettingsPagePo extends RootClusterPage {
  static url = '/c/_/settings/management.cattle.io.setting'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SettingsPagePo.url);
  }

  constructor() {
    super(SettingsPagePo.url);
  }

  /**
   * Get advanced settings row per setting name
   * @param label
   * @returns
   */
  advancedSettingRow(label: string) {
    return cy.getId(`advanced-setting__option-${ label }`);
  }

  /**
   * Get action button settings row per setting name
   * @param label
   * @returns
   */
  actionButtonByLabel(label: string) {
    return this.advancedSettingRow(label).find('.action > button');
  }

  /**
   * Click Edit Settings
   * @param label
   * @returns
   */
  editSettingsByLabel(label: string) {
    this.actionButtonByLabel(label).click();

    return cy.contains('Edit Setting').click();
  }

  editSettings(clusterId: string, setting: string) {
    return new SettingsEditPo(clusterId, setting);
  }

  /**
   * Get modified label per setting name
   * @param label
   * @returns
   */
  modifiedLabel(label: string) {
    return this.advancedSettingRow(label).contains('Modified');
  }

  /**
   * Get settings value per setting name
   * @param label
   * @returns
   */
  settingsValue(label: string) {
    return this.advancedSettingRow(label).find('.settings-value');
  }
}
