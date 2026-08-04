import { FleetApplicationListPagePo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { gitRepoTargetAllClustersRequest, gitRepoInfo as repoInfo, FLEET_DEFAULT_WORKSPACE } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

// Covers issue https://github.com/rancher/dashboard/issues/14546
// "Target clusters" (cluster selector match expressions) - related change:
// https://github.com/rancher/dashboard/pull/14525
//
// Seeds a GitRepo whose target is a cluster match expression, then confirms the
// edit form loads that match expression on the target step and preserves it when
// the resource is saved again (round-trip of the match-expression targeting).

const fakeProvClusterId = 'target-fake-cluster-id';
const fakeMgmtClusterId = 'target-fake-mgmt-id';

const workspace = FLEET_DEFAULT_WORKSPACE;

// A genuine user label selector. Note: a `provider.cattle.io NotIn [harvester]`
// expression is the built-in "exclude Harvester" sentinel that the form strips and
// reads back as "all clusters", so it must NOT be used to exercise clusters mode.
const matchExpression = {
 key: 'env', operator: 'In', values: ['prod']
};
const customTargets = [{ clusterSelector: { matchExpressions: [matchExpression] } }];

let repoName = '';
const reposToDelete: string[] = [];

describe('Fleet GitRepo target clusters via match expressions', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const listPage = new FleetApplicationListPagePo();
  const headerPo = new HeaderPo();

  before(() => {
    cy.login();

    // Seed a GitRepo that targets clusters through a match expression. Created once
    // in `before` (not inside the test) so a test retry never re-POSTs the name.
    cy.createE2EResourceName('git-repo-target-me').then((name) => {
      repoName = name;
      cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(workspace, name, repoInfo.repoUrl, repoInfo.branch, repoInfo.paths, customTargets)).then(() => {
        reposToDelete.push(`${ workspace }/${ name }`);
      });
    });
  });

  it('loads and preserves a cluster match expression target when editing', () => {
    generateFakeClusterDataAndIntercepts({ fakeProvClusterId, fakeMgmtClusterId });
    cy.intercept('PUT', `/v1/fleet.cattle.io.gitrepos/${ workspace }/${ repoName }`).as('updateGitRepo');

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);

    listPage.list().actionMenu(repoName).getMenuItem('Edit Config').click();

    const editPage = new FleetGitRepoCreateEditPo(workspace, repoName);

    editPage.waitForPage('mode=edit');

    // metadata -> repo -> target
    editPage.resourceDetail().createEditView().nextPage(); // Repository step
    editPage.resourceDetail().createEditView().nextPage(); // Target step

    // The seeded match expression is rendered on the target step (clusters mode).
    editPage.self().find('[data-testid="input-match-expression-key-0"]').should('exist');

    // target -> advanced, then finish (the primary button is only "finish" on the
    // last step, so we must advance to it before saving).
    editPage.resourceDetail().createEditView().nextPage(); // Advanced step
    editPage.resourceDetail().createEditView().save(); // Finish

    cy.waitForInterceptWithConflictRetry('@updateGitRepo').then(({ request, response }: any) => {
      expect(response?.statusCode).to.be.oneOf([200, 201]);

      const rules = (request.body.spec.targets || []).flatMap((t: any) => t.clusterSelector?.matchExpressions || []);
      const envRule = rules.find((r: any) => r.key === matchExpression.key);

      expect(envRule, 'user match expression preserved after edit').to.not.be.undefined;
      expect(envRule.operator).to.eq(matchExpression.operator);
      expect(envRule.values).to.include(matchExpression.values[0]);
    });
  });

  after(() => {
    reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r, false));
  });
});
