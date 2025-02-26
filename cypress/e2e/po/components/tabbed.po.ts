import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class TabbedPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  clickNthTab(optionIndex: number) {
    return this.self().find(`li:nth-child(${ optionIndex }) a`).click();
  }

  clickTabWithSelector(selector: string) {
    return this.self().find(`${ selector }`).click();
  }

  clickTabWithName(name: string) {
    return this.self().get(`[data-testid="btn-${ name }"]`).click();
  }

  allTabs() {
    return this.self().get('[data-testid="tabbed-block"] > li');
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
