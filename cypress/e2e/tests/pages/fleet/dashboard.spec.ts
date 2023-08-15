import { FleetDashboardPagePo } from '~/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { GitRepoCreatePo } from '~/cypress/e2e/po/pages/fleet/gitrepo-create.po';

describe('Fleet Dashboard', { tags: '@adminUser' }, () => {
  let fleetDashboardPage: FleetDashboardPagePo;

  beforeEach(() => {
    cy.login();
    fleetDashboardPage = new FleetDashboardPagePo('local');
    fleetDashboardPage.goTo();
  });

  beforeEach(() => { });

  before(() => {
    cy.login();

    const gitRepoCreatePage = new GitRepoCreatePo('local');

    gitRepoCreatePage.goTo();
    gitRepoCreatePage.setRepoName('fleet-e2e-test-dashboard');
    gitRepoCreatePage.setGitRepoUrl('https://github.com/Shavindra/fleet-basic.git');
    gitRepoCreatePage.gitRepoPaths().setValueAtIndex('simple', 0);
    gitRepoCreatePage.goToNext();
    gitRepoCreatePage.create();
  });

  it('Should display cluster status', () => {
    const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-local');
    const row = fleetLocalResourceTable.sortableTable().rowElements().eq(0);

    row.find('[data-testid="clusters-ready"] span').should('have.text', '1/1');
  });

  it('Should display bundles status', () => {
    const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-local');
    const row = fleetLocalResourceTable.sortableTable().rowElements().eq(0);

    row.find('[data-testid="bundles-ready"] span').should('have.text', '1/1');
  });

  it('Should display resources status', () => {
    const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-local');
    const row = fleetLocalResourceTable.sortableTable().rowElements().eq(0);

    row.find('[data-testid="resources-ready"] span').should('have.text', '1/1');
  });
});
