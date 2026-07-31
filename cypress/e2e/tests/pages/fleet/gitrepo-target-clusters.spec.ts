import { FleetApplicationCreatePo, FleetApplicationListPagePo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

// Covers issue https://github.com/rancher/dashboard/issues/14546
// "Target clusters" (cluster selector match expressions) - related change:
// https://github.com/rancher/dashboard/pull/14525

const fakeProvClusterId = 'target-fake-cluster-id';
const fakeMgmtClusterId = 'target-fake-mgmt-id';

const workspace = 'fleet-default';
const repoInfo = {
  repoUrl: 'https://github.com/rancher/fleet-examples.git',
  branch:  'master',
  paths:   'simple'
};

const reposToDelete: string[] = [];

describe('Fleet GitRepo target clusters via match expressions', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const listPage = new FleetApplicationListPagePo();
  const createPage = new FleetApplicationCreatePo();
  const gitRepoCreatePage = new FleetGitRepoCreateEditPo();
  const headerPo = new HeaderPo();

  before(() => {
    cy.login();
  });

  it('creates a GitRepo targeting clusters with a match expression', () => {
    generateFakeClusterDataAndIntercepts({ fakeProvClusterId, fakeMgmtClusterId });
    cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('createGitRepo');

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    listPage.create();
    createPage.createGitRepo();
    gitRepoCreatePage.waitForPage();

    cy.createE2EResourceName('git-repo-target-me').then((name) => {
      // Metadata step
      gitRepoCreatePage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set(name);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Repository step
      gitRepoCreatePage.setGitRepoUrl(repoInfo.repoUrl);
      gitRepoCreatePage.setBranchName(repoInfo.branch);
      gitRepoCreatePage.setGitRepoPath(repoInfo.paths);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Target step - choose "clusters" mode (index 2, only present once the
      // async fleet-cluster data has loaded) then add a match expression selector.
      gitRepoCreatePage.targetClusterOptions().getAllOptions().should('have.length.gte', 3);
      gitRepoCreatePage.targetClusterOptions().set(2);
      gitRepoCreatePage.addClusterSelector();
      gitRepoCreatePage.setMatchExpression(0, 'provider.cattle.io', 'not in list', ['harvester']);

      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Advanced step - create the resource
      gitRepoCreatePage.resourceDetail().createEditView().create()
        .then(() => {
          reposToDelete.push(`${ workspace }/${ name }`);
        });

      cy.wait('@createGitRepo').then(({ request, response }) => {
        expect(response?.statusCode).to.eq(201);

        const targets = request.body.spec.targets;

        expect(targets).to.be.an('array').and.to.have.length.gte(1);

        const withSelector = targets.find((t: any) => t.clusterSelector?.matchExpressions?.length);

        expect(withSelector, 'a target with a clusterSelector match expression').to.not.be.undefined;

        const expression = withSelector.clusterSelector.matchExpressions[0];

        expect(expression.key).to.eq('provider.cattle.io');
        expect(expression.operator).to.eq('NotIn');
        expect(expression.values).to.include('harvester');
      });
    });
  });

  it('displays and preserves an existing match expression target when editing', () => {
    // Create a GitRepo via the API that already targets clusters by match
    // expression, then confirm the edit form renders it and round-trips on save.
    generateFakeClusterDataAndIntercepts({ fakeProvClusterId, fakeMgmtClusterId });

    cy.createE2EResourceName('git-repo-target-edit').then((name) => {
      cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(workspace, name, repoInfo.repoUrl, repoInfo.branch, repoInfo.paths)).then(() => {
        reposToDelete.push(`${ workspace }/${ name }`);
      });

      cy.intercept('PUT', `/v1/fleet.cattle.io.gitrepos/${ workspace }/${ name }`).as('updateGitRepo');

      listPage.goTo();
      listPage.waitForPage();
      headerPo.selectWorkspace(workspace);

      listPage.list().actionMenu(name).getMenuItem('Edit Config').click();

      const gitRepoEditPage = new FleetGitRepoCreateEditPo(workspace, name);

      gitRepoEditPage.waitForPage('mode=edit');

      // Move to the target step and confirm the "clusters" mode is selected
      // (advanced/manual targeting) with the seeded match expression key visible.
      gitRepoEditPage.resourceDetail().createEditView().nextPage(); // Repository
      gitRepoEditPage.resourceDetail().createEditView().nextPage(); // Target

      gitRepoEditPage.self().find('[data-testid="input-match-expression-key-0"]').should('exist');
      gitRepoEditPage.self().contains('provider.cattle.io').should('exist');

      // Save and verify the match expression is preserved in the payload
      gitRepoEditPage.resourceDetail().createEditView().nextPage(); // Advanced
      gitRepoEditPage.resourceDetail().createEditView().save();

      cy.wait('@updateGitRepo').then(({ request, response }) => {
        expect(response?.statusCode).to.be.oneOf([200, 201]);

        const withSelector = request.body.spec.targets.find((t: any) => t.clusterSelector?.matchExpressions?.length);

        expect(withSelector, 'match expression preserved after edit').to.not.be.undefined;
        expect(withSelector.clusterSelector.matchExpressions[0].key).to.eq('provider.cattle.io');
      });
    });
  });

  after(() => {
    reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r, false));
  });
});
