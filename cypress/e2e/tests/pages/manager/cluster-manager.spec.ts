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
import {
  VERY_LONG_TIMEOUT_OPT,
  EXTRA_LONG_TIMEOUT_OPT,
  LONG_TIMEOUT_OPT,
  MEDIUM_TIMEOUT_OPT,
  RESTART_TIMEOUT_OPT,
  GROWL_DISMISS_TIMEOUT_OPT
} from '@/cypress/support/utils/timeouts';
import HostedProvidersPagePo from '@/cypress/e2e/po/pages/cluster-manager/hosted-providers.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { qase } from '@/cypress/support/qase';

// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const createClusterTestName = (suffix: string) => `e2e-test-${ +new Date() }-create-${ suffix }`;

// File specific consts
const namespace = 'fleet-default';
const type = 'provisioning.cattle.io.cluster';
const importType = 'cluster';
let rke2CustomName = createClusterTestName('rke2-custom');
let importGenericName = createClusterTestName('import-generic');
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
    clusterCreatePage.gridElementExistenceByName('Azure AKS', 'not.exist');

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
    clusterCreatePage.gridElementExistenceByName('Azure AKS', 'exist');
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
    const detailRKE2ClusterPage = () => new ClusterManagerDetailRke2CustomPagePo(undefined, rke2CustomName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    describe('RKE2 Custom', { tags: ['@jenkins', '@customCluster', '@provisioning'] }, () => {
      const editCreatedClusterPage = () => new ClusterManagerEditRke2CustomPagePo(undefined, rke2CustomName);

      qase(1436, it('can create new cluster', { retries: 0 }, () => {
        rke2CustomName = createClusterTestName('rke2-custom');
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

        cy.wait('@createRequest', { requestTimeout: LONG_TIMEOUT_OPT.timeout }).then((intercept) => {
          // Issue with linter https://github.com/cypress-io/eslint-plugin-cypress/issues/3
          // Fail fast with a clear error if the backend rejects the create,
          // instead of waiting 60s for a redirect that never comes.
          expect(intercept.response?.statusCode, 'Cluster create POST status').to.be.oneOf([200, 201]);
          expect(isMatch(intercept.request.body, request)).to.equal(true);
          expect(['ingress-nginx', 'traefik']).to.include(intercept.request.body.spec?.rkeConfig?.machineGlobalConfig?.['ingress-controller']);
        });

        // After cluster create, the dashboard redirects from the create form to the
        // detail page (#registration fragment). waitForPage defaults to a 4s timeout
        // which can race the redirect under load. Pass LONG_TIMEOUT_OPT (60s).
        detailRKE2ClusterPage().waitForPage(undefined, 'registration', LONG_TIMEOUT_OPT);

        // The Insecure checkbox only renders once the async cluster registration
        // token arrives from the backend; the LONG_TIMEOUT_OPT on the .contains()
        // selector in activateInsecureRegistrationCommandFromUI() handles the wait.
        createRKE2ClusterPage.activateInsecureRegistrationCommandFromUI().click();
        createRKE2ClusterPage.commandFromCustomClusterUI().then(($value) => {
          const registrationCommand = $value.text();
          const customNodeKey = `${ Cypress.env('customNodeKey') || '' }`;
          const decodedCustomNodeKey = customNodeKey.includes('BEGIN') ? customNodeKey : Cypress.Buffer.from(customNodeKey, 'base64').toString('utf8');

          cy.writeFile('custom_node.key', decodedCustomNodeKey).then(() => {
            cy.log('Creating the custom_node.key');
          });
          cy.exec('chmod 600 custom_node.key').then((result) => {
            cy.log(result.stderr);
            cy.log(result.stdout);
            expect(result.code).to.eq(0);
          });
          cy.exec(`head custom_node.key`).then((result) => {
            cy.log(result.stdout);
            cy.log(result.stderr);
            expect(result.code).to.eq(0);
          });
          cy.exec(createRKE2ClusterPage.customClusterRegistrationCmd(registrationCommand), { timeout: RESTART_TIMEOUT_OPT.timeout }).then((result) => {
            cy.log(result.stderr);
            cy.log(result.stdout);
            expect(result.code).to.eq(0);
          });
        });
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.list().state(rke2CustomName).should('contain.text', 'Updating');
        clusterList.list().state(rke2CustomName).contains('Active', VERY_LONG_TIMEOUT_OPT); // 700s: EC2 RKE2 provisioning can be slow; matches the EC2 RKE2 test pattern
      }));

      qase(2053, it('can copy config to clipboard', () => {
        // Stub clipboard methods to avoid permission prompts
        cy.visit('/', {
          onBeforeLoad(win) {
            cy.stub(win.navigator.clipboard, 'writeText').resolves();
          },
        });

        ClusterManagerListPagePo.navTo();

        cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('copyKubeConfig');
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Copy KubeConfig to Clipboard').click();
        cy.wait('@copyKubeConfig', { requestTimeout: LONG_TIMEOUT_OPT.timeout });

        // Growl auto-dismiss: 5s lifetime (growl.js DEFAULT_TIMEOUT) + 1s sweep + margin
        cy.get('.growl-text', { timeout: MEDIUM_TIMEOUT_OPT.timeout }).contains('Copied KubeConfig to Clipboard').should('be.visible');
        cy.get('.growl-text', { timeout: GROWL_DISMISS_TIMEOUT_OPT.timeout }).should('not.exist');

        // Skipping following assertion for now as it is failing due to Cypress' limitations with accessing the clipboard in Chrome browser and headless mode. Works in Electron browser
        // see https://github.com/cypress-io/cypress/issues/2752

        // read text saved in the browser clipboard
        // cy.window().its('navigator.clipboard')
        //   .invoke('readText').should('include', rke2CustomName);
      }));

      qase(1437, it('can edit cluster and see changes afterwards', () => {
        // navTo + waitForPage + row visible before touching the action menu,
        // matching the delete test pattern: clicking the action menu on a
        // still-rendering list is a known flake source.
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click({ force: true });

        editCreatedClusterPage().waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);
        editCreatedClusterPage().nameNsDescription().description().set(rke2CustomName);
        editCreatedClusterPage().save();

        // We should be taken back to the list page if the save was successful.
        // The save PUT + redirect can exceed the 10s default under load.
        clusterList.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);

        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click({ force: true });

        editCreatedClusterPage().waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);
        editCreatedClusterPage().nameNsDescription().description().self()
          .should('have.value', rke2CustomName);
      }));

      qase(12214, it('will disable saving if an addon config has invalid data', () => {
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
      }));

      qase(1435, it('can view cluster YAML editor', () => {
        clusterList.goTo();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit YAML').click();

        editCreatedClusterPage().waitForPage('mode=edit&as=yaml');
        editCreatedClusterPage().resourceDetail().resourceYaml().checkVisible();
      }));

      qase(1438, it('can download KubeConfig', () => {
        cy.deleteDownloadsFolder();
        clusterList.goTo();
        cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('generateKubeconfig');
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Download KubeConfig').click();
        cy.wait('@generateKubeconfig').its('response.statusCode').should('be.oneOf', [200, 201]);

        const downloadedFilename = path.join(downloadsFolder, `${ rke2CustomName }.yaml`);

        cy.readFile(downloadedFilename).then((buffer) => {
          // This will throw an exception which will fail the test if not valid yaml
          const obj: any = jsyaml.load(buffer);

          // Basic checks on the downloaded YAML
          expect(obj.clusters.some((cluster: { name: string }) => cluster.name === rke2CustomName)).to.equal(true);
          expect(obj.apiVersion).to.equal('v1');
          expect(obj.kind).to.equal('Config');
        });
      }));

      qase(2054, it('can download YAML', () => {
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
      }));

      qase(48756, it('preserves custom addon config values after saving cluster config', () => {
        const customAddonConfig = `goodvalue: yay\nnested:\n  enabled: true`;
        const updatedDescription = `${ rke2CustomName }-addon-persist-check`;

        // navTo + waitForPage + row visible before touching the action menu,
        // matching the delete test pattern.
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click({ force: true });

        // waitForPage defaults to 4s which can race the edit page load under load
        editCreatedClusterPage().waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);
        editCreatedClusterPage().clusterConfigurationTabs().clickTabWithSelector('#rke2-calico');
        editCreatedClusterPage().calicoAddonConfig().yamlEditor().input()
          .set(customAddonConfig);
        editCreatedClusterPage().save();

        // The save PUT + redirect can exceed the 10s default under load.
        clusterList.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);
        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click({ force: true });

        editCreatedClusterPage().waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);
        editCreatedClusterPage().nameNsDescription().description().set(updatedDescription);
        editCreatedClusterPage().save();

        clusterList.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);
        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Edit Config').click({ force: true });

        editCreatedClusterPage().waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);
        editCreatedClusterPage().clusterConfigurationTabs().clickTabWithSelector('#rke2-calico');
        editCreatedClusterPage().calicoAddonConfig().yamlEditor().input()
          .value()
          .should('include', customAddonConfig);
      }));

      qase(3227, it('can navigate to Cluster Provisioning Log tab in the detail page', () => {
        // Note: this test depends on the create test succeeding. If the cluster
        // never reaches Active, the log tab won't render and this test will fail.
        const detailPage = detailRKE2ClusterPage();

        detailPage.goTo();
        // The tabbed-block container may take a moment to render on the detail page;
        // waitForPage checks the URL but not the DOM. The selectTab call below
        // queries [data-testid="tabbed-block"] which defaults to a 4s timeout.
        detailPage.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);
        detailPage.selectTab(tabbedPo, '[data-testid="btn-log"]');

        detailPage.waitForPage(undefined, 'log');
        detailPage.logsContainer(MEDIUM_TIMEOUT_OPT).should('be.visible');
      }));

      qase(1434, it('can delete cluster', () => {
        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.sortableTable().rowElementWithName(rke2CustomName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();

        cy.intercept('DELETE', `/v1/provisioning.cattle.io.clusters/fleet-default/${ rke2CustomName }`).as('deleteRke2Cluster');
        clusterList.list().actionMenu(rke2CustomName).getMenuItem('Delete').click({ force: true });

        const promptRemove = new PromptRemove();

        promptRemove.confirm(rke2CustomName);
        promptRemove.remove();
        cy.wait('@deleteRke2Cluster', { requestTimeout: LONG_TIMEOUT_OPT.timeout }).its('response.statusCode').should('be.oneOf', [200, 204]);

        clusterList.waitForPage();
        clusterList.sortableTable().rowElements(LONG_TIMEOUT_OPT).should(($rows) => {
          const tableText = Cypress.$.makeArray<any>($rows).map((row) => row.innerText).join(' ');

          expect(tableText).to.not.contain(rke2CustomName);
        });
      }));
    });
  });

  describe('Imported', { tags: ['@jenkins', '@importedCluster', '@provisioning'] }, () => {
    const importClusterPage = new ClusterManagerImportGenericPagePo();
    const fqdn = 'fqdn';
    const cacert = 'cacert';
    const privateRegistry = 'registry.io';

    before(() => {
      // Absorb the cold start here rather than inside a test. The list
      // component is pulled in through a dynamic import, so the first
      // navigation of a run has to fetch it before the page has any content.
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.waitForListReady(EXTRA_LONG_TIMEOUT_OPT);
    });

    describe('Generic', () => {
      it('can create new cluster', { retries: 0 }, () => {
        importGenericName = createClusterTestName('import-generic');
        cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('getUsers');
        cy.intercept('POST', `/v3/${ importType }s`).as('importRequest');

        clusterList.goTo();
        clusterList.checkIsCurrentPage();
        clusterList.waitForListReady(MEDIUM_TIMEOUT_OPT);
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

        cy.wait('@importRequest', { requestTimeout: LONG_TIMEOUT_OPT.timeout, responseTimeout: LONG_TIMEOUT_OPT.timeout }).then((intercept) => {
          // Fail fast if the backend rejects the import.
          expect(intercept.response?.statusCode, 'Cluster import POST status').to.eq(201);
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

          // The create form redirects here once the cluster exists, assert that
          // rather than navigating, so a regression is caught not stepped over.
          detailClusterPage.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);

          // The `#registration` fragment is a side effect of Tabbed picking a
          // default tab, which it does once, while no tab is active. If the
          // registration token is slow another tab wins and the fragment is
          // never written, so a longer timeout cannot fix it. Click the tab.
          detailClusterPage.registrationTab(LONG_TIMEOUT_OPT).click();
          detailClusterPage.waitForPage(undefined, 'registration', MEDIUM_TIMEOUT_OPT);

          detailClusterPage.kubectlCommandForImported(MEDIUM_TIMEOUT_OPT).contains('--insecure').then(($value) => {
            const kubectlCommand = $value.text();

            expect(kubectlCommand).to.contain('--insecure');
            cy.log(kubectlCommand);

            // Assert the waiting state before applying the manifest, where no
            // agent can have connected yet. After the apply it is a race.
            ClusterManagerListPagePo.navTo();
            clusterList.waitForPage();
            clusterList.list().state(importGenericName, MEDIUM_TIMEOUT_OPT).should(($el) => {
              const status = $el.text().trim();

              expect(['Pending', 'Provisioning', 'Waiting']).to.include(status);
            });

            cy.exec(kubectlCommand, { failOnNonZeroExit: false, timeout: RESTART_TIMEOUT_OPT.timeout }).then((result) => {
              cy.log(result.stderr);
              cy.log(result.stdout);
              expect(result.code).to.eq(0);
            });
          });
        });

        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.list().state(importGenericName, MEDIUM_TIMEOUT_OPT).contains('Active', EXTRA_LONG_TIMEOUT_OPT);
        // Issue #6836: Provider field on Imported clusters states "Imported" instead of cluster type
        clusterList.list().provider(importGenericName).should('contain.text', 'Imported');
        clusterList.list().providerSubType(importGenericName).should('contain.text', 'K3s');
      });

      it('can edit imported cluster and see changes afterwards', () => {
        cy.getClusterIdByName(importGenericName).then((clusterId) => {
          const editImportedClusterPage = new ClusterManagerEditImportedPagePo(undefined, 'fleet-default', clusterId);

          cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('pageLoad');
          // goTo() rather than navTo(), the pageLoad intercept needs a full page
          // load. An SPA navigation leaves the store populated from the previous
          // test, so the users request never fires again.
          // Wait for the list and the row before touching the action menu.
          clusterList.goTo();
          clusterList.waitForPage();
          clusterList.waitForListReady(MEDIUM_TIMEOUT_OPT);
          clusterList.sortableTable().rowElementWithName(importGenericName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
          clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click({ force: true });

          editImportedClusterPage.waitForPage('mode=edit', undefined, LONG_TIMEOUT_OPT);

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

          // We should be taken back to the list page if the save was successful.
          // The save PUT and redirect can exceed the default timeout under load.
          clusterList.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);

          clusterList.sortableTable().rowElementWithName(importGenericName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
          clusterList.list().actionMenu(importGenericName).getMenuItem('Edit Config').click({ force: true });

          editImportedClusterPage.waitForPage('mode=edit', undefined, LONG_TIMEOUT_OPT);
          editImportedClusterPage.ace().fqdn().value().should('eq', fqdn );
          editImportedClusterPage.ace().caCerts().value().should('eq', cacert );

          // Verify the private registry values
          editImportedClusterPage.privateRegistryCheckbox().isChecked();
          editImportedClusterPage.privateRegistry().value().should('eq', privateRegistry);
        });
      });

      it('can delete cluster by bulk actions', () => {
        clusterList.goTo();
        clusterList.waitForPage();
        clusterList.waitForListReady(MEDIUM_TIMEOUT_OPT);
        // Timeouts belong on the command that yields the element; .should()
        // ignores an options argument (it is read as the assertion message).
        clusterList.sortableTable().rowElementWithName(importGenericName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
        clusterList.sortableTable().rowSelectCtlWithName(importGenericName).set();
        clusterList.sortableTable().bulkActionDropDownOpen();
        clusterList.sortableTable().bulkActionDropDownButton('Delete').click();

        const promptRemove = new PromptRemove();

        promptRemove.confirm(importGenericName);
        promptRemove.remove();

        clusterList.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);
        // Cluster removal is asynchronous, the row lingers while the backend
        // finalizes the delete.
        clusterList.sortableTable().rowElementWithName(importGenericName, EXTRA_LONG_TIMEOUT_OPT).should('not.exist');
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
    cy.applyDefaultTestTheme();
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

  after(() => {
    cy.restoreProductDefaultTestTheme();
  });
});
