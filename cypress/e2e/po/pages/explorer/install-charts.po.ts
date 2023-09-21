import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export class InstallChartsPage extends PagePo {
  static url = '/c/local/apps/charts/install?repo-type=cluster&repo=rancher-charts'

  constructor(pageUrl = InstallChartsPage.url) {
    InstallChartsPage.url = pageUrl;
    super(InstallChartsPage.url);
  }

  nextPage() {
    return cy.get('.controls-steps').contains('Next').click();
  }

  installChart(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }
}
