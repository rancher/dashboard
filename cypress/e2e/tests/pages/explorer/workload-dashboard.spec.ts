import WorkloadDashboardPagePo from '@/cypress/e2e/po/pages/explorer/workload-dashboard.po';

const workloadDashboard = new WorkloadDashboardPagePo('local');

describe('Workload Dashboard', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('should navigate to the workload dashboard and display the title', () => {
    workloadDashboard.goTo();
    workloadDashboard.waitForPage();

    workloadDashboard.title().should('contain.text', 'Workload Dashboard');
  });

  it('should display a namespace subtitle with workload count', () => {
    workloadDashboard.subtitle().should('be.visible');
    workloadDashboard.subtitle().invoke('text').should('match', /workload/i);
  });

  it('should display the By State section with state cards', () => {
    cy.contains('h4', 'By State').should('be.visible');
    workloadDashboard.byStateSection().should('be.visible');
    workloadDashboard.stateCards().should('have.length.gte', 1);
  });

  it('should display the By Type section with type cards', () => {
    cy.contains('h4', 'By Type').should('be.visible');
    workloadDashboard.byTypeSection().should('be.visible');
    workloadDashboard.byTypeCards().should('have.length.gte', 1);
  });

  it('should navigate to the resource list when clicking a By Type card', () => {
    workloadDashboard.goTo();
    workloadDashboard.waitForPage();

    workloadDashboard.byTypeCards().first().click();

    cy.url().should('match', /\/c\/local\/explorer\/(apps\.|batch\.)?[a-z]+/);
  });

  it('should show empty state when namespace filter matches no workloads', () => {
    cy.updateNamespaceFilter('local', 'none', '{"local":["ns://e2e-nonexistent-ns"]}');

    workloadDashboard.goTo();
    workloadDashboard.waitForPage();

    workloadDashboard.emptyState().should('be.visible');
  });

  after(() => {
    cy.login();
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
