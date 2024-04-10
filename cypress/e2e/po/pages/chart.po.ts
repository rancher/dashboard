import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';

export class ChartPage extends PagePo {
  private static createPath(clusterId: string, install?: boolean) {
    const root = `/c/${ clusterId }/apps/charts`;

    return install ? `${ root }/install` : `${ root }/chart`;
  }

  static goTo(clusterId: string, install?: boolean): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartPage.createPath(clusterId, install));
  }

  constructor(clusterId = 'local', install?: boolean) {
    super(ChartPage.createPath(clusterId, install));
  }

  static navTo(clusterId = 'local', chartName: string) {
    const chartsPage = new ChartsPage(clusterId);

    ChartsPage.navTo();
    chartsPage.selectChart(chartName);
  }

  goToInstall() {
    const btn = new AsyncButtonPo('.chart-header .btn.role-primary');

    btn.click(true);

    return this;
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
