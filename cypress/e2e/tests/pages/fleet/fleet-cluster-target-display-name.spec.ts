import { FleetGitRepoCreateEditPo, FleetApplicationListPagePo, FleetApplicationCreatePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { CYPRESS_SAFE_RESOURCE_REVISION } from '@/cypress/e2e/blueprints/blueprint.utils';

const METADATA_NAME = 'c-m-e2etest';
const DISPLAY_NAME = 'e2e-custom-display-cluster';
const workspace = 'fleet-default';

const listPage = new FleetApplicationListPagePo();
const createPage = new FleetApplicationCreatePo();
const gitRepoCreatePage = new FleetGitRepoCreateEditPo();

function interceptFleetClustersWithDisplayName() {
  cy.intercept('GET', '/v1/fleet.cattle.io.clusters?*', (req) => {
    req.continue((res) => {
      const fakeFleetCluster = {
        id:       `${ workspace }/${ METADATA_NAME }`,
        type:     'fleet.cattle.io.cluster',
        metadata: {
          name:      METADATA_NAME,
          namespace: workspace,
          labels:    {
            'management.cattle.io/cluster-display-name': DISPLAY_NAME,
            'management.cattle.io/cluster-name':         METADATA_NAME,
          },
          state: {
            name:          'active',
            error:         false,
            transitioning: false,
            message:       'Resource is Ready'
          },
          resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        },
        spec:   {},
        status: {
          agent:   { lastSeen: '2026-01-01T00:00:00Z' },
          display: {
            readyBundles: '0/0',
            state:        'Active',
          },
        },
      };

      res.body.data.push(fakeFleetCluster);
      res.send(res.body);
    });
  }).as('fleetClustersWithDisplayName');
}

describe('Fleet Cluster Targets - Display Name', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const headerPo = new HeaderPo();

  before(() => {
    cy.login();
  });

  describe('Create GitRepo - cluster target dropdown should show display name', () => {
    it('should display cluster nameDisplay (not metadata.name) in the target selector dropdown', () => {
      interceptFleetClustersWithDisplayName();

      // Select workspace from list page first, then navigate to create
      listPage.goTo();
      listPage.waitForPage();
      headerPo.selectWorkspace(workspace);
      listPage.create();
      createPage.createGitRepo();

      gitRepoCreatePage.waitForPage();

      // Step 1: Metadata
      cy.createE2EResourceName('display-name-dropdown').then((name) => {
        gitRepoCreatePage.resourceDetail().createEditView().nameNsDescription()
          .name()
          .set(name);
      });
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Step 2: Repository details
      gitRepoCreatePage.setGitRepoUrl('https://github.com/rancher/fleet-examples.git');
      gitRepoCreatePage.setBranchName('master');
      gitRepoCreatePage.setGitRepoPath('simple');
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Step 3: Target selection
      // Wait for fleet clusters to load and "Manually selected clusters" radio to appear
      gitRepoCreatePage.targetClusterOptions().getAllOptions().should('have.length.gte', 3);
      gitRepoCreatePage.targetClusterOptions().set(2);

      // Open cluster dropdown and verify display name is shown
      gitRepoCreatePage.targetCluster().toggle();
      gitRepoCreatePage.targetCluster().getOptions().should('contain', DISPLAY_NAME);

      // Verify metadata.name is NOT shown as an option label
      gitRepoCreatePage.targetCluster().getOptionsAsStrings().then((options) => {
        const hasDisplayName = options.some((opt) => opt.includes(DISPLAY_NAME));
        const hasMetadataName = options.some((opt) => opt === METADATA_NAME);

        expect(hasDisplayName).to.eq(true);
        expect(hasMetadataName).to.eq(false);
      });
    });

    it('should use display name as clusterName value when selecting a cluster target', () => {
      interceptFleetClustersWithDisplayName();

      // Select workspace from list page first, then navigate to create
      listPage.goTo();
      listPage.waitForPage();
      headerPo.selectWorkspace(workspace);
      listPage.create();
      createPage.createGitRepo();

      gitRepoCreatePage.waitForPage();

      // Step 1: Metadata
      cy.createE2EResourceName('display-name-value').as('createRepoName');

      cy.get<string>('@createRepoName').then((name) => {
        gitRepoCreatePage.resourceDetail().createEditView().nameNsDescription()
          .name()
          .set(name);
      });
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Step 2: Repository details
      gitRepoCreatePage.setGitRepoUrl('https://github.com/rancher/fleet-examples.git');
      gitRepoCreatePage.setBranchName('master');
      gitRepoCreatePage.setGitRepoPath('simple');
      gitRepoCreatePage.resourceDetail().createEditView().nextPage();

      // Step 3: Target selection - select cluster by display name
      gitRepoCreatePage.targetClusterOptions().getAllOptions().should('have.length.gte', 3);
      gitRepoCreatePage.targetClusterOptions().set(2);
      gitRepoCreatePage.targetCluster().toggle();
      gitRepoCreatePage.targetCluster().clickLabel(DISPLAY_NAME);

      // Intercept the create request and verify the payload uses display name
      cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('createGitRepo');

      gitRepoCreatePage.resourceDetail().createEditView().nextPage();
      gitRepoCreatePage.resourceDetail().createEditView().create();

      cy.wait('@createGitRepo').then(({ request }) => {
        const targets = request.body.spec.targets;
        const clusterTarget = targets.find((t: any) => t.clusterName);

        expect(clusterTarget.clusterName).to.eq(DISPLAY_NAME);
      });

      // Cleanup
      cy.get<string>('@createRepoName').then((name) => {
        cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', `${ workspace }/${ name }`);
      });
    });
  });

  describe('Edit GitRepo - should resolve metadata.name targets to display name', () => {
    const repoInfo = {
      repoUrl: 'https://github.com/rancher/fleet-examples.git',
      branch:  'master',
      paths:   'simple'
    };

    let gitRepoName = '';

    before(() => {
      cy.createE2EResourceName('display-name-edit').then((name) => {
        gitRepoName = name;

        // Create a gitrepo with cluster target using metadata.name
        cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos',
          gitRepoTargetAllClustersRequest(workspace, name, repoInfo.repoUrl, repoInfo.branch, repoInfo.paths, [{ clusterName: METADATA_NAME }])
        );
      });
    });

    it('should show display name in cluster target selector when editing a gitrepo that references a cluster by metadata.name', () => {
      interceptFleetClustersWithDisplayName();

      const listPage = new FleetApplicationListPagePo();

      listPage.goTo();
      listPage.waitForPage();
      headerPo.selectWorkspace(workspace);

      listPage.list().actionMenu(gitRepoName).getMenuItem('Edit Config')
        .click();

      const editPage = new FleetGitRepoCreateEditPo(workspace, gitRepoName);

      editPage.waitForPage('mode=edit');

      // Navigate to target step
      editPage.resourceDetail().createEditView().nextPage();
      editPage.resourceDetail().createEditView().nextPage();

      // Wait for clusters to load and resolve - the watcher should convert metadata.name to display name
      cy.wait('@fleetClustersWithDisplayName');

      // The selected cluster should show the display name, not metadata.name
      editPage.targetCluster().checkOptionSelected(DISPLAY_NAME);
    });

    after(() => {
      if (gitRepoName) {
        cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', `${ workspace }/${ gitRepoName }`);
      }
    });
  });
});
