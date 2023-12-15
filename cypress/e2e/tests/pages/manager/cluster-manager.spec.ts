import { isMatch } from 'lodash';

import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import { providersList } from '@/cypress/e2e/blueprints/manager/clusterProviderUrlCheck';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ClusterManagerDetailRke2CustomPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-custom.po';
import ClusterManagerDetailSnapshotsPo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-snapshots.po';
import ClusterManagerDetailImportedGenericPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-import-generic.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import ClusterManagerEditRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke2-custom.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.generic.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import ClusterManagerCreateRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import Shell from '@/cypress/e2e/po/components/shell.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
<<<<<<< HEAD
import { snapshot } from '@/cypress/e2e/blueprints/manager/cluster-snapshots';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import RkeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-drivers.po';
import EmberModalClusterDriverPo from '@/cypress/e2e/po/components/ember/ember-modal-add-edit-cluster-driver.po';
import RkeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-templates.po';
import NodeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/node-templates.po';
import CloudCredentialsPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials.po';
import ClusterManagerCreateRke1Amazonec2PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-amazonec2.po';
import EmberPromptRemove from '@/cypress/e2e/po/components/ember/ember-prompt-remove.po';
import PodSecurityPoliciesTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-policy-templates.po';
import PodSecurityAdmissionsPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-admissions.po';
import MachinesPagePo from '@/cypress/e2e/po/pages/cluster-manager/machines.po';
import MachineSetsPagePo from '@/cypress/e2e/po/pages/cluster-manager/machine-sets.po';
import MachineDeploymentsPagePo from '@/cypress/e2e/po/pages/cluster-manager/machine-deployments.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/cluster-manager/repositories.po';
=======
>>>>>>> 3a7267c65 (add tags and split out each describe into its own spec file)
// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const namespace = 'fleet-default';
const type = 'provisioning.cattle.io.cluster';
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;
const rke2CustomName = `${ clusterNamePartial }-rke2-custom`;
const importGenericName = `${ clusterNamePartial }-import-generic`;

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Cluster Manager', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo('local');

  before(() => {
    cy.login();
  });

  describe('All providers', () => {
    providersList.forEach((prov) => {
      prov.conditions.forEach((condition) => {
        it(`should be able to access cluster creation for provider ${ prov.label } with rke type ${ condition.rkeType } via url`, () => {
          const clusterCreate = new ClusterManagerCreatePagePo();

          clusterCreate.goTo(`type=${ prov.clusterProviderQueryParam }&rkeType=${ condition.rkeType }`);
          clusterCreate.waitForPage();

          const fnName = condition.loads === 'rke1' ? 'rke1PageTitle' : 'rke2PageTitle';
          const evaluation = condition.loads === 'rke1' ? `Add Cluster - ${ condition.label ? condition.label : prov.label }` : `Create ${ condition.label ? condition.label : prov.label }`;

          clusterCreate[fnName]().should('contain', evaluation);
        });
      });
    });
  });

  describe('Created', () => {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();
    const detailRKE2ClusterPage = new ClusterManagerDetailRke2CustomPagePo(rke2CustomName);

    describe('RKE2 Custom', () => {
      const editCreatedClusterPage = new ClusterManagerEditRke2CustomPagePo(rke2CustomName);

      it('can create new cluster', () => {
        cy.intercept('POST', `/v1/${ type }s`).as('createRequest');
        const request = {
          type,
          metadata: {
            namespace,
            name: rke2CustomName
          },
        };

        cy.userPreferences();

        clusterList.goTo();

        // check if burguer menu nav is highlighted correctly for cluster manager
        BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Cluster Management');

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createRKE2ClusterPage.waitForPage();
        createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');

        createRKE2ClusterPage.selectCustom(0);
        createRKE2ClusterPage.nameNsDescription().name().set(rke2CustomName);
        createRKE2ClusterPage.create();

        cy.wait('@createRequest').then((intercept) => {
          // Issue with linter https://github.com/cypress-io/eslint-plugin-cypress/issues/3
          expect(isMatch(intercept.request.body, request)).to.equal(true);
        });

        detailRKE2ClusterPage.waitForPage(undefined, 'registration');
      });

      it('can copy config to clipboard', () => {
        ClusterManagerListPagePo.navTo();

        cy.intercept('POST', '*action=generateKubeconfig').as('copyKubeConfig');
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Copy KubeConfig to Clipboard').click();
        cy.wait('@copyKubeConfig');

        // Verify confirmation message displays and is hidden after ~3 sec
        cy.get('.growl-text').contains('Copied KubeConfig to Clipboard').should('be.visible');
        cy.get('.growl-text', { timeout: 4000 }).should('not.exist');

        // Skipping following assertion for now as it is failing due to Cypress' limitations with accessing the clipboard in Chrome browser and headless mode. Works in Electron browser
        // see https://github.com/cypress-io/cypress/issues/2752

        // read text saved in the browser clipboard
        // cy.window().its('navigator.clipboard')
        //   .invoke('readText').should('include', rke2CustomName);
      });

      it('can edit cluster and see changes afterwards', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click();

        editCreatedClusterPage.waitForPage('mode=edit', 'basic');
        editCreatedClusterPage.nameNsDescription().description().set(rke2CustomName);
        editCreatedClusterPage.save();

        // We should be taken back to the list page if the save was successful
        clusterList.waitForPage();

        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click();

        editCreatedClusterPage.waitForPage('mode=edit', 'basic');
        editCreatedClusterPage.nameNsDescription().description().self().should('have.value', rke2CustomName);
      });

      it('can view cluster YAML editor', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit YAML').click();

        editCreatedClusterPage.waitForPage('mode=edit&as=yaml');
        editCreatedClusterPage.resourceDetail().resourceYaml().checkVisible();
      });

      it('can download KubeConfig', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Download KubeConfig').click();

        const downloadedFilename = path.join(downloadsFolder, `${ rke2CustomName }.yaml`);

        cy.readFile(downloadedFilename).then((buffer) => {
          // This will throw an exception which will fail the test if not valid yaml
          const obj = jsyaml.load(buffer);

          // Basic checks on the downloaded YAML
          expect(obj.clusters.length).to.equal(1);
          expect(obj.clusters[0].name).to.equal(rke2CustomName);
          expect(obj.apiVersion).to.equal('v1');
          expect(obj.kind).to.equal('Config');
        });
      });

      it('can download YAML', () => {
        // Delete downloads directory. Need a fresh start to avoid conflicting file names
        cy.deleteDownloadsFolder();

        ClusterManagerListPagePo.navTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Download YAML').click();

        const downloadedFilename = path.join(downloadsFolder, `${ rke2CustomName }.yaml`);

        cy.readFile(downloadedFilename).then((buffer) => {
          const obj: any = jsyaml.load(buffer);

          // Basic checks on the downloaded YAML
          expect(obj.apiVersion).to.equal('provisioning.cattle.io/v1');
          expect(obj.metadata.annotations['field.cattle.io/description']).to.equal(rke2CustomName);
          expect(obj.kind).to.equal('Cluster');
        });
      });

      it('can delete cluster', () => {
        clusterList.goTo();
        clusterList.sortableTable().rowElementWithName(rke2CustomName).should('exist', { timeout: 15000 });
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Delete').click();

        clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
          const promptRemove = new PromptRemove();

          promptRemove.confirm(rke2CustomName);
          promptRemove.remove();

          clusterList.waitForPage();
          clusterList.sortableTable().checkRowCount(false, rows.length - 1);
          clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', rke2CustomName);
        });
      });
    });

    const createClusterRKE1Page = new ClusterManagerCreateRke1CustomPagePo();

    describe('RKE1 Custom', () => {
      it('can create new cluster', () => {
        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createClusterRKE1Page.waitForPage();

        createClusterRKE1Page.rkeToggle().set('RKE1');
        createClusterRKE1Page.selectCustom(0);

        createClusterRKE1Page.clusterName().set(rke1CustomName);

        // Test Custom Cluster Roles -------------------------
        const roles = [{
          label:          'Create Projects',
          roleTemplateId: 'projects-create'
        }, {
          label:          'Manage Cluster Catalogs',
          roleTemplateId: 'clustercatalogs-manage'
        }, {
          label:          'Manage Navlinks',
          roleTemplateId: 'navlinks-manage'
        }, {
          label:          'Manage Storage',
          roleTemplateId: 'storage-manage'
        }];

        createClusterRKE1Page.memberRoles().checkExists();
        createClusterRKE1Page.memberRoles().expand();
        createClusterRKE1Page.memberRolesFormMembers().addMember();
        createClusterRKE1Page.memberRolesFormMembers().setNewMemberWithCustomRoles('admin', roles);

        cy.intercept('POST', '/v3/clusterroletemplatebinding').as('binding');

        //  -------------------------

        createClusterRKE1Page.next();

        let found = 0;

        for (let i = 0; i < roles.length; i++) {
          cy.wait('@binding').then((res: any) => {
            if (roles.find((r) => r.roleTemplateId === res.response.body.roleTemplateId)) {
              found++;
            }

            if (i === roles.length - 1) {
              expect(roles.length).equal(found);
            }
          });
        }

        createClusterRKE1Page.nodeCommand().checkExists();
        createClusterRKE1Page.done();

        clusterList.waitForPage();
        clusterList.sortableTable().rowElementWithName(rke1CustomName).should('exist');
      });

      it.skip('can create new snapshots', () => {
      });

      it('can show snapshots list', () => {
        clusterList.goToClusterListAndGetClusterDetails(rke1CustomName).then((cluster) => {
          const snapshots = new ClusterManagerDetailSnapshotsPo(cluster.id);

          // We want to show 2 elements in the snapshots tab
          const snapshotId1 = 'ml-mkhz4';
          const snapshotId2 = 'ml-mkhz5';

          // Intercept first request with limit 1, this should triggers depaginate mechanism and make a second request to fetch second snapshot.
          cy.intercept({
            method: 'GET',
            path:   '/v3/etcdbackups',
          }, (req) => {
            req.query = { limit: '1' };

            req.continue((res) => {
              res.body.pagination = {
                first:   `${ req.url }&marker=${ cluster.id }%3A${ cluster.id }-${ snapshotId1 }`,
                next:    `${ req.url }&marker=${ cluster.id }%3A${ cluster.id }-${ snapshotId2 }`,
                last:    `${ req.url }&marker=${ cluster.id }%3A${ cluster.id }-${ snapshotId2 }`,
                limit:   1,
                total:   2,
                partial: true
              };

              res.body.data = [
                snapshot(cluster.id, snapshotId1),
              ];
            });
          });

          // Intercept second request
          cy.intercept({
            method: 'GET',
            path:   `/v3/etcdbackups?limit=1&marker=${ cluster.id }%3A${ cluster.id }-${ snapshotId2 }`,
          }, (req) => {
            req.continue((res) => {
              res.body.data = [
                snapshot(cluster.id, snapshotId2),
              ];
            });
          });

          snapshots.goTo();
          snapshots.waitForPage();

          snapshots.list().resourceTable().sortableTable().rowElements()
            .should('have.length.gte', 3); // 2 main rows + 1 group row
        });
      });

      it.skip('can delete snapshots', () => {
      });

      it('can delete cluster', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke1CustomName).getMenuItem('Delete').click();

        const promptRemove = new PromptRemove();

        promptRemove.confirm(rke1CustomName);
        promptRemove.remove();

        clusterList.sortableTable().rowElementWithName(rke1CustomName).should('not.exist', { timeout: 15000 });
      });
    });
  });

  describe('Imported', () => {
    const importClusterPage = new ClusterManagerImportGenericPagePo('local');

    describe('Generic', () => {
      const editImportedClusterPage = new ClusterManagerEditGenericPagePo(importGenericName);

      it('can create new cluster', () => {
        const detailClusterPage = new ClusterManagerDetailImportedGenericPagePo(importGenericName);

        cy.intercept('POST', `/v1/${ type }s`).as('importRequest');

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.importCluster();

        importClusterPage.waitForPage('mode=import');
        importClusterPage.selectGeneric(0);
        importClusterPage.nameNsDescription().name().set(importGenericName);
        importClusterPage.create();

        cy.wait('@importRequest').then((intercept) => {
          expect(intercept.request.body).to.deep.equal({
            type,
            metadata: {
              namespace,
              name: importGenericName
            },
            spec: {}
          });
        });

        detailClusterPage.waitForPage(undefined, 'registration');
      });

      it('can navigate to cluster edit page', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click();

        editImportedClusterPage.waitForPage('mode=edit');
      });

      it('can delete cluster by bulk actions', { viewportHeight: 1000, viewportWidth: 660 }, () => {
        clusterList.goTo();
        clusterList.sortableTable().rowElementWithName(importGenericName).should('exist', { timeout: 15000 });
        clusterList.sortableTable().rowSelectCtlWithName(importGenericName).set();
        clusterList.sortableTable().bulkActionDropDownOpen();
        clusterList.sortableTable().bulkActionDropDownButton('Delete').click();

        clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
          const promptRemove = new PromptRemove();

          promptRemove.confirm(importGenericName);
          promptRemove.remove();

          clusterList.waitForPage();
          clusterList.sortableTable().checkRowCount(false, rows.length - 1);
          clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', importGenericName);
        });
      });
    });
  });

  it(`can navigate to local cluster's explore product`, () => {
    const clusterName = 'local';
    const clusterDashboard = new ClusterDashboardPagePo(clusterName);

    clusterList.goTo();
    clusterList.list().explore(clusterName).click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');
  });

  it('can navigate to Cluster Management Page', () => {
    HomePagePo.goTo();
    const burgerMenu = new BurgerMenuPo();

    BurgerMenuPo.toggle();
    const clusterManagementNavItem = burgerMenu.links().contains(`Cluster Management`);

    clusterManagementNavItem.should('exist');
    clusterManagementNavItem.click();
    const clusterList = new ClusterManagerListPagePo('_');

    clusterList.waitForPage();
  });

  it('can download KubeConfig', () => {
    // Delete downloads directory. Need a fresh start to avoid conflicting file names
    cy.deleteDownloadsFolder();

    ClusterManagerListPagePo.navTo();
    clusterList.list().checkVisible();
    clusterList.list().resourceTable().sortableTable().rowElementWithName('local')
      .click();
    clusterList.list().downloadKubeConfig().click();

    const downloadedFilename = path.join(downloadsFolder, `local.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('v1');
      expect(obj.clusters[0].name).to.equal('local');
      expect(obj.kind).to.equal('Config');
    });
  });

  it('can download YAML', () => {
    // Delete downloads directory. Need a fresh start to avoid conflicting file names
    cy.deleteDownloadsFolder();

    ClusterManagerListPagePo.navTo();
    clusterList.list().resourceTable().sortableTable().rowElementWithName('local')
      .click();
    clusterList.list().openBulkActionDropdown();
    clusterList.list().bulkActionButton('Download YAML').click();
    const downloadedFilename = path.join(downloadsFolder, `local.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('provisioning.cattle.io/v1');
      expect(obj.metadata.name).to.equal('local');
      expect(obj.kind).to.equal('Cluster');
    });
  });

  it('can connect to kubectl shell', () => {
    ClusterManagerListPagePo.navTo();
    clusterList.list().actionMenu('local').getMenuItem('Kubectl Shell').click();

    const shellPo = new Shell();

    shellPo.terminalStatus('Connected');
    shellPo.closeTerminal();
  });
