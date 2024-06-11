import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';

export class ChartPage extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/charts/chart`;
  }

  waitForChartPage(repository: string, chart: string) {
    return this.waitForPage(`repo-type=cluster&repo=${ repository }&chart=${ chart }`);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartPage.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ChartPage.createPath(clusterId));
  }

  static navTo(clusterId = 'local', chartName: string) {
    const chartsPage = new ChartsPage(clusterId);

    ChartsPage.navTo();
    chartsPage.charts().select(chartName);
  }

  goToInstall() {
    const btn = new AsyncButtonPo('.chart-header .btn.role-primary');

    btn.click(true);

    return this;
  }
}
