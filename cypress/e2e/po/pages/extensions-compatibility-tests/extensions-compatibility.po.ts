import PagePo from '@/cypress/e2e/po/pages/page.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import ChartInstalledAppsPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';

const installChart = new InstallChartPage();
const terminal = new Kubectl();
const installedApps = new ChartInstalledAppsPagePo();

export default class ExtensionsCompatibiliyPo extends PagePo {
  title(selector: string): Cypress.Chainable<string> {
    return this.self().find(selector).invoke('text');
  }

  waitForTitle(selector: string, title: string) {
    return this.title(selector).should('contain', title);
  }

  waitForInstallChartPage() {
    return installChart.waitForChartPage('rancher-charts', 'elemental');
  }

  chartInstallNext() {
    return installChart.nextPage();
  }

  chartInstallClick() {
    return installChart.installChart();
  }

  chartInstallWaitForInstallationAndCloseTerminal(interceptName: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 15000 }).its('response.statusCode').should('eq', 201);

    // giving it a small buffer so that the install is properly triggered
    cy.wait(3000);
    terminal.closeTerminal();

    installedApps.list().state('elemental-operator-crds').should('contain', 'Deployed');
    installedApps.list().state('elemental-operator').should('contain', 'Deployed');

    // timeout to give time for everything to be setup, otherwise the extension
    // won't find the chart and show the correct screen
    return cy.wait(5000);
  }
}
