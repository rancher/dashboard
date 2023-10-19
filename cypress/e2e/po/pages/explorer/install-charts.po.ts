import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export class InstallChartsPage extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/charts/install`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(InstallChartsPage.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(InstallChartsPage.createPath(clusterId));
  }

  nextPage() {
    return cy.get('.controls-steps').contains('Next').click();
  }

  installChart(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }
}
