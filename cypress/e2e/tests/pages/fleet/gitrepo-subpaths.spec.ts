import { FleetApplicationCreatePo, FleetApplicationListPagePo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { gitRepoInfo as repoInfo, FLEET_DEFAULT_WORKSPACE } from '@/cypress/e2e/blueprints/fleet/gitrepos';

// Covers issue https://github.com/rancher/dashboard/issues/14546
// "GitRepo Subpaths" - related change:
// https://github.com/rancher/dashboard/pull/14471
//
// A GitRepo can define multiple custom paths. Each path can optionally declare
// subpaths (config file locations), which the form serialises into `spec.bundles`
// while the plain paths remain in `spec.paths`.

const workspace = FLEET_DEFAULT_WORKSPACE;

const reposToDelete: string[] = [];

describe('Fleet GitRepo custom paths and subpaths', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const listPage = new FleetApplicationListPagePo();
  const createPage = new FleetApplicationCreatePo();
  const gitRepoCreatePage = new FleetGitRepoCreateEditPo();
  const headerPo = new HeaderPo();

  before(() => {
    cy.login();
  });

  it('creates a GitRepo with multiple paths and a subpath', () => {
    cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('createGitRepo');

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    listPage.create();
    createPage.createGitRepo();
    gitRepoCreatePage.waitForPage();

    cy.createE2EResourceName('git-repo-subpaths').then((name) => {
      // Metadata step
      gitRepoCreatePage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set(name);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Repository step - add two custom paths
      gitRepoCreatePage.setGitRepoUrl(repoInfo.repoUrl);
      gitRepoCreatePage.setBranchName(repoInfo.branch);

      // First path keeps subpaths, second path stays a plain path
      gitRepoCreatePage.addGitRepoPathAtIndex('simple', 0);
      gitRepoCreatePage.addGitRepoPathAtIndex('multi-cluster/helm', 1);

      // Enable and define a subpath on the first path
      gitRepoCreatePage.enableSubpaths(0);
      gitRepoCreatePage.setSubpath(0, 'dev', 'fleet-dev.yaml');

      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Target step - target all clusters
      gitRepoCreatePage.targetClusterOptions().set(0);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Advanced step - nothing to change, create the resource
      gitRepoCreatePage.resourceDetail().createEditView().create()
        .then(() => {
          reposToDelete.push(`${ workspace }/${ name }`);
        });

      cy.wait('@createGitRepo').then(({ request, response }) => {
        expect(response?.statusCode).to.eq(201);

        // The plain path remains in spec.paths
        expect(request.body.spec.paths).to.be.an('array');
        expect(request.body.spec.paths).to.include('multi-cluster/helm');

        // The path with subpaths is serialised into spec.bundles
        expect(request.body.spec.bundles).to.be.an('array');
        expect(request.body.spec.bundles.length).to.be.gte(1);
      });
    });
  });

  after(() => {
    reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r, false));
  });
});
