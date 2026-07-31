import { FleetApplicationCreatePo, FleetApplicationListPagePo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { EXTRA_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

// Covers issue https://github.com/rancher/dashboard/issues/14546
// "GitRepo OCI registry and polling interval" - related change:
// https://github.com/rancher/dashboard/pull/14414

const fakeProvClusterId = 'oci-fake-cluster-id';
const fakeMgmtClusterId = 'oci-fake-mgmt-id';

const workspace = 'fleet-default';
const repoInfo = {
  repoUrl: 'https://github.com/rancher/fleet-examples.git',
  branch:  'master',
  paths:   'simple'
};

// OCI storage secrets are plain Secrets with this specific type. The GitRepo
// Advanced step only lists secrets whose `_type` matches (and that are not the
// auto-generated fallback), see shell/components/fleet/FleetOCIStorageSecret.vue
const OCI_SECRET_TYPE = 'fleet.cattle.io/bundle-oci-storage/v1alpha1';

const reposToDelete: string[] = [];
const secretsToDelete: string[] = [];

describe('Fleet GitRepo OCI registry and polling interval', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const listPage = new FleetApplicationListPagePo();
  const createPage = new FleetApplicationCreatePo();
  const gitRepoCreatePage = new FleetGitRepoCreateEditPo();
  const headerPo = new HeaderPo();

  let ociSecretName = '';

  before(() => {
    cy.login();

    // Create an OCI storage secret via the API so it appears as an option in the
    // Advanced step's "OCI Storage Secret" selector.
    cy.createE2EResourceName('oci-storage-secret').then((name) => {
      ociSecretName = name;
      cy.createRancherResource('v1', 'secrets', {
        type:     OCI_SECRET_TYPE,
        metadata: { name, namespace: workspace },
        data:     {
          username: btoa('oci-user'),
          password: btoa('oci-password'),
        },
      }).then(() => {
        secretsToDelete.push(`${ workspace }/${ name }`);
      });
    });
  });

  it('warns when the polling interval is below the recommended minimum', () => {
    generateFakeClusterDataAndIntercepts({ fakeProvClusterId, fakeMgmtClusterId });
    cy.intercept('GET', '/v1/secrets?*').as('getSecretsInitialLoad');

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    listPage.create();
    createPage.createGitRepo();
    gitRepoCreatePage.waitForPage();

    cy.createE2EResourceName('git-repo-oci-warning').then((name) => {
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

      // Target step - target all clusters (index 0 of the radio group)
      gitRepoCreatePage.targetClusterOptions().set(0);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      cy.wait('@getSecretsInitialLoad', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);

      // Advanced step - a value below the 15s recommended minimum shows a warning
      gitRepoCreatePage.setPollingInterval(5);
      gitRepoCreatePage.pollingIntervalMinimumWarning().should('be.visible');

      // Raising it above the minimum clears the warning
      gitRepoCreatePage.setPollingInterval(30);
      gitRepoCreatePage.pollingIntervalMinimumWarning().should('not.exist');
    });
  });

  it('creates a GitRepo with an OCI storage secret and a custom polling interval', () => {
    generateFakeClusterDataAndIntercepts({ fakeProvClusterId, fakeMgmtClusterId });
    cy.intercept('GET', '/v1/secrets?*').as('getSecretsInitialLoad');
    cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('createGitRepo');

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    listPage.create();
    createPage.createGitRepo();
    gitRepoCreatePage.waitForPage();

    cy.createE2EResourceName('git-repo-oci').then((name) => {
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

      // Target step - target all clusters
      gitRepoCreatePage.targetClusterOptions().set(0);
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      cy.wait('@getSecretsInitialLoad', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);

      // Advanced step - pick the OCI storage secret and a valid polling interval
      gitRepoCreatePage.ociStorageSecret().checkExists();
      gitRepoCreatePage.ociStorageSecret().toggle();
      gitRepoCreatePage.ociStorageSecret().clickLabel(ociSecretName);
      gitRepoCreatePage.setPollingInterval(30);

      gitRepoCreatePage.resourceDetail().createEditView().create()
        .then(() => {
          reposToDelete.push(`${ workspace }/${ name }`);
        });

      cy.wait('@createGitRepo').then(({ request, response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(request.body.spec.ociRegistrySecret).to.eq(ociSecretName);
        expect(request.body.spec.pollingInterval).to.eq('30s');
      });
    });
  });

  after(() => {
    reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r, false));
    secretsToDelete.forEach((s) => cy.deleteRancherResource('v1', 'secrets', s, false));
  });
});
