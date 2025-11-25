import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
    chartsPage.chartsSearchFilterInput().type(chartName);
    // Wait for the URL to update and then assert the 'q' parameter's value.
    cy.location().should((loc) => {
      const params = new URLSearchParams(loc.search);

      expect(params.get('q')).to.eq(chartName);
    });
    chartsPage.clickChart(chartName);
  }

  chartHeader(options?: any) {
    return this.self().find('[data-testid="chart-header-title"]', options).invoke('text');
  }

  waitForChartHeader(title: string, options?: any) {
    return this.chartHeader(options).should('contain', title);
  }

  goToInstall() {
    const btn = new AsyncButtonPo('.chart-header .btn.role-primary');

    btn.checkVisible(MEDIUM_TIMEOUT_OPT);
    btn.click(true);

    return this;
  }

  deprecationAndExperimentalWarning() {
    return new BannersPo('[data-testid="deprecation-and-experimental-banner"]', this.self());
  }

  selectVersion(version: string) {
    return this.self().find('[data-testid="chart-version-link"]').contains(version).click();
  }

  checkSelectedVersion(version: string) {
    return this.self().find('.chart-body__info-section--versions').find('.current-version').contains(version);
  }

  versions() {
    return this.self().find('[data-testid="chart-versions"]');
  }

  versionLinks() {
    return this.versions().find('[data-testid="chart-version-link"]');
  }

  showMoreVersions() {
    return this.self().find('[data-testid="chart-show-more-versions"]');
  }

  repoLink() {
    return this.self().find('[data-testid="chart-repo-link"]');
  }

  keywords() {
    return this.self().find('[data-testid="chart-keyword-link"]');
  }

  /**
   * Get all versions of the chart
   * @returns Array of versions
   */
  getVersions() {
    return this.self().find('.chart-body__info-section--versions').find('b').then((elements) => {
      return Cypress._.map(elements, 'innerText');
    });
  }
}