<<<<<<< HEAD

<<<<<<< HEAD
  // will only run this in jenkins pipeline where cloud credentails are stored
  describe.only('Cloud Credentials', { tags: ['@jenkins', '@adminUser', '@standardUser'] }, () => {
=======
  // will only run this in jenkins pipeline where cloud credentials are stored
  describe('Cloud Credentials', { tags: ['@jenkins', '@adminUser', '@standardUser'] }, () => {
>>>>>>> 25b6f758e (MachineDeployments MachineSets and Machines tests)
    const cloudCredentialsPage = new CloudCredentialsPagePo();
    const cloudCredName = `e2e-cloud-cred-name-${ runTimestamp }`;
    const cloudCredDescription = `e2e-cloud-cred-description-${ runTimestamp }`;
    let cloudcredentialId = '';

    it('can navigate to Cloud Credentials page', () => {
      clusterList.goTo();
      sideNav.groups().contains('RKE1 Configuration').click();
      sideNav.navToSideMenuEntryByLabel('Cloud Credentials');
      cloudCredentialsPage.waitForPage();
    });

    it('can see error when authentication fails', () => {
      cloudCredentialsPage.goTo();
      cloudCredentialsPage.create();
      cloudCredentialsPage.createEditCloudCreds().waitForPage();
      cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
      cloudCredentialsPage.createEditCloudCreds().name().set(cloudCredName);
      cloudCredentialsPage.createEditCloudCreds().description().set(cloudCredDescription);
      cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
      cloudCredentialsPage.createEditCloudCreds().secretKey().set(`${ Cypress.env('awsSecretKey') }abc`, true);
      cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
      cloudCredentialsPage.createEditCloudCreds().saveCreateForm().click();
      cy.contains('Authentication test failed, please check your credentials').should('be.visible');
    });

    it('can create cloud credentials', () => {
      cloudCredentialsPage.goTo();
      cloudCredentialsPage.create();
      cloudCredentialsPage.createEditCloudCreds().waitForPage();
      cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
      cloudCredentialsPage.createEditCloudCreds().name().set(cloudCredName);
      cloudCredentialsPage.createEditCloudCreds().description().set(cloudCredDescription);
      cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
      cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
      cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
      cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
        cloudcredentialId = req.response?.body.id;
      });
      cloudCredentialsPage.waitForPage();

      // check list details
      cloudCredentialsPage.list().details(cloudCredName, 2).should('be.visible');
    });

    it('can edit cloud credentials', () => {
      cloudCredentialsPage.goTo();
      cloudCredentialsPage.list().actionMenu(cloudCredName).getMenuItem('Edit Config').click();
      cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=edit');
      cloudCredentialsPage.createEditCloudCreds().description().set(`${ cloudCredDescription }-edit`);
      cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
      cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('PUT', '/v3/cloudCredentials/**');
      cloudCredentialsPage.waitForPage();

      // check list details
      cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
    });

    it('can clone cloud credentials', () => {
      cloudCredentialsPage.goTo();
      cloudCredentialsPage.list().actionMenu(`${ cloudCredDescription }-edit`).getMenuItem('Clone').click();
      cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=clone');
      cloudCredentialsPage.createEditCloudCreds().name().set(`${ cloudCredName }-clone`);
      cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
      cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
      cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
      cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('POST', '/v3/cloudcredentials');
      cloudCredentialsPage.waitForPage();

      // check list details
      cloudCredentialsPage.list().details(`${ cloudCredName }-clone`, 1).should('be.visible');
      cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
    });

    it('can delete cloud credentials', () => {
      cloudCredentialsPage.goTo();

      // delete clone cloud credential
      cloudCredentialsPage.list().actionMenu(`${ cloudCredName }-clone`).getMenuItem('Delete').click();
      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

      promptRemove.remove();
      cy.wait('@deleteCloudCred');
      cloudCredentialsPage.waitForPage();

      // check list details
      cy.contains(`${ cloudCredName }-clone`).should('not.exist');
    });

    it('can delete cloud credentials via bulk actions', () => {
      cloudCredentialsPage.goTo();

      // delete original cloud credential
      cloudCredentialsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(cloudCredName)
        .set();
      cloudCredentialsPage.list().resourceTable().sortableTable().deleteButton()
        .click();
      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

      promptRemove.remove();
      cy.wait('@deleteCloudCred');
      cloudCredentialsPage.waitForPage();

      // check list details
      cy.contains(cloudCredName).should('not.exist');
    });
  });

  describe('Drivers', () => {
    const driversPage = new RkeDriversPagePo('local');

    beforeEach(() => {
      cy.viewport(1380, 720);
    });

    it('can navigate to drivers page', () => {
      clusterList.goTo();
      sideNav.navToSideMenuEntryByLabel('Drivers');
      driversPage.waitForPage();
    });

    it('can refresh kubernetes metadata', () => {
      driversPage.goTo();
      cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
      driversPage.refreshKubMetadata().click({ force: true });
      cy.wait('@refresh').its('response.statusCode').should('eq', 200);
    });

    it('can create cluster driver', () => {
      // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';

      driversPage.goTo();
      driversPage.addClusterDriver().click();
      modal.input().set(downloadUrl, 0);
      cy.intercept('POST', '/v3/kontainerdriver').as('createDriver');
      modal.create();
      cy.wait('@createDriver').its('response.statusCode').should('eq', 201);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can edit cluster driver', () => {
      // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for list of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';

      driversPage.goTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      modal.input().set(downloadUrl, 0);
      cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
      modal.save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can deactivate cluster driver', () => {
      driversPage.goTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('deactivateDriver');
      modal.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Inactive');
    });

    it('can activate cluster driver', () => {
      driversPage.goTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('activateDriver');
      driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('contain.text', 'Active');
    });

    it('can delete cluster driver', () => {
      driversPage.goTo();
      driversPage.list().rowActionMenuOpen(`Example`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/kontainerDrivers/*').as('deleteDriver');
      modal.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Example').should('not.exist');
    });

    it('can edit node driver', () => {
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.goTo();
      driversPage.tabs('Node Drivers').click();
      cy.wait('@nodeDrivers');
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Edit`);
      cy.intercept('PUT', '/v3/nodeDrivers/*').as('updateDriver');
      modal.save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
    });

    it('can activate node driver', () => {
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.goTo();
      driversPage.tabs('Node Drivers').click();
      cy.wait('@nodeDrivers');
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('activateDriver');
      driversPage.actionMenu().selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Active');
    });

    it('can deactivate node driver', () => {
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.goTo();
      driversPage.tabs('Node Drivers').click();
      cy.wait('@nodeDrivers');
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('deactivateDriver');
      modal.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('contain.text', 'Inactive');
    });

    it('can delete node driver', () => {
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.goTo();
      driversPage.tabs('Node Drivers').click();
      cy.wait('@nodeDrivers');
      driversPage.list().rowActionMenuOpen(`Cloud.ca`);
      driversPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/nodeDrivers/*').as('deleteDriver');
      modal.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      driversPage.list().state('Cloud.ca').should('not.exist');
    });
  });

  describe('RKE Templates', () => {
    const rkeTemplatesPage = new RkeTemplatesPagePo('local');
    const templateName = `e2e-template-name-${ runTimestamp }`;
    const revisionName = `e2e-revision-name-${ runTimestamp }`;
    const revisionName2 = `e2e-revision-name2-${ runTimestamp }`;

    beforeEach(() => {
      cy.viewport(1380, 720);
    });

    it('can navigate to RKE templates page', () => {
      clusterList.goTo();
      sideNav.groups().contains('RKE1 Configuration').click();
      sideNav.navToSideMenuEntryByLabel('RKE Templates');
      rkeTemplatesPage.waitForPage();
    });

    it('can create RKE template and should display on RKE1 cluster creation page', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.addTemplate().click();
      rkeTemplatesPage.form().templateDetails().set(templateName);
      rkeTemplatesPage.form().templateDetails().set(revisionName, 1);
      cy.intercept('POST', '/v3/clustertemplate').as('createTemplate');
      rkeTemplatesPage.formActions().create();
      cy.wait('@createTemplate');
      rkeTemplatesPage.waitForPage();
      rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('be.visible');
      rkeTemplatesPage.groupRow().rowWithinGroupByName(templateName, revisionName).should('be.visible');

      // check RKE template displays as an option on the RKE custom cluster create page
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      const createClusterRKE1Page = new ClusterManagerCreateRke1CustomPagePo();

      createClusterRKE1Page.waitForPage();

      createClusterRKE1Page.rkeToggle().set('RKE1');
      createClusterRKE1Page.selectCustom(0);
      createClusterRKE1Page.clusterTemplateCheckbox().set();
      createClusterRKE1Page.rkeTemplateAndRevisionDropdown().selectMenuItemByOption(templateName);
      createClusterRKE1Page.selectedOption().checkOptionSelected(templateName);
      createClusterRKE1Page.selectedOption().checkOptionSelected(revisionName, 1);
    });

    it('can disable RKE template revision', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
      cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('disableTemplateRevision');
      rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Disable');
      cy.wait('@disableTemplateRevision');
      rkeTemplatesPage.mainRow().state(revisionName).contains('Active').should('not.exist');
      rkeTemplatesPage.mainRow().state(revisionName).should('contain.text', 'Disabled');
    });

    it('can enable RKE template revision', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
      cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('enableTemplateRevision');
      rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Enable');
      cy.wait('@enableTemplateRevision');
      rkeTemplatesPage.mainRow().state(revisionName).contains('Disabled').should('not.exist');
      rkeTemplatesPage.mainRow().state(revisionName).should('contain.text', 'Active');
    });

    it('can clone RKE template revision', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('be.visible');
      rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
      rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Clone Revision');
      rkeTemplatesPage.form().templateDetails().set(revisionName2);
      cy.intercept('PUT', '/v3/clusterTemplates/*').as('cloneTemplateRevision');
      rkeTemplatesPage.formActions().save();
      cy.wait('@cloneTemplateRevision');
      rkeTemplatesPage.groupRow().rowWithinGroupByName(templateName, revisionName2);
    });

    it('can delete RKE template revision', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName2);
      rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/clusterTemplateRevisions/*').as('deleteTemplateRevision');
      modal.delete();
      cy.wait('@deleteTemplateRevision').its('response.statusCode').should('eq', 204);
      rkeTemplatesPage.mainRow().rowWithName(revisionName2).should('not.exist');
    });

    it('can delete RKE template group', () => {
      rkeTemplatesPage.goTo();
      rkeTemplatesPage.groupRow().groupRowActionMenuOpen(templateName);
      rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/clusterTemplates/*').as('deleteTemplate');
      modal.delete();
      cy.wait('@deleteTemplate').its('response.statusCode').should('eq', 204);
      rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('not.exist');
    });
  });

  // will only run this in jenkins pipeline where cloud credentials are stored
  describe('Node Templates', { tags: ['@jenkins', '@adminUser'] }, () => {
    const nodeTemplatesPage = new NodeTemplatesPagePo('local');
    const templateName = `e2e-node-template-name-${ runTimestamp }`;
    let cloudCredentialId = '';

    beforeEach(() => {
      cy.viewport(1380, 720);
    });

    it('can navigate to Node templates page', () => {
      clusterList.goTo();
      sideNav.groups().contains('RKE1 Configuration').click();
      sideNav.navToSideMenuEntryByLabel('Node Templates');
      nodeTemplatesPage.waitForPage();
    });

    let removeCloudCred = false;

    it('can create a node template for Amazon EC2 and should display on RKE1 cluster creation page', () => {
      const cloudCredName = `e2e-cloud-cred-name-${ runTimestamp }`;

      cy.createAwsCloudCredentials('fleet-default', cloudCredName, 'us-west-2', Cypress.env('awsAccessKey'), Cypress.env('awsSecretKey')).then((resp: Cypress.Response<any>) => {
        cloudCredentialId = resp.body.id;
        removeCloudCred = true;
      });

      nodeTemplatesPage.goTo();
      nodeTemplatesPage.addTemplate().click();
      nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');

      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
      nodeTemplatesPage.addNodeTemplateModal().accordion().content().find('.radio .acc-label')
        .eq(0)
        .click();
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').should('exist');
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
      nodeTemplatesPage.addNodeTemplateModal().accordion().content().contains('.radio label', 'Choose one or more existing groups')
        .click();
      nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();

      nodeTemplatesPage.addNodeTemplateModal().templateName().set(templateName);
      cy.intercept('POST', '/v3/nodetemplate').as('createTemplate');

      nodeTemplatesPage.addNodeTemplateModal().create();
      cy.wait('@createTemplate');
      nodeTemplatesPage.waitForPage();
      nodeTemplatesPage.list().rowWithName(templateName).should('be.visible');

      // check RKE template displays as an option on the RKE cluster create page
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      const createClusterRKE1Page = new ClusterManagerCreateRke1Amazonec2PagePo();

      createClusterRKE1Page.waitForPage();
      createClusterRKE1Page.rkeToggle().set('RKE1');
      createClusterRKE1Page.selectCreate(0);
      createClusterRKE1Page.nodeTemplateDropdown().selectMenuItemByOption(templateName);
      createClusterRKE1Page.selectedOption().checkOptionSelected(templateName);
    });

    it('can edit a node template', () => {
      nodeTemplatesPage.goTo();
      nodeTemplatesPage.list().rowWithName(templateName).should('be.visible');
      nodeTemplatesPage.list().rowActionMenuOpen(templateName);
      nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Edit');
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
      nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ templateName }-edit`);
      cy.intercept('PUT', '/v3/nodeTemplates/**').as('editTemplate');

      nodeTemplatesPage.addNodeTemplateModal().save();
      cy.wait('@editTemplate');
      nodeTemplatesPage.waitForPage();
      nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).should('be.visible');
    });

    it('can clone a node template', () => {
      nodeTemplatesPage.goTo();
      nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).should('be.visible');
      nodeTemplatesPage.list().rowActionMenuOpen(`${ templateName }-edit`);
      nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Clone');
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
      nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
      nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ templateName }-clone`);
      cy.intercept('POST', '/v3/nodetemplate').as('cloneTemplate');

      nodeTemplatesPage.addNodeTemplateModal().save();
      cy.wait('@cloneTemplate');
      nodeTemplatesPage.waitForPage();
      nodeTemplatesPage.list().rowWithName(`${ templateName }-clone`).should('be.visible');
    });

    it('can delete a node template', () => {
      nodeTemplatesPage.goTo();

      // delete clone node template
      nodeTemplatesPage.list().rowWithName(`${ templateName }-clone`).should('be.visible');
      nodeTemplatesPage.list().rowActionMenuOpen(`${ templateName }-clone`);
      nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Delete');
      const promptRemove = new EmberPromptRemove();

      cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

      promptRemove.delete();
      cy.wait('@deleteNodeTemplate');
      nodeTemplatesPage.waitForPage();

      // check list details
      cy.contains(`${ templateName }-clone`).should('not.exist');
    });

    it('can delete a node template via bulk actions', () => {
      nodeTemplatesPage.goTo();

      // delete original node template
      nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).click();
      nodeTemplatesPage.bulkActions('Delete').click();
      const promptRemove = new EmberPromptRemove();

      cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

      promptRemove.delete();
      cy.wait('@deleteNodeTemplate');
      nodeTemplatesPage.waitForPage();

      // check list details
      cy.contains(`${ templateName }-edit`).should('not.exist');
    });

    after('clean up', () => {
      if (removeCloudCred) {
      //  delete cloud cred
        cy.deleteRancherResource('v3', 'cloudCredentials', cloudCredentialId);
      }
    });
  });

  describe('Pod Security Admissions', () => {
    const podSecurityAdmissionsPage = new PodSecurityAdmissionsPagePo('local');
    const policyAdmissionName = `e2e-pod-security-admission-name-${ runTimestamp }`;
    const policyAdmissionDescription = `e2e-pod-security-admission-description-${ runTimestamp }`;

    beforeEach(() => {
      cy.viewport(1380, 720);
    });

    it('can navigate to Pod Security Admissions', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('Pod Security Admissions');
      podSecurityAdmissionsPage.waitForPage();
    });

    it('can create a policy security admission', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.create();
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().waitForPage();
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().name().set(policyAdmissionName);
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().description().set(policyAdmissionDescription);
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates');
      podSecurityAdmissionsPage.waitForPage();

      // check list details
      podSecurityAdmissionsPage.list().details(policyAdmissionName, 1).should('be.visible');
    });

    it('can edit a policy security admission', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Edit Config').click();
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm(policyAdmissionName).waitForPage('mode=edit');
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().description().set(`${ policyAdmissionDescription }-edit`);
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('PUT', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/**');
      podSecurityAdmissionsPage.waitForPage();

      // check list details
      podSecurityAdmissionsPage.list().details(`${ policyAdmissionDescription }-edit`, 1).should('be.visible');
    });

    it('can clone a policy security admission', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Clone').click();
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm(policyAdmissionName).waitForPage('mode=clone');
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().name().set(`${ policyAdmissionName }-clone`);
      podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates');
      podSecurityAdmissionsPage.waitForPage();

      // check list details
      podSecurityAdmissionsPage.list().details(`${ policyAdmissionName }-clone`, 1).should('be.visible');
    });

    it('can download YAML for a policy security admission', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ policyAdmissionName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.apiVersion).to.equal('management.cattle.io/v3');
        expect(obj.metadata.name).to.equal(policyAdmissionName);
        expect(obj.kind).to.equal('PodSecurityAdmissionConfigurationTemplate');
      });
    });

    it('can delete a policy security admission', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.list().actionMenu(`${ policyAdmissionName }-clone`).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ policyAdmissionName }-clone`).as('deletePolicyAdmission');

      promptRemove.remove();
      cy.wait('@deletePolicyAdmission');
      podSecurityAdmissionsPage.waitForPage();

      // check list details
      cy.contains(`${ policyAdmissionName }-clone`).should('not.exist');
    });

    it('can delete a policy security admission via bulk actions', () => {
      podSecurityAdmissionsPage.goTo();
      podSecurityAdmissionsPage.list().details(policyAdmissionName, 0).click();
      podSecurityAdmissionsPage.list().resourceTable().sortableTable().deleteButton()
        .click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ policyAdmissionName }`).as('deletePolicyAdmission');

      promptRemove.remove();
      cy.wait('@deletePolicyAdmission');
      podSecurityAdmissionsPage.waitForPage();

      // check list details
      cy.contains(policyAdmissionName).should('not.exist');
    });
  });

  describe('Pod Security Policy Templates', () => {
    const podSecurityTemplatesPage = new PodSecurityPoliciesTemplatesPagePo('local');
    const templateName = `e2e-pod-security-template-name-${ runTimestamp }`;
    const templateDescription = `e2e-pod-security-template-description-${ runTimestamp }`;

    beforeEach(() => {
      cy.viewport(1380, 720);
    });

    it('can navigate to Pod Security Policy Templates', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('Pod Security Policy Templates');
      podSecurityTemplatesPage.waitForPage();
    });

    it('can create a policy template', () => {
      podSecurityTemplatesPage.goTo();
      podSecurityTemplatesPage.addPolicyTemplate().click();
      podSecurityTemplatesPage.addPodSecurityTemplateForm().templateName().set(templateName);
      cy.intercept('POST', '/v3/podsecuritypolicytemplate').as('createPolicyTemplate');
      podSecurityTemplatesPage.addPodSecurityTemplateForm().create();
      cy.wait('@createPolicyTemplate');

      // check list details
      podSecurityTemplatesPage.list().rowWithName(templateName).should('be.visible');
    });

    it('can edit a policy template', () => {
      podSecurityTemplatesPage.goTo();
      podSecurityTemplatesPage.list().rowActionMenuOpen(templateName);
      podSecurityTemplatesPage.actionMenu().selectMenuItemByLabel('Edit');

      // update template by adding a description
      podSecurityTemplatesPage.addPodSecurityTemplateForm().addDescription();
      podSecurityTemplatesPage.addPodSecurityTemplateForm().templateDescription().set(templateDescription);
      cy.intercept('PUT', '/v3/podSecurityPolicyTemplates/**').as('updatePolicyTemplate');
      podSecurityTemplatesPage.addPodSecurityTemplateForm().save();
      cy.wait('@updatePolicyTemplate');

      podSecurityTemplatesPage.list().rowWithName(templateName).find('a').click();

      podSecurityTemplatesPage.templateDescription(templateDescription).should('be.visible');
    });

    it('can delete a policy template', () => {
      podSecurityTemplatesPage.goTo();
      podSecurityTemplatesPage.list().rowActionMenuOpen(templateName);
      podSecurityTemplatesPage.actionMenu().selectMenuItemByLabel('Delete');

      const promptRemove = new EmberPromptRemove();

      cy.intercept('DELETE', '/v3/podSecurityPolicyTemplates/**').as('deletePolicyTemplate');
      promptRemove.delete();
      cy.wait('@deletePolicyTemplate');
      podSecurityTemplatesPage.waitForPage();

      // check list details
      cy.contains(templateName).should('not.exist');
    });
  });

  describe('MachineDeployments', () => {
    const machineDeploymentsPage = new MachineDeploymentsPagePo();
    const machineDeploymentsName = `e2e-machinedeployment-name-${ runTimestamp }`;
    const machineDeploymentsNameClone = `e2e-machinedeployment-name-${ runTimestamp }-clone`;
    const nsName = 'default';
    let resourceVersion = '';
    let creationTimestamp = '';
    let time = '';
    let uid = '';

    it('can navigate to MachineDeployments page', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('MachineDeployments');
      machineDeploymentsPage.waitForPage();
    });

    it('can create a MachineDeployments', () => {
      machineDeploymentsPage.goTo();
      machineDeploymentsPage.create();

      machineDeploymentsPage.createEditMachineDeployment().waitForPage('as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments.yml').then((machineDeploymentDoc) => {
        // convert yaml into json to update name value
        const json: any = jsyaml.load(machineDeploymentDoc);

        json.metadata.name = machineDeploymentsName;
        machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', '/v1/cluster.x-k8s.io.machinedeployments').as('createMachineDeployment');
      machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().click();
      cy.wait('@createMachineDeployment').then((req) => {
        resourceVersion = req.response?.body.metadata.resourceVersion;
        creationTimestamp = req.response?.body.metadata.creationTimestamp;
        time = req.response?.body.metadata.managedFields[0].time;
        uid = req.response?.body.metadata.uid;
      });
      machineDeploymentsPage.waitForPage();
      machineDeploymentsPage.list().details(machineDeploymentsName, 1).should('be.visible');
    });

    it('can edit a MachineDeployments', () => {
      machineDeploymentsPage.goTo();
      machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Edit YAML').click();
      machineDeploymentsPage.createEditMachineDeployment(nsName, machineDeploymentsName).waitForPage('mode=edit&as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments-edit.yml').then((machineSetDoc) => {
        // convert yaml into json to update values
        const json: any = jsyaml.load(machineSetDoc);

        json.spec.template.spec.bootstrap.dataSecretName = 'secretName2';
        json.metadata.creationTimestamp = creationTimestamp;
        json.metadata.managedFields.time = time;
        json.metadata.uid = uid;
        json.metadata.name = machineDeploymentsName;
        json.metadata.resourceVersion = resourceVersion;
        machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('PUT', `/v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsName }`).as('updateMachineSet');
      machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().click();
      cy.wait('@updateMachineSet').its('response.statusCode').should('eq', 200);
      machineDeploymentsPage.waitForPage();

      // check details page
      machineDeploymentsPage.list().details(machineDeploymentsName, 2).find('a').click();
      cy.contains('secretName2').scrollIntoView().should('be.visible');
    });

    it('can clone a MachineDeployments', () => {
      machineDeploymentsPage.goTo();
      machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Clone').click();
      machineDeploymentsPage.createEditMachineDeployment(nsName, machineDeploymentsName).waitForPage('mode=clone&as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments.yml').then((machineSetDoc) => {
        // convert yaml into json to update name value
        const json: any = jsyaml.load(machineSetDoc);

        json.metadata.name = machineDeploymentsNameClone;
        machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', 'v1/cluster.x-k8s.io.machinedeployments').as('cloneMachineSet');
      machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().click();
      cy.wait('@cloneMachineSet').its('response.statusCode').should('eq', 201);
      machineDeploymentsPage.waitForPage();

      // check list details
      machineDeploymentsPage.list().details(machineDeploymentsNameClone, 2).should('be.visible');
    });

    it('can download YAML', () => {
      machineDeploymentsPage.goTo();
      machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ machineDeploymentsName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
        expect(obj.metadata.name).to.equal(machineDeploymentsName);
        expect(obj.kind).to.equal('MachineDeployment');
      });
    });

    it('can delete a MachineDeployments', () => {
      machineDeploymentsPage.goTo();

      // delete original cloned MachineSet
      machineDeploymentsPage.list().actionMenu(machineDeploymentsNameClone).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsNameClone }`).as('deleteMachineSet');

      promptRemove.remove();
      cy.wait('@deleteMachineSet');
      machineDeploymentsPage.waitForPage();

      // check list details
      cy.contains(machineDeploymentsNameClone).should('not.exist');
    });

    it('can delete MachineDeployments via bulk actions', () => {
      machineDeploymentsPage.goTo();

      // delete original MachineSet
      machineDeploymentsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(machineDeploymentsName)
        .set();
      machineDeploymentsPage.list().openBulkActionDropdown();

      cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsName }`).as('deleteMachineSet');
      machineDeploymentsPage.list().bulkActionButton('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      cy.wait('@deleteMachineSet');
      machineDeploymentsPage.waitForPage();

      // check list details
      cy.contains(machineDeploymentsName).should('not.exist');
    });
  });

  describe('MachineSets', () => {
    const machineSetsPage = new MachineSetsPagePo();
    const machineSetName = `e2e-machineset-name-${ runTimestamp }`;
    const machineSetCloneName = `e2e-machineset-name-${ runTimestamp }-clone`;

    const nsName = 'default';
    let resourceVersion = '';
    let creationTimestamp = '';
    let time = '';
    let uid = '';

    it('can navigate to MachineSets page', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('MachineSets');
      machineSetsPage.waitForPage();
    });

    it('can create a MachineSet', () => {
      machineSetsPage.goTo();
      machineSetsPage.create();

      machineSetsPage.createEditMachineSet().waitForPage('as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
        // convert yaml into json to update name value
        const json: any = jsyaml.load(machineSetDoc);

        json.metadata.name = machineSetName;
        machineSetsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('createMachineSet');
      machineSetsPage.createEditMachineSet().saveCreateForm().click();
      cy.wait('@createMachineSet').then((req) => {
        resourceVersion = req.response?.body.metadata.resourceVersion;
        creationTimestamp = req.response?.body.metadata.creationTimestamp;
        time = req.response?.body.metadata.managedFields[0].time;
        uid = req.response?.body.metadata.uid;
      });
      machineSetsPage.waitForPage();
      machineSetsPage.list().details(machineSetName, 1).should('be.visible');
    });

    it('can edit a MachineSet', () => {
      machineSetsPage.goTo();
      machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Edit YAML').click();
      machineSetsPage.createEditMachineSet(nsName, machineSetName).waitForPage('mode=edit&as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets-edit.yml').then((machineSetDoc) => {
        // convert yaml into json to update values
        const json: any = jsyaml.load(machineSetDoc);

        json.spec.template.spec.bootstrap.dataSecretName = 'secretName2';
        json.metadata.creationTimestamp = creationTimestamp;
        json.metadata.managedFields.time = time;
        json.metadata.uid = uid;
        json.metadata.name = machineSetName;
        json.metadata.resourceVersion = resourceVersion;
        machineSetsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('PUT', `/v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetName }`).as('updateMachineSet');
      machineSetsPage.createEditMachineSet().saveCreateForm().click();
      cy.wait('@updateMachineSet').its('response.statusCode').should('eq', 200);
      machineSetsPage.waitForPage();

      // check details page
      machineSetsPage.list().details(machineSetName, 2).find('a').click();
      cy.contains('secretName2').should('be.visible');
    });

    it('can clone a MachineSet', () => {
      machineSetsPage.goTo();
      machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Clone').click();
      machineSetsPage.createEditMachineSet(nsName, machineSetName).waitForPage('mode=clone&as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
        // convert yaml into json to update name value
        const json: any = jsyaml.load(machineSetDoc);

        json.metadata.name = machineSetCloneName;
        machineSetsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('cloneMachineSet');
      machineSetsPage.createEditMachineSet().saveCreateForm().click();
      cy.wait('@cloneMachineSet').its('response.statusCode').should('eq', 201);
      machineSetsPage.waitForPage();

      // check list details
      machineSetsPage.list().details(machineSetCloneName, 2).should('be.visible');
    });

    it('can download YAML', () => {
      machineSetsPage.goTo();
      machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ machineSetName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
        expect(obj.metadata.name).to.equal(machineSetName);
        expect(obj.kind).to.equal('MachineSet');
      });
    });

    it('can delete a MachineSet', () => {
      machineSetsPage.goTo();

      // delete original cloned MachineSet
      machineSetsPage.list().actionMenu(machineSetCloneName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetCloneName }`).as('deleteMachineSet');

      promptRemove.remove();
      cy.wait('@deleteMachineSet');
      machineSetsPage.waitForPage();

      // check list details
      cy.contains(machineSetCloneName).should('not.exist');
    });

    it('can delete MachineSet via bulk actions', () => {
      machineSetsPage.goTo();

      // delete original MachineSet
      machineSetsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(machineSetName)
        .set();
      machineSetsPage.list().openBulkActionDropdown();

      cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetName }`).as('deleteMachineSet');
      machineSetsPage.list().bulkActionButton('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      cy.wait('@deleteMachineSet');
      machineSetsPage.waitForPage();

      // check list details
      cy.contains(machineSetName).should('not.exist');
    });
  });

  describe('Machines', () => {
    const machinesPage = new MachinesPagePo();
    const machineName = `e2e-machine-name-${ runTimestamp }`;
    const nsName = 'default';
    let resourceVersion = '';
    let creationTimestamp = '';
    let time = '';
    let uid = '';

    it('can navigate to Machines page', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('Machines');
      machinesPage.waitForPage();
    });

    it('can create a Machine', () => {
      machinesPage.goTo();
      machinesPage.create();

      machinesPage.createEditMachines().waitForPage('as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machines.yml').then((machineDoc) => {
        // convert yaml into json to update name value
        const json: any = jsyaml.load(machineDoc);

        json.metadata.name = machineName;
        json.metadata.namespace = nsName;
        json.spec.bootstrap.clusterName = 'local';
        json.spec.bootstrap.dataSecretName = 'secretName';

        machinesPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', '/v1/cluster.x-k8s.io.machines').as('createMachine');
      machinesPage.createEditMachines().saveCreateForm().click();
      cy.wait('@createMachine').then((req) => {
        resourceVersion = req.response?.body.metadata.resourceVersion;
        creationTimestamp = req.response?.body.metadata.creationTimestamp;
        time = req.response?.body.metadata.managedFields[0].time;
        uid = req.response?.body.metadata.uid;
      });
      machinesPage.waitForPage();
      machinesPage.list().details(machineName, 1).should('be.visible');
    });

    it('can edit a Machine', () => {
      machinesPage.goTo();
      machinesPage.list().actionMenu(machineName).getMenuItem('Edit YAML').click();
      machinesPage.createEditMachines(nsName, machineName).waitForPage('mode=edit&as=yaml');

      cy.readFile('cypress/e2e/blueprints/cluster_management/machines-edit.yml').then((machineDoc) => {
        // convert yaml into json to update values
        const json: any = jsyaml.load(machineDoc);

        json.spec.bootstrap.dataSecretName = 'secretName2';
        json.metadata.creationTimestamp = creationTimestamp;
        json.metadata.managedFields.time = time;
        json.metadata.uid = uid;
        json.metadata.name = machineName;
        json.metadata.resourceVersion = resourceVersion;
        machinesPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('PUT', `/v1/cluster.x-k8s.io.machines/${ nsName }/${ machineName }`).as('updateMachine');
      machinesPage.createEditMachines().saveCreateForm().click();
      cy.wait('@updateMachine').its('response.statusCode').should('eq', 200);
      machinesPage.waitForPage();

      // check details page
      machinesPage.list().details(machineName, 2).find('a').click();
      cy.contains('secretName2').should('be.visible');
    });

    it('can download YAML', () => {
      machinesPage.goTo();
      machinesPage.list().actionMenu(machineName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ machineName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
        expect(obj.metadata.name).to.equal(machineName);
        expect(obj.kind).to.equal('Machine');
      });
    });

    it('can delete a Machine', () => {
      machinesPage.goTo();
      machinesPage.list().actionMenu(machineName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/cluster.x-k8s.io.machines/${ nsName }/${ machineName }`).as('deleteCloudCred');

      promptRemove.remove();
      cy.wait('@deleteCloudCred');
      machinesPage.waitForPage();

      // check list details
      cy.contains(machineName).should('not.exist');
    });
  });

  describe('Repositories', () => {
    const repositoriesPage = new RepositoriesPagePo('local', 'manager');
    const repoName = `e2e-repo-name-${ runTimestamp }`;
    const repoDescription = `e2e-repo-description-${ runTimestamp }`;
    const repoNameClone = `e2e-repo-name-${ runTimestamp }-clone`;

    it('can navigate to Repositories page', () => {
      clusterList.goTo();
      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('Repositories');
      repositoriesPage.waitForPage();
    });

    it('can create a repository', () => {
      repositoriesPage.goTo();
      repositoriesPage.create();
      repositoriesPage.createEditRepositories().waitForPage();
      repositoriesPage.createEditRepositories().name().set(repoName);
      repositoriesPage.createEditRepositories().description().set(repoDescription);
      repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
      repositoriesPage.createEditRepositories().gitRepoUrl().set('https://git.rancher.io/charts');
      repositoriesPage.createEditRepositories().gitBranch().set('release-v2.8');
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(repoName, 2).should('be.visible');
      repositoriesPage.list().details(repoName, 1).contains('In Progress').should('be.visible');
      repositoriesPage.list().details(repoName, 1).contains('Active').should('be.visible');
    });

    it('can refresh a repository', () => {
      repositoriesPage.goTo();
      cy.intercept('PUT', `/v1/catalog.cattle.io.clusterrepos/${ repoName }`).as('refreshRepo');
      repositoriesPage.list().actionMenu(repoName).getMenuItem('Refresh').click();
      cy.wait('@refreshRepo').its('response.statusCode').should('eq', 200);

      // check list details
      repositoriesPage.list().details(repoName, 1).contains('In Progress').should('be.visible');
      repositoriesPage.list().details(repoName, 1).contains('Active').should('be.visible');
    });

    it('can edit a repository', () => {
      repositoriesPage.goTo();
      repositoriesPage.list().actionMenu(repoName).getMenuItem('Edit Config').click();
      repositoriesPage.createEditRepositories(repoName).waitForPage('mode=edit');
      repositoriesPage.createEditRepositories().description().set(`${ repoDescription }-edit`);

      repositoriesPage.createEditRepositories().saveAndWaitForRequests('PUT', `/v1/catalog.cattle.io.clusterrepos/${ repoName }`);
      repositoriesPage.waitForPage();

      // check details page
      repositoriesPage.list().details(repoName, 2).click();
      cy.contains(`${ repoDescription }-edit`).should('be.visible');
    });

    it('can clone a repository', () => {
      repositoriesPage.goTo();
      repositoriesPage.list().actionMenu(repoName).getMenuItem('Clone').click();
      repositoriesPage.createEditRepositories(repoName).waitForPage('mode=clone');
      repositoriesPage.createEditRepositories().name().set(repoNameClone);
      repositoriesPage.createEditRepositories().description().set(`${ repoDescription }-clone`);
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(repoNameClone, 2).should('be.visible');
    });

    it('can download YAML', () => {
      repositoriesPage.goTo();
      repositoriesPage.list().actionMenu(repoName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ repoName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.apiVersion).to.equal('catalog.cattle.io/v1');
        expect(obj.metadata.name).to.equal(repoName);
        expect(obj.kind).to.equal('ClusterRepo');
      });
    });

    it('can delete a repository', () => {
      repositoriesPage.goTo();

      // delete original cloned Repository
      repositoriesPage.list().actionMenu(repoNameClone).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ repoNameClone }`).as('deleteRepository');

      promptRemove.remove();
      cy.wait('@deleteRepository');
      repositoriesPage.waitForPage();

      // check list details
      cy.contains(repoNameClone).should('not.exist');
    });

    it('can delete a repository via bulk actions', () => {
      repositoriesPage.goTo();

      // delete original Repository
      repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(repoName)
        .set();
      repositoriesPage.list().openBulkActionDropdown();

      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ repoName }`).as('deleteRepository');
      repositoriesPage.list().bulkActionButton('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      cy.wait('@deleteRepository');
      repositoriesPage.waitForPage();

      // check list details
      cy.contains(repoName).should('not.exist');
    });
  });
=======
>>>>>>> 3a7267c65 (add tags and split out each describe into its own spec file)
});
