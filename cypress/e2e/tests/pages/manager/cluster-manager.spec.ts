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
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import ClusterManagerEditImportedPagePo from '@/cypress/e2e/po/extensions/imported/cluster-edit.po';
import ClusterManagerNamespacePagePo from '@/cypress/e2e/po/pages/cluster-manager/namespace.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import ClusterManagerCreateRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import Shell from '@/cypress/e2e/po/components/shell.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { snapshot } from '@/cypress/e2e/blueprints/manager/cluster-snapshots';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { nodeDriveResponse } from '@/cypress/e2e/tests/pages/manager/mock-responses';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import { EXTRA_LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/prompts/deactivateDriverDialog.po';

// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const namespace = 'fleet-default';
const type = 'provisioning.cattle.io.cluster';
const importType = 'cluster';
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;
const rke2CustomName = `${ clusterNamePartial }-rke2-custom`;
const importGenericName = `${ clusterNamePartial }-import-generic`;
let reenableAKS = false;
let importedClusterName = '';

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Cluster Manager', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  before(() => {
    cy.login();
  });

  // testing https://github.com/rancher/dashboard/issues/9823
  it('Toggling the feature flag "rke1-ui" to false should not display RKE toggle on cluster creation screen and hide RKE1 resources from nav', () => {
    cy.fetchRevision().then((revision) => {
      cy.intercept('GET', 'v1/management.cattle.io.features?*', {
        type:         'collection',
        resourceType: 'management.cattle.io.feature',
        revision,
        data:         [
          {
            id:     'rke1-ui',
            type:   'management.cattle.io.feature',
            kind:   'Feature',
            spec:   { value: false },
            status: {
              default:     true,
              description: 'Disable RKE1 provisioning',
              dynamic:     false,
              lockedValue: false
            }
          }
        ]
      }).as('featuresGet');

      const clusterCreate = new ClusterManagerCreatePagePo();

      clusterCreate.goTo();
      clusterCreate.waitForPage();

      // seems like the waitForPage does await for full DOM render, so let's wait for a simple assertion
      // like "gridElementExists" to make sure we aren't creating a fake assertion with the toggle
      clusterCreate.gridElementExistanceByName('Linode', 'exist');
      clusterCreate.rkeToggleExistance('not.exist');

      const sideNav = new ProductNavPo();

      // check that the nav group isn't visible anymore
      sideNav.navToSideMenuGroupByLabelExistence('RKE1 Configuration', 'not.exist');
    });
  });

  it('deactivating a kontainer driver should hide its card from the cluster creation page', () => {
    cy.intercept('GET', '/v3/kontainerdrivers').as('getKontainerDrivers');
    cy.intercept('POST', 'v3/kontainerDrivers/azurekubernetesservice?action=deactivate').as('deactivateDriver');
    cy.intercept('POST', 'v3/kontainerDrivers/azurekubernetesservice?action=activate').as('activateDriver');

    const driversPage = new KontainerDriversPagePo();
    const clusterCreatePage = new ClusterManagerCreatePagePo();

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();

    // assert AKS kontainer driver is in Active state
    cy.wait('@getKontainerDrivers').then(({ response }) => {
      response.body.data.forEach((item: any) => {
        if (item.id === 'azurekubernetesservice') {
          const state = item['active'];

          expect(state).to.eq(true);
        }
      });
    });

    // deactivate the AKS driver
    driversPage.list().actionMenu('Azure AKS').getMenuItem('Deactivate').click();
    const deactivateDialog = new DeactivateDriverDialogPo();

    deactivateDialog.deactivate();
    cy.wait('@deactivateDriver').its('response.statusCode').should('eq', 200).then(() => {
      reenableAKS = true;
    });

    // verify that the AKS card is not shown
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();
    clusterCreatePage.gridElementExistanceByName('Azure AKS', 'not.exist');

    // re-enable the AKS kontainer driver
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().actionMenu('Azure AKS').getMenuItem('Activate').click();
    cy.wait('@activateDriver').its('response.statusCode').should('eq', 200).then(() => {
      reenableAKS = false;
    });

    // verify that the AKS card is back
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();
    clusterCreatePage.gridElementExistanceByName('Azure AKS', 'exist');
  });

  it('deleting a kontainer driver should hide its card from the cluster creation page', () => {
    // intercept get request for kontainer drivers
    cy.intercept('GET', '/v1/management.cattle.io.kontainerdriver*', (req) => {
      req.reply( {
        type:         'collection',
        resourceType: 'management.cattle.io.kontainerdriver',
        count:        0,
        data:         []
      });
    } ).as('kontainerDrivers');

    const clusterCreatePage = new ClusterManagerCreatePagePo();

    // verify that the AKS card is not shown
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    clusterCreatePage.waitForPage();
    cy.wait('@kontainerDrivers');

    clusterCreatePage.rkeToggleExistance('exist');
    clusterCreatePage.gridElementExistanceByName('Azure AKS', 'not.exist');

    clusterCreatePage.gridElementGroupTitles().should('have.length', 2);

    clusterCreatePage.gridElementGroupTitles().eq(0).should('not.contain.text', 'Create a cluster');

    clusterCreatePage.gridElementGroupTitles().eq(0).should('contain.text', 'Provision new nodes');
    clusterCreatePage.gridElementGroupTitles().eq(1).should('contain.text', 'Use existing nodes');
  });

  describe('All providers', () => {
    providersList.forEach((prov) => {
      prov.conditions.forEach((condition) => {
        it(`should be able to access cluster creation for provider ${ prov.label } with rke type ${ condition.rkeType } via url`, () => {
          const clusterCreate = new ClusterManagerCreatePagePo();

          clusterCreate.goTo(`type=${ prov.clusterProviderQueryParam }&rkeType=${ condition.rkeType }`);
          clusterCreate.waitForPage();

          loadingPo.checkNotExists();
          const fnName = condition.loads === 'rke1' ? 'rke1PageTitle' : 'rke2PageTitle';
          const evaluation = condition.loads === 'rke1' ? `Add Cluster - ${ condition.label ? condition.label : prov.label }` : `Create ${ condition.label ? condition.label : prov.label }`;

          clusterCreate[fnName]().should('contain', evaluation);
        });
      });
    });
  });

  describe('Created', () => {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();
    const detailRKE2ClusterPage = new ClusterManagerDetailRke2CustomPagePo(undefined, rke2CustomName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    describe('RKE2 Custom', { tags: ['@jenkins', '@customCluster'] }, () => {
      const editCreatedClusterPage = new ClusterManagerEditRke2CustomPagePo(undefined, rke2CustomName);

      it('can create new cluster', () => {
        cy.intercept('POST', `/v1/${ type }s`).as('createRequest');
        const request = {
          type,
          metadata: {
            namespace,
            name: rke2CustomName
          },
          // Test for https://github.com/rancher/dashboard/issues/10338 (added option 'none' for CNI)
          // The test validate the warning when selecting none, but now this get back to calico.
          // A CNI is mandatory to get the cluster active otherwise manual intervention is needed or
          // the use of a cloud provider but that's not in scope.
          spec: { rkeConfig: { machineGlobalConfig: { cni: 'calico' }, machinePoolDefaults: { hostnameLengthLimit: 15 } } }
        };

        cy.userPreferences();

        clusterList.goTo();

        // check if burguer menu nav is highlighted correctly for cluster manager
        BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Cluster Management');

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createRKE2ClusterPage.waitForPage();

        // Test for https://github.com/rancher/dashboard/issues/9823 (default is feature flag 'rke1-ui' = true)
        createRKE2ClusterPage.rkeToggleExistance('exist');

        const sideNav = new ProductNavPo();

        sideNav.navToSideMenuGroupByLabelExistence('RKE1 Configuration', 'exist');
        // EO test for https://github.com/rancher/dashboard/issues/9823

        createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');

        createRKE2ClusterPage.selectCustom(0);
        createRKE2ClusterPage.nameNsDescription().name().set(rke2CustomName);

        // Test for https://github.com/rancher/dashboard/issues/10338 (added option 'none' for CNI)
        createRKE2ClusterPage.basicsTab().networks().checkExists();
        createRKE2ClusterPage.basicsTab().networks().self().scrollIntoView();
        createRKE2ClusterPage.basicsTab().networks().toggle();
        createRKE2ClusterPage.basicsTab().networks().clickOptionWithLabel('none');
        createRKE2ClusterPage.basicsTab().networks().checkOptionSelected('none');

        // banner with additional info about 'none' option should be visible
        createRKE2ClusterPage.basicsTab().networkNoneSelectedForCni().should('exist');
        // EO test for https://github.com/rancher/dashboard/issues/10338 (added option 'none' for CNI)

        createRKE2ClusterPage.basicsTab().networks().toggle();
        createRKE2ClusterPage.basicsTab().networks().clickOptionWithLabel('calico');
        createRKE2ClusterPage.basicsTab().networks().checkOptionSelected('calico');

        // testing https://github.com/rancher/dashboard/issues/10159
        createRKE2ClusterPage.selectTab(tabbedPo, '[data-testid="btn-networking"]');
        createRKE2ClusterPage.network().truncateHostnameCheckbox().set();
        // EO test for https://github.com/rancher/dashboard/issues/10159

        createRKE2ClusterPage.create();

        cy.wait('@createRequest').then((intercept) => {
          // Issue with linter https://github.com/cypress-io/eslint-plugin-cypress/issues/3
          expect(isMatch(intercept.request.body, request)).to.equal(true);
        });

        detailRKE2ClusterPage.waitForPage(undefined, 'registration');

        createRKE2ClusterPage.activateInsecureRegistrationCommandFromUI().click();
        createRKE2ClusterPage.commandFromCustomClusterUI().then(($value) => {
          const registrationCommand = $value.text();

          cy.exec(`echo ${ Cypress.env('customNodeKey') } | base64 -d > custom_node.key && chmod 600 custom_node.key`).then((result) => {
            cy.log('Creating the custom_node.key');
            cy.log(result.stderr);
            cy.log(result.stdout);
            expect(result.code).to.eq(0);
          });
          cy.exec(`head custom_node.key`).then((result) => {
            cy.log(result.stdout);
            cy.log(result.stderr);
            expect(result.code).to.eq(0);
          });
          cy.exec(createRKE2ClusterPage.customClusterRegistrationCmd(registrationCommand)).then((result) => {
            cy.log(result.stderr);
            cy.log(result.stdout);
            expect(result.code).to.eq(0);
          });
        });
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.list().state(rke2CustomName).should('contain.text', 'Updating');
        clusterList.list().state(rke2CustomName).contains('Active', { timeout: 300000 }); // super long timeout needed for cluster provisioning to complete
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

      it('will disbable saving if an addon config has invalid data', () => {
        clusterList.goTo();

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createRKE2ClusterPage.waitForPage();

        createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');

        createRKE2ClusterPage.selectCustom(0);

        createRKE2ClusterPage.nameNsDescription().name().set('abc');

        createRKE2ClusterPage.clusterConfigurationTabs().clickTabWithSelector('#rke2-calico');

        createRKE2ClusterPage.resourceDetail().createEditView().saveButtonPo().expectToBeEnabled();

        createRKE2ClusterPage.calicoAddonConfig().yamlEditor().input().set('badvalue: -');
        createRKE2ClusterPage.resourceDetail().createEditView().saveButtonPo().expectToBeDisabled();

        createRKE2ClusterPage.calicoAddonConfig().yamlEditor().input().set('goodvalue: yay');
        createRKE2ClusterPage.resourceDetail().createEditView().saveButtonPo().expectToBeEnabled();
      });

      it('can view cluster YAML editor', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit YAML').click();

        editCreatedClusterPage.waitForPage('mode=edit&as=yaml');
        editCreatedClusterPage.resourceDetail().resourceYaml().checkVisible();
      });

      it('can download KubeConfig', () => {
        clusterList.goTo();
        cy.intercept('POST', '/v3/clusters/**').as('generateKubeconfig');
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Download KubeConfig').click();
        cy.wait('@generateKubeconfig').its('response.statusCode').should('eq', 200);

        const downloadedFilename = path.join(downloadsFolder, `${ rke2CustomName }.yaml`);

        cy.readFile(downloadedFilename).then((buffer) => {
          // This will throw an exception which will fail the test if not valid yaml
          const obj: any = jsyaml.load(buffer);

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
        clusterList.sortableTable().rowElementWithName(rke2CustomName).should('exist', MEDIUM_TIMEOUT_OPT);
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

    describe('RKE1 Custom', { tags: ['@jenkins'] }, () => {
      it('can create new cluster', () => {
        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createClusterRKE1Page.waitForPage();

        createClusterRKE1Page.rkeToggle().set('RKE1');
        createClusterRKE1Page.selectCustom(0);
        loadingPo.checkNotExists(MEDIUM_TIMEOUT_OPT);

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
        createClusterRKE1Page.etcdRole().click();
        createClusterRKE1Page.cpRole().click();
        createClusterRKE1Page.registrationCommand().then(($value) => {
          const registrationCommand = $value.text().replace('sudo', '');

          cy.log(registrationCommand);

          cy.exec(`echo ${ Cypress.env('customNodeKeyRke1') } | base64 -d > custom_node_rke1.key && chmod 600 custom_node_rke1.key`).then((result) => {
            cy.log('Creating the custom_node_rke1.key');
            cy.log(result.stderr);
            cy.log(result.stdout);
            expect(result.code).to.eq(0);
          });
          cy.exec(`head custom_node_rke1.key`).then((result) => {
            cy.log(result.stdout);
            cy.log(result.stderr);
            expect(result.code).to.eq(0);
          });
          cy.exec(createClusterRKE1Page.customClusterRegistrationCmd(registrationCommand, 1), { failOnNonZeroExit: false, timeout: 120000 }).then((result) => {
            cy.log(result.stderr);
            cy.log(result.stdout);
          });
        });
        createClusterRKE1Page.done();

        clusterList.waitForPage();
        clusterList.sortableTable().rowElementWithName(rke1CustomName).should('exist');
        clusterList.list().state(rke1CustomName).should('contain.text', 'Provisioning');
        clusterList.list().state(rke1CustomName).contains('Active', { timeout: 500000 }); // super long timeout needed for cluster provisioning to complete
      });

      // it.skip('can create new snapshots', () => {
      // });

      it('can show snapshots list', () => {
        clusterList.goToClusterListAndGetClusterDetails(rke1CustomName).then((cluster) => {
          const snapshots = new ClusterManagerDetailSnapshotsPo(undefined, cluster.id);

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

          snapshots.list().resourceTable().sortableTable().groupElementWithName('Location')
            .should('have.length', 1); // 1 group row

          snapshots.list().resourceTable().sortableTable().rowElements()
            .should('have.length.gte', 2); // 2 main rows
        });
      });

      // it.skip('can delete snapshots', () => {
      // });

      it('can delete cluster', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke1CustomName).getMenuItem('Delete').click();

        const promptRemove = new PromptRemove();

        promptRemove.confirm(rke1CustomName);
        promptRemove.remove();

        clusterList.sortableTable().rowElementWithName(rke1CustomName, MEDIUM_TIMEOUT_OPT).should('not.exist', MEDIUM_TIMEOUT_OPT);
      });
    });
  });

  describe('Imported', { tags: ['@jenkins', '@importedCluster'] }, () => {
    const importClusterPage = new ClusterManagerImportGenericPagePo();
    const fqdn = 'fqdn';
    const cacert = 'cacert';
    const privateRegistry = 'registry.io';

    describe('Generic', () => {
      it('can create new cluster', () => {
        cy.intercept('POST', `/v3/${ importType }s`).as('importRequest');

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.importCluster();

        importClusterPage.waitForPage('mode=import');
        importClusterPage.selectGeneric(0);
        // Verify that we only show when editing
        importClusterPage.repositoriesAccordion().should('not.be.visible');
        importClusterPage.nameNsDescription().name().set(importGenericName);
        importClusterPage.create();

        cy.wait('@importRequest').then((intercept) => {
          importedClusterName = intercept.response.body.id;
          cy.wrap(intercept.response.body.id).as('importedClusterId');

          expect(intercept.request.body).to.deep.equal({
            type:         importType,
            agentEnvVars: [],
            annotations:  {},
            labels:       {},
            name:         importGenericName

          });
        });
        cy.get('@importedClusterId').then((importedClusterId) => {
          const detailClusterPage = new ClusterManagerDetailImportedGenericPagePo(undefined, importedClusterId.toString());

          detailClusterPage.waitForPage(undefined, 'registration');
          detailClusterPage.kubectlCommandForImported().contains('--insecure').then(($value) => {
            const kubectlCommand = $value.text();

            expect(kubectlCommand).to.contain('--insecure');
            cy.log(kubectlCommand);
            cy.exec(kubectlCommand, { failOnNonZeroExit: false }).then((result) => {
              cy.log(result.stderr);
              cy.log(result.stdout);
              expect(result.code).to.eq(0);
            });
          });
        });

        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.list().state(importGenericName).contains('Pending');
        clusterList.list().state(importGenericName).contains('Waiting', EXTRA_LONG_TIMEOUT_OPT);
        clusterList.list().state(importGenericName).contains('Active', EXTRA_LONG_TIMEOUT_OPT);
        // Issue #6836: Provider field on Imported clusters states "Imported" instead of cluster type
        clusterList.list().provider(importGenericName).should('contain.text', 'Imported');
        clusterList.list().providerSubType(importGenericName).should('contain.text', 'K3s');
      });

      it('can edit imported cluster and see changes afterwards', () => {
        const editImportedClusterPage = new ClusterManagerEditImportedPagePo(undefined, importedClusterName);

        cy.intercept('GET', '/v1-rke2-release/releases').as('getRke2Releases');
        clusterList.goTo();
        clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click();
        editImportedClusterPage.waitForPage('mode=edit');

        editImportedClusterPage.nameNsDescription().name().value().should('eq', importGenericName );
        // Issue #10432: Edit Cluster screen falsely gives impression imported cluster's name and description can be edited
        editImportedClusterPage.nameNsDescription().name().expectToBeDisabled();

        editImportedClusterPage.enableNetworkAccordion();
        editImportedClusterPage.ace().enable();
        editImportedClusterPage.ace().enterFdqn(fqdn);
        editImportedClusterPage.ace().enterCaCerts(cacert);

        editImportedClusterPage.enableRepositoriesAccordion();
        editImportedClusterPage.enablePrivateRegistryCheckbox();
        editImportedClusterPage.privateRegistry().set(privateRegistry);

        editImportedClusterPage.save();

        // We should be taken back to the list page if the save was successful
        clusterList.waitForPage();

        clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click();

        editImportedClusterPage.waitForPage('mode=edit');
        editImportedClusterPage.ace().fqdn().value().should('eq', fqdn );
        editImportedClusterPage.ace().caCerts().value().should('eq', cacert );

        // Verify the private registry values
        editImportedClusterPage.privateRegistryCheckbox().isChecked();
        editImportedClusterPage.privateRegistry().value().should('eq', privateRegistry);
      });

      it('can delete cluster by bulk actions', () => {
        clusterList.goTo();
        clusterList.sortableTable().rowElementWithName(importGenericName).should('exist', MEDIUM_TIMEOUT_OPT);
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

  describe('Cluster Details Tabs', () => {
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');
    const clusterDetail = new ClusterManagerDetailImportedGenericPagePo(undefined, 'local');

    beforeEach( () => {
      ClusterManagerListPagePo.navTo();
      const clusterList = new ClusterManagerListPagePo('_');

      clusterList.waitForPage();
      clusterList.clickOnClusterName('local');
    });

    it('can navigate to Cluster Conditions Page', () => {
      clusterDetail.selectTab(tabbedPo, '[data-testid="btn-conditions"]');

      clusterDetail.waitForPage(undefined, 'conditions');
      clusterDetail.conditionsList().details('Ready', 1).should('include.text', 'True');
    });

    it('can navigate to Cluster Related Page', () => {
      clusterDetail.selectTab(tabbedPo, '[data-testid="btn-related"]');

      clusterDetail.waitForPage(undefined, 'related');
      clusterDetail.referredToList().details('Mgmt', 2).should('include.text', 'local');
    });

    it('can navigate to Cluster Provisioning Log Page', () => {
      clusterDetail.selectTab(tabbedPo, '[data-testid="btn-log"]');

      clusterDetail.waitForPage(undefined, 'log');
      clusterDetail.logsContainer().should('be.visible');
    });

    it('can navigate to Cluster Machines Page', () => {
      clusterDetail.selectTab(tabbedPo, '[data-testid="btn-node-pools"]');

      clusterDetail.waitForPage(undefined, 'node-pools');
      clusterDetail.machinePoolsList().resourceTable().sortableTable().noRowsShouldNotExist();
      clusterDetail.machinePoolsList().details('machine-', 2).should('be.visible');
      clusterDetail.machinePoolsList().downloadYamlButton().should('be.disabled');
    });

    it('can navigate to namespace from cluster detail view', () => {
      clusterDetail.waitForPage();

      clusterDetail.namespace().should('contain.text', 'fleet-local');
      clusterDetail.namespace().click();

      const nsPage = new ClusterManagerNamespacePagePo();

      nsPage.waitForPage(undefined, 'Resources');
      nsPage.namespace().should('contain.text', 'fleet-local');
    });
  });

  it(`can navigate to local cluster's explore product`, () => {
    const clusterName = 'local';
    const clusterDashboard = new ClusterDashboardPagePo(clusterName);

    clusterList.goTo();
    clusterList.list().explore(clusterName).click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');
  });

  it('can download YAML via bulk actions', () => {
    // Delete downloads directory. Need a fresh start to avoid conflicting file names
    cy.deleteDownloadsFolder();

    ClusterManagerListPagePo.navTo();
    clusterList.list().resourceTable().sortableTable().rowElementWithName('local')
      .click();
    clusterList.list().openBulkActionDropdown();
    clusterList.list().bulkActionButton('Download YAML').click({ force: true });
    const downloadedFilename = path.join(downloadsFolder, `local.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('provisioning.cattle.io/v1');
      expect(obj.metadata.name).to.equal('local');
      expect(obj.kind).to.equal('Cluster');
    });
  });

  it('can download KubeConfig via bulk actions', () => {
    // Delete downloads directory. Need a fresh start to avoid conflicting file names
    cy.deleteDownloadsFolder();

    ClusterManagerListPagePo.navTo();
    clusterList.list().resourceTable().sortableTable().rowElementWithName('local')
      .click();
    cy.intercept('POST', '/v3/clusters/local?action=generateKubeconfig').as('generateKubeConfig');
    clusterList.list().downloadKubeConfig().click({ force: true });
    cy.wait('@generateKubeConfig').its('response.statusCode').should('eq', 200);
    const downloadedFilename = path.join(downloadsFolder, 'local.yaml');

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('v1');
      expect(obj.clusters[0].name).to.equal('local');
      expect(obj.kind).to.equal('Config');
    });
  });

  it('can connect to kubectl shell', () => {
    ClusterManagerListPagePo.navTo();
    clusterList.list().actionMenu('local').getMenuItem('Kubectl Shell').click();

    const shellPo = new Shell();

    shellPo.terminalStatus('Connected');
    shellPo.closeTerminal();
  });

  describe('Credential Step', () => {
    const drivers = ['nutanix', 'oci'];

    Cypress._.each(drivers, (driver) => {
      describe(`should always show credentials for ${ driver } driver`, () => {
        it('should show credential step when `addCloudCredential` is true', () => {
          cy.intercept({
            method: 'GET',
            path:   `/v1/management.cattle.io.nodedrivers*`,
          }, (req) => {
            req.continue((res) => {
              res.body.data = nodeDriveResponse(true, driver).data;
            });
          });
          const clusterCreate = new ClusterManagerCreatePagePo();

          clusterCreate.goTo(`type=${ driver }&rkeType=rke2`);
          clusterCreate.waitForPage();

          clusterCreate.credentialsBanner().checkExists();
        });

        it('should show credential step when `addCloudCredential` is false', () => {
          cy.intercept({
            method: 'GET',
            path:   `/v1/management.cattle.io.nodedrivers*`,
          }, (req) => {
            req.continue((res) => {
              res.body.data = nodeDriveResponse(false, driver).data;
            });
          });
          const clusterCreate = new ClusterManagerCreatePagePo();

          clusterCreate.goTo(`type=${ driver }&rkeType=rke2`);
          clusterCreate.waitForPage();

          clusterCreate.credentialsBanner().checkExists();
        });
      });
    });

    const driver2 = 'outscale';

    describe('should show on condition of addCloudCredential', () => {
      it('should show credential step when `addCloudCredential` is true', () => {
        cy.intercept({
          method: 'GET',
          path:   `/v1/management.cattle.io.nodedrivers*`,
        }, (req) => {
          req.continue((res) => {
            res.body.data = nodeDriveResponse(true, driver2).data;
          });
        });
        const clusterCreate = new ClusterManagerCreatePagePo();

        clusterCreate.goTo(`type=${ driver2 }&rkeType=rke2`);
        clusterCreate.waitForPage();

        clusterCreate.credentialsBanner().checkExists();
      });

      it('should NOT show credential step when `addCloudCredential` is false', () => {
        cy.intercept({
          method: 'GET',
          path:   `/v1/management.cattle.io.nodedrivers*`,
        }, (req) => {
          req.continue((res) => {
            res.body.data = nodeDriveResponse(false, driver2).data;
          });
        });
        const clusterCreate = new ClusterManagerCreatePagePo();

        clusterCreate.goTo(`type=${ driver2 }&rkeType=rke2`);
        clusterCreate.waitForPage();

        clusterCreate.credentialsBanner().checkNotExists();
      });
    });
  });

  after(() => {
    if (reenableAKS) {
      cy.createRancherResource('v3', 'kontainerDrivers/azurekubernetesservice?action=activate', {});
    }
  });
});
