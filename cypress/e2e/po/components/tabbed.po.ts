import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';

export default class TabbedPo extends ComponentPo {
  constructor(selector = '.dashboard-root', private componentId = 'tabbed') {
    super(selector);
  }

  clickNthTab(optionIndex: number) {
    return this.self().find(`li:nth-child(${ optionIndex }) a`).click();
  }

  clickTabWithSelector(selector: string) {
    return this.self().find(`${ selector }`).click();
  }

  // Wait for a tab (by selector) to render and be visible - e.g. before clicking it, to avoid racing
  // the tab bar mounting after a SPA navigation.
  checkTabVisible(selector: string, options?: GetOptions) {
    return this.self().find(selector, options).should('be.visible');
  }

  clickTabWithName(name: string) {
    return this.self().get(`[data-testid="btn-${ name }"]`).click();
  }

  allTabs(componentTestId = this.componentId) {
    return this.self().get(`[data-testid="${ componentTestId }-block"] > li`);
  }

  assertTabIsActive(selector: string) {
    return this.self().find(`${ selector }`).should('have.class', 'active');
  }

  getTab(name: string) {
    return new ComponentPo(`[data-testid="${ name }"]`, this.self());
  }

  /**
   * Get tab labels
   * @param tabLabelsSelector
   * @returns
   */
  tabNames(tabLabelsSelector = 'a > span') {
    return this.allTabs().find(tabLabelsSelector).then(($els: any) => {
      return (
        Cypress.$.makeArray<string>($els).map((el: any) => el.innerText as string)
      );
    });
  }
}
