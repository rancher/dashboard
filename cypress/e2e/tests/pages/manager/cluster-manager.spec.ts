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
import { snapshot } from '@/cypress/e2e/blueprints/manager/cluster-snapshots';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import RkeDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-drivers.po';
import EmberListPo from '@/cypress/e2e/po/components/ember/ember-list.po';
import EmberDropdownPo from '@/cypress/e2e/po/components/ember/ember-dropdown.po';
import EmberModalClusterDriverPo from '~/cypress/e2e/po/components/ember/ember-modal-add-edit-cluster-driver.po';
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
  const sideNav = new ProductNavPo();

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
  it('can connect to kubectl shell', () => {
    ClusterManagerListPagePo.navTo();
    clusterList.list().actionMenu('local').getMenuItem('Kubectl Shell').click();

    const shellPo = new Shell();

    shellPo.terminalStatus('Connected');
    shellPo.closeTerminal();
  });
  describe('Cloud Credentials', { tags: ['@jenkins', '@adminUser', '@standardUser'] }, () => { // only run this in jenkins  pipeline
    it('can see error when authentication fails', () => {
      clusterList.goTo();
      cy.contains('Authentication test failed, please check your credentials');
    });
    it('can create cloud credentials', () => {
    });
    it('can edit cloud credentials', () => {
      // edit description
    });
    it('can clone cloud credentials', () => {
    });
    it('can delete cloud credentials', () => {
    });
  });
  describe('Drivers', () => {
    const driversPage = new RkeDriversPagePo('local');
    const emberList = new EmberListPo('table.grid.sortable-table');
    const emberActions = new EmberListPo('.has-tabs');
    const emberDropdown = new EmberDropdownPo('.ember-basic-dropdown-content');
    const modal = new EmberModalClusterDriverPo();

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
      emberActions.actions('Refresh Kubernetes Metadata').click({ force: true });
      cy.wait('@refresh').its('response.statusCode').should('eq', 200);
    });

    it('can create cluster driver', () => {
      // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64';

      driversPage.goTo();
      emberActions.actions('Add Cluster Driver').click();
      modal.input().set(downloadUrl, 0);
      cy.intercept('POST', '/v3/kontainerdriver').as('createDriver');
      modal.create();
      cy.wait('@createDriver').its('response.statusCode').should('eq', 201);
      emberList.state('Example').should('contain.text', 'Active');
    });

    it('can edit cluster driver', () => {
      // see https://github.com/rancher-plugins/kontainer-engine-driver-example/releases for lsit of example drivers
      const downloadUrl = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy2-linux-amd64';

      driversPage.goTo();
      emberList.rowActionMenuOpen(`Example`);
      emberDropdown.selectMenuItemByLabel(`Edit`);
      modal.input().set(downloadUrl, 0);
      cy.intercept('PUT', '/v3/kontainerDrivers/*').as('updateDriver');
      modal.save();
      cy.wait('@updateDriver').its('response.statusCode').should('eq', 200);
      emberList.state('Example').should('contain.text', 'Active');
    });

    it('can deactivate cluster driver', () => {
      driversPage.goTo();
      emberList.rowActionMenuOpen(`Example`);
      emberDropdown.selectMenuItemByLabel(`Deactivate`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('deactivateDriver');
      modal.deactivate();
      cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200);
      emberList.state('Example').should('contain.text', 'Inactive');
    });

    it('can activate cluster driver', () => {
      driversPage.goTo();
      emberList.rowActionMenuOpen(`Example`);
      cy.intercept('POST', '/v3/kontainerDrivers/*').as('activateDriver');
      emberDropdown.selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      emberList.state('Example').should('contain.text', 'Active');
    });

    it('can delete cluster driver', () => {
      driversPage.goTo();
      emberList.rowActionMenuOpen(`Example`);
      emberDropdown.selectMenuItemByLabel(`Delete`);
      cy.intercept('DELETE', '/v3/kontainerDrivers/*').as('deleteDriver');
      modal.delete();
      cy.wait('@deleteDriver').its('response.statusCode').should('eq', 200);
      emberList.state('Example').should('not.exist');
    });

    it('can activate node driver', () => {
      cy.viewport(1380, 720);
      cy.intercept('GET', '/v3/nodedrivers?limit=-1&sort=name').as('nodeDrivers');
      driversPage.goTo();
      emberActions.actions('Node Drivers').click();
      cy.wait('@nodeDrivers');
      emberList.rowActionMenuOpen(`Exoscale`);
      cy.intercept('POST', '/v3/nodeDrivers/**').as('activateDriver');
      emberDropdown.selectMenuItemByLabel(`Activate`);
      cy.wait('@activateDriver').its('response.statusCode').should('eq', 200);
      emberList.state('Exoscale').should('contain.text', 'Active');
    });
  });
});
