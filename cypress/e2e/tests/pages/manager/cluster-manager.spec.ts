import { isMatch } from 'lodash';

import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import { providersList } from '@/cypress/e2e/blueprints/manager/clusterProviderUrlCheck';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ClusterManagerDetailRke2CustomPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-custom.po';
import ClusterManagerDetailImportedGenericPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-import-generic.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import ClusterManagerEditRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke2-custom.po';
import ClusterManagerImportGenericPagePo from '@/cypress/e2e/po/extensions/imported/cluster-import-generic.po';
import ClusterManagerEditImportedPagePo from '@/cypress/e2e/po/extensions/imported/cluster-edit.po';
import ClusterManagerNamespacePagePo from '@/cypress/e2e/po/pages/cluster-manager/namespace.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import Shell from '@/cypress/e2e/po/components/shell.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { nodeDriveResponse } from '@/cypress/e2e/tests/pages/manager/mock-responses';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import { EXTRA_LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import HostedProvidersPagePo from '@/cypress/e2e/po/pages/cluster-manager/hosted-providers.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const namespace = 'fleet-default';
const type = 'provisioning.cattle.io.cluster';
const importType = 'cluster';
const clusterNamePartial = `${ runPrefix }-create`;
const rke2CustomName = `${ clusterNamePartial }-rke2-custom`;
const importGenericName = `${ clusterNamePartial }-import-generic`;
let reenableAKS = false;
let originalSettings = '[{"name":"aks","active":true},{"name":"alibaba","active":true},{"name":"eks","active":true},{"name":"gke","active":true}]';

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Cluster Manager', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  before(() => {
    cy.login();
    cy.getRancherResource('v1', 'management.cattle.io.settings', 'kev2-operators', null).then((resp: Cypress.Response<any>) => {
      const response = resp.body;

      // update original data before sending request
      originalSettings = response.value;
    });
  });

  it('deactivating a hosted provider should hide its card from the cluster creation page', () => {
    cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('updateProviders');

    const providersPage = new HostedProvidersPagePo();
    const clusterCreatePage = new ClusterManagerCreatePagePo();

    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    // assert AKS kontainer driver is in Active state
    providersPage.list().details('Azure AKS', 1).should('contain', 'Active');

    // deactivate the AKS driver
    providersPage.list().actionMenu('Azure AKS').getMenuItem('Deactivate').click();
    cy.wait('@updateProviders').its('response.statusCode').should('eq', 200).then(() => {
      reenableAKS = true;
    });

    // verify that the AKS card is not shown
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();
    clusterCreatePage.gridElementExistanceByName('Azure AKS', 'not.exist');

    // re-enable the AKS kontainer driver
    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();
    providersPage.list().actionMenu('Azure AKS').getMenuItem('Activate').click();
    cy.wait('@updateProviders').its('response.statusCode').should('eq', 200).then(() => {
      reenableAKS = false;
    });

    // verify that the AKS card is back
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();
    clusterCreatePage.gridElementExistanceByName('Azure AKS', 'exist');
  });

  describe('RKE2 providers', () => {
    providersList.forEach((prov) => {
      it(`should be able to access RKE2 cluster creation for provider ${ prov.label } via url`, () => {
        const clusterCreate = new ClusterManagerCreatePagePo();

        clusterCreate.goTo(`type=${ prov.clusterProviderQueryParam }&rkeType=rke2`);
        clusterCreate.waitForPage();

        loadingPo.checkNotExists();

        clusterCreate.rke2PageTitle().should('contain', `Create ${ prov.label }`);
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
          spec: { rkeConfig: { machineGlobalConfig: { cni: 'calico', 'ingress-controller': 'ingress-nginx' }, machinePoolDefaults: { hostnameLengthLimit: 15 } } }
        };

        cy.userPreferences();

        clusterList.goTo();

        // check if burguer menu nav is highlighted correctly for cluster manager
        BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Cluster Management');

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createRKE2ClusterPage.waitForPage();

        // EO test for https://github.com/rancher/dashboard/issues/9823

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
        // Stub clipboard methods to avoid permission prompts
        cy.visit('/', {
          onBeforeLoad(win) {
            cy.stub(win.navigator.clipboard, 'writeText').resolves();
          },
        });

        ClusterManagerListPagePo.navTo();

        cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('copyKubeConfig');
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

      it('will disable saving if an addon config has invalid data', () => {
        clusterList.goTo();

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();

        createRKE2ClusterPage.waitForPage();

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
        cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('generateKubeconfig');
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
  });

  describe('Imported', { tags: ['@jenkins', '@importedCluster'] }, () => {
    const importClusterPage = new ClusterManagerImportGenericPagePo();
    const fqdn = 'fqdn';
    const cacert = 'cacert';
    const privateRegistry = 'registry.io';

    describe('Generic', () => {
      it('can create new cluster', () => {
        cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('getUsers');
        cy.intercept('POST', `/v3/${ importType }s`).as('importRequest');

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.importCluster();

        importClusterPage.waitForPage('mode=import');
        importClusterPage.selectGeneric(0);
        // Verify that we only show when editing
        importClusterPage.waitForPage('mode=import&type=import&rkeType=rke2');
        cy.wait('@getUsers');

        // check accordions are displayed or not
        importClusterPage.accordion(2, 'Basics').should('be.visible');
        importClusterPage.accordion(3, 'Member Roles').should('be.visible');
        importClusterPage.accordion(4, 'Labels and Annotations').scrollIntoView().should('be.visible');
        importClusterPage.accordion(5, 'Registries').scrollIntoView().should('be.visible');
        importClusterPage.accordion(6, 'Advanced').scrollIntoView().should('be.visible');
        importClusterPage.networkingAccordion().should('not.exist');

        importClusterPage.nameNsDescription().name().checkVisible();
        importClusterPage.nameNsDescription().name().set(importGenericName);
        // Issue #13614: Imported Cluster Version Mgmt: Conditionally show warning message
        importClusterPage.versionManagementBanner().should('exist').and('be.visible');

        importClusterPage.create();

        cy.wait('@importRequest').then((intercept) => {
          expect(intercept.response.statusCode).to.eq(201);
          expect(intercept.request.body).to.deep.equal({
            type:           importType,
            agentEnvVars:   [],
            annotations:    { 'rancher.io/imported-cluster-version-management': 'system-default' },
            importedConfig: { privateRegistryURL: null },
            labels:         {},
            name:           importGenericName
          });
        });

        cy.getClusterIdByName(importGenericName).then((clusterId) => {
          const detailClusterPage = new ClusterManagerDetailImportedGenericPagePo(undefined, clusterId);

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
        clusterList.list().state(importGenericName).should('be.visible', EXTRA_LONG_TIMEOUT_OPT)
          .and(($el) => {
            const status = $el.text().trim();

            expect(['Provisioning', 'Waiting']).to.include(status);
          });
        clusterList.list().state(importGenericName).contains('Active', EXTRA_LONG_TIMEOUT_OPT);
        // Issue #6836: Provider field on Imported clusters states "Imported" instead of cluster type
        clusterList.list().provider(importGenericName).should('contain.text', 'Imported');
        clusterList.list().providerSubType(importGenericName).should('contain.text', 'K3s');
      });

      it('can edit imported cluster and see changes afterwards', () => {
        cy.getClusterIdByName(importGenericName).then((clusterId) => {
          const editImportedClusterPage = new ClusterManagerEditImportedPagePo(undefined, 'fleet-default', clusterId);

          cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('pageLoad');
          clusterList.goTo();
          clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click();

          editImportedClusterPage.waitForPage('mode=edit');

          editImportedClusterPage.nameNsDescription().name().value().should('eq', importGenericName);
          cy.wait('@pageLoad');

          // check accordions are properly displayed
          editImportedClusterPage.accordion(2, 'K3S Options').should('be.visible');
          editImportedClusterPage.accordion(3, 'Member Roles').should('be.visible');
          editImportedClusterPage.accordion(4, 'Labels and Annotations').scrollIntoView().should('be.visible');
          editImportedClusterPage.accordion(5, 'Networking').scrollIntoView().should('be.visible');
          editImportedClusterPage.accordion(6, 'Registries').scrollIntoView().should('be.visible');
          editImportedClusterPage.accordion(7, 'Advanced').scrollIntoView().should('be.visible');

          // Issue #10432: Edit Cluster screen falsely gives impression imported cluster's name and description can be edited
          editImportedClusterPage.nameNsDescription().name().expectToBeDisabled();

          // Issue #13614: Imported Cluster Version Mgmt: Conditionally show warning message
          editImportedClusterPage.versionManagementBanner().should('not.exist');

          editImportedClusterPage.enableVersionManagement();
          editImportedClusterPage.versionManagementBanner().should('exist').and('be.visible');
          editImportedClusterPage.defaultVersionManagement();

          editImportedClusterPage.toggleAccordion(5, 'Networking');
          editImportedClusterPage.ace().enable();
          editImportedClusterPage.ace().enterFdqn(fqdn);
          editImportedClusterPage.ace().enterCaCerts(cacert);

          editImportedClusterPage.toggleAccordion(6, 'Registries');
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

  describe('Cluster Details Page and Tabs', () => {
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');
    const clusterDetail = new ClusterManagerDetailImportedGenericPagePo(undefined, 'local');

    beforeEach( () => {
      ClusterManagerListPagePo.navTo();
      const clusterList = new ClusterManagerListPagePo('_');

      clusterList.waitForPage();
      clusterList.list().resourceTable().sortableTable().filter('local', 100);
      clusterList.waitForPage('q=local');
      clusterList.goToDetailsPage('local', '.cluster-link a');
      clusterDetail.waitForPage();
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
      clusterDetail.poolsList('node').details('machine-', 2).should('be.visible');
      clusterDetail.poolsList('node').downloadYamlButton().should('be.disabled');
    });

    it(`Show Configuration allows to edit config and view yaml for local cluster`, () => {
      clusterDetail.openShowConfiguration();
      const drawer = clusterDetail.detailDrawer();

      drawer.checkExists();
      drawer.checkVisible();
      drawer.saveButton().should('be.visible');
      const tabs = ['Config', 'YAML'];

      drawer.tabs().tabNames().each((el, i) => {
        expect(el).to.eq(tabs[i]);
      });

      drawer.tabs().clickTabWithName('yaml-tab');
      drawer.saveButton().should('not.exist');
    });

    it('can navigate to namespace from cluster detail view', () => {
      clusterDetail.namespace().should('contain.text', 'fleet-local');
      clusterDetail.namespace().click();

      const nsPage = new ClusterManagerNamespacePagePo();

      nsPage.waitForPage(undefined, 'Resources');
      nsPage.namespace().should('contain.text', 'fleet-local');
    });
  });

  describe('Local', () => {
    it(`can open edit for local cluster`, () => {
      const editLocalClusterPage = new ClusterManagerEditImportedPagePo(undefined, 'fleet-local', 'local');

      cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('pageLoad');
      clusterList.goTo();
      clusterList.list().actionMenu('local').getMenuItem('Edit Config').click();
      editLocalClusterPage.waitForPage('mode=edit');
      cy.wait('@pageLoad');
      editLocalClusterPage.nameNsDescription().name().value().should('eq', 'local' );

      // check accordions are properly displayed
      editLocalClusterPage.accordion(2, 'K3S Options').should('be.visible'); // for K3S local cluster its K3S Options
      editLocalClusterPage.accordion(3, 'Member Roles').scrollIntoView().should('be.visible');
      editLocalClusterPage.accordion(4, 'Labels and Annotations').scrollIntoView().should('be.visible');
      editLocalClusterPage.accordion(5, 'Networking').scrollIntoView().should('be.visible');
      editLocalClusterPage.accordion(6, 'Registries').scrollIntoView().should('be.visible');
      editLocalClusterPage.accordion(7, 'Advanced').scrollIntoView().should('be.visible');

      // Issue #13614: Imported Cluster Version Mgmt: Conditionally show warning message
      editLocalClusterPage.versionManagementBanner().should('not.exist');

      editLocalClusterPage.enableVersionManagement();
      editLocalClusterPage.versionManagementBanner().should('not.contain.text', 'This change will trigger cluster agent redeployment.');
      editLocalClusterPage.disableVersionManagement();
      editLocalClusterPage.versionManagementBanner().should('not.contain.text', 'This change will trigger cluster agent redeployment.');
      editLocalClusterPage.cancel();

      // We should be taken back to the list page if the save was successful
      clusterList.waitForPage();
    });

    it(`can navigate to local cluster's explore product`, () => {
      const clusterName = 'local';
      const clusterDashboard = new ClusterDashboardPagePo(clusterName);

      clusterList.goTo();
      clusterList.list().explore(clusterName).click();

      clusterDashboard.waitForPage(undefined, 'cluster-events');
    });
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
    cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('generateKubeConfig');
    clusterList.list().openBulkActionDropdown();
    clusterList.list().bulkActionButton('Download KubeConfig').click();
    cy.wait('@generateKubeConfig').its('response.statusCode').should('eq', 201);
    const downloadedFilename = path.join(downloadsFolder, 'local.yaml');

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('v1');
      expect(obj.clusters[1].name).to.equal('local');
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
      cy.setRancherResource('v1', 'management.cattle.io.settings', 'kev2-operators', { value: originalSettings });
    }
  });
});

describe('Cluster Manager as standard user', { testIsolation: 'off', tags: ['@manager', '@standardUser'] }, () => {
  before(() => {
    cy.login();
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

  describe('Cluster Detail Page', () => {
    const clusterDetail = new ClusterManagerDetailImportedGenericPagePo(undefined, 'local');

    beforeEach( () => {
      ClusterManagerListPagePo.navTo();
      const clusterList = new ClusterManagerListPagePo('_');

      clusterList.waitForPage();
      clusterList.goToDetailsPage('local', '.cluster-link a');
    });

    it(`Show Configuration allows to view but not edit config and yaml for local cluster`, () => {
      clusterDetail.waitForPage();
      clusterDetail.openShowConfiguration();
      const drawer = clusterDetail.detailDrawer();

      drawer.checkExists();
      drawer.checkVisible();
      drawer.saveButton().should('not.exist');
      const tabs = ['Config', 'YAML'];

      drawer.tabs().tabNames().each((el, i) => {
        expect(el).to.eq(tabs[i]);
      });

      drawer.tabs().clickTabWithName('yaml-tab');
      drawer.saveButton().should('not.exist');
    });

    it('Shows the explore button and navigates to the cluster explorer when clicked', () => {
      clusterDetail.waitForPage();
      clusterDetail.exploreButton().should('exist');

      clusterDetail.exploreButton().click();
      cy.url().should('include', '/c/local/explorer');
    });
  });
});
describe('Visual Testing', { tags: ['@percy', '@manager', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    // Set theme to light
    cy.setUserPreference({ theme: 'ui-light' });
  });
  it('should display cluster manager page', () => {
    const clusterList = new ClusterManagerListPagePo();

    clusterList.goTo();
    clusterList.checkIsCurrentPage();

    clusterList.sortableTable().checkVisible();
    clusterList.sortableTable().checkLoadingIndicatorNotVisible();
    clusterList.sortableTable().noRowsShouldNotExist();

    // hide elements before taking percy snapshot
    cy.hideElementBySelector('[data-testid="nav_header_showUserMenu"]', 'td.col-live-date span.live-date');
    // takes percy snapshot.
    cy.percySnapshot('cluster manager list page');
  });
});
