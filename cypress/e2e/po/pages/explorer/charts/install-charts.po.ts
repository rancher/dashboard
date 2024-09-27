import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '~/cypress/e2e/po/components/tabbed.po';

export class InstallChartPage extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/charts/install`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(InstallChartPage.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(InstallChartPage.createPath(clusterId));
  }

  waitForChartPage(repository: string, chart: string) {
    return this.waitForPage(`repo-type=cluster&repo=${ repository }&chart=${ chart }`);
  }

  nextPage() {
    const btn = new AsyncButtonPo('.controls-steps .btn.role-primary');

    btn.click(true);

    return this;
  }

  editOptions(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  selectTab(options: TabbedPo, tabID: string) {
    return this.editOptions(options, `[data-testid="btn-${ tabID }"]`);
  }

  installChart() {
    const btn = new AsyncButtonPo('[data-testid="action-button-async-button"]');

    btn.click(true);

    return this;
  }

  editYaml() {
    this.self().get('[data-testid="btn-group-options-view"]').contains('Edit YAML').click();

    return this;
  }

  tabsCountOnInstallQuestions() {
    return new TabbedPo().allTabs();
  }
}
