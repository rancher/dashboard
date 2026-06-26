import WorkloadDashboardPagePo from '@/cypress/e2e/po/pages/explorer/workloads/workload-dashboard.po';

const workloadDashboard = new WorkloadDashboardPagePo('local');

describe('Workload Dashboard', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
    WorkloadDashboardPagePo.navTo();
    workloadDashboard.waitForPage();
  });

  it('should display the title', () => {
    workloadDashboard.title().should('contain.text', 'Workloads Overview');
  });

  it('should display a namespace subtitle with workload count', () => {
    workloadDashboard.subtitle().should('be.visible');
    workloadDashboard.subtitle().invoke('text').should('match', /\(\d+ workloads?\)/);
  });

  it('should display the By State section with state cards', () => {
    workloadDashboard.byStateSection().should('be.visible');
    workloadDashboard.stateCards().should('have.length.gte', 1);
  });

  it('should display the By Type section with type cards', () => {
    workloadDashboard.byTypeSection().should('be.visible');
    workloadDashboard.byTypeCards().should('have.length.gte', 1);
  });

  it('should navigate to the resource list when clicking a By Type card', () => {
    WorkloadDashboardPagePo.navTo();
    workloadDashboard.waitForPage();

    workloadDashboard.byTypeCards().first().click();

    cy.url().should('match', /\/c\/local\/explorer\/(apps\.|batch\.)?[a-z]+/);
  });

  it('should show empty state when namespace filter matches no workloads', () => {
    workloadDashboard.interceptSummariesAsEmpty();

    WorkloadDashboardPagePo.navTo();
    workloadDashboard.waitForPage();
    workloadDashboard.waitForEmptySummaries();

    workloadDashboard.emptyState().should('be.visible');
  });

  after(() => {
    cy.login();
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
