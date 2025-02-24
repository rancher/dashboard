import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import SettingsEditPo from '@/cypress/e2e/po/edit/settings.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
export class SettingsPagePo extends RootClusterPage {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/settings/management.cattle.io.setting`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SettingsPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(SettingsPagePo.createPath(clusterId));
  }

  static navTo() {
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
  }

  settingBanner() {
    return new BannersPo('[data-testid="global-settings-banner"]', this.self());
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
    return this.advancedSettingRow(label).find('[data-testid*="action-button"]');
  }

  editSettingsButton() {
    return cy.get('[dropdown-menu-item]').contains('Edit Setting');
  }

  /**
   * Click Edit Settings
   * @param label
   * @returns
   */
  editSettingsByLabel(label: string) {
    this.actionButtonByLabel(label).click();

    return this.editSettingsButton().click();
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
