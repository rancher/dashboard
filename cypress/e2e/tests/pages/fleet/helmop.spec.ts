import { FleetApplicationCreatePo, FleetApplicationListPagePo } from '~/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { FleetHelmOpCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.helmop.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { EXTRA_LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const fakeProvClusterId = 'fake-cluster-id';
const fakeMgmtClusterId = 'fake-mgmt-id';

const workspace = 'fleet-default';
const helmOpList: string[] = [];
const secretsList: Array<{ name: string; namespace: string }> = [];
const configMapsList: Array<{ name: string; namespace: string }> = [];

describe('Fleet HelmOps', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const appBundleCreatePage = new FleetApplicationCreatePo();
  const appBundleListPage = new FleetApplicationListPagePo();
  const headerPo = new HeaderPo();
  let helmOpName: string;

  // testing: https://github.com/rancher/dashboard/issues/15344
  describe('Create and Edit HelmOp with Secrets and ConfigMaps', () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('helmop').as('helmOpName').then((name) => {
        helmOpName = name;
      });
    });

    it('Can create a HelmOp with Secrets and ConfigMaps', () => {
      // Generate a fake cluster that can be usable in fleet
      generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId);

      // Create test Secrets and ConfigMaps
      const secret1Name = `helmop-secret-${ Date.now() }-1`;
      const secret2Name = `helmop-secret-${ Date.now() }-2`;
      const configMap1Name = `helmop-cm-${ Date.now() }-1`;
      const configMap2Name = `helmop-cm-${ Date.now() }-2`;

      cy.createRancherResource('v1', 'secrets', {
        type:     'Opaque',
        metadata: {
          name:      secret1Name,
          namespace: workspace,
        },
        data: { key1: btoa('value1') },
      }).then(() => {
        cy.log(`Created secret: ${ secret1Name }`);
        secretsList.push({ name: secret1Name, namespace: workspace });
      });

      cy.createRancherResource('v1', 'secrets', {
        type:     'Opaque',
        metadata: {
          name:      secret2Name,
          namespace: workspace,
        },
        data: { key2: btoa('value2') },
      }).then(() => {
        cy.log(`Created secret: ${ secret2Name }`);
        secretsList.push({ name: secret2Name, namespace: workspace });
      });

      cy.createRancherResource('v1', 'configmaps', {
        metadata: {
          name:      configMap1Name,
          namespace: workspace,
        },
        data: { key1: 'value1' },
      }).then(() => {
        cy.log(`Created configmap: ${ configMap1Name }`);
        configMapsList.push({ name: configMap1Name, namespace: workspace });
      });

      cy.createRancherResource('v1', 'configmaps', {
        metadata: {
          name:      configMap2Name,
          namespace: workspace,
        },
        data: { key2: 'value2' },
      }).then(() => {
        cy.log(`Created configmap: ${ configMap2Name }`);
        configMapsList.push({ name: configMap2Name, namespace: workspace });
      });

      cy.intercept('POST', '/v1/fleet.cattle.io.helmops').as('createHelmOp');
      cy.intercept('GET', '/v1/secrets?*').as('getSecrets');
      cy.intercept('GET', '/v1/configmaps?*').as('getConfigMaps');

      // Navigate to create HelmOp
      appBundleCreatePage.goTo();
      appBundleCreatePage.waitForPage();
      appBundleCreatePage.createHelmOp();

      const helmOpCreatePage = new FleetHelmOpCreateEditPo();

      helmOpCreatePage.waitForPage();

      headerPo.selectWorkspace(workspace);

      // Metadata step
      helmOpCreatePage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .set(helmOpName);
      helmOpCreatePage.resourceDetail().createEditView().nextPage();

      // Chart step
      // Using Bitnami Redis chart - stable, widely available on Artifact Hub
      helmOpCreatePage.setChart('redis');
      helmOpCreatePage.setRepository('https://charts.bitnami.com/bitnami');
      helmOpCreatePage.setVersion('24.0.0');
      helmOpCreatePage.resourceDetail().createEditView().nextPage();

      // Values step
      helmOpCreatePage.resourceDetail().createEditView().nextPage();

      // Target step
      helmOpCreatePage.setTargetNamespace('default');
      helmOpCreatePage.targetClusterOptions().set(2);
      helmOpCreatePage.targetCluster().toggle();
      helmOpCreatePage.targetCluster().clickLabel(fakeProvClusterId);

      helmOpCreatePage.resourceDetail().createEditView().nextPage();

      // Wait for resources to load
      cy.wait('@getSecrets', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      cy.wait('@getConfigMaps', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);

      // Advanced step - Select Secrets
      helmOpCreatePage.secretsSelector().checkExists();
      helmOpCreatePage.secretsSelector().toggle();
      helmOpCreatePage.secretsSelector().clickLabel(secret1Name);
      helmOpCreatePage.secretsSelector().isClosed();
      helmOpCreatePage.secretsSelector().toggle();
      helmOpCreatePage.secretsSelector().clickLabel(secret2Name);

      // Advanced step - Select ConfigMaps
      helmOpCreatePage.configMapsSelector().checkExists();
      helmOpCreatePage.configMapsSelector().toggle();
      helmOpCreatePage.configMapsSelector().clickLabel(configMap1Name);
      helmOpCreatePage.configMapsSelector().isClosed();
      helmOpCreatePage.configMapsSelector().toggle();
      helmOpCreatePage.configMapsSelector().clickLabel(configMap2Name);

      // Create the HelmOp
      helmOpCreatePage.resourceDetail().createEditView().create()
        .then(() => {
          helmOpList.push(`${ workspace }/${ helmOpName }`);
        });

      // Verify the API request and response contain downstreamResources in the correct location
      cy.wait('@createHelmOp').then(({ request, response }) => {
        expect(response?.statusCode).to.eq(201);

        // Verify request payload contains downstreamResources in spec (not spec.helm)
        // testing: https://github.com/rancher/dashboard/pull/15921
        expect(request.body.spec.downstreamResources).to.be.an('array');
        expect(request.body.spec.downstreamResources).to.have.length(4);

        // Verify Secrets are in downstreamResources
        const requestSecrets = request.body.spec.downstreamResources.filter((r: any) => r.kind === 'Secret');

        expect(requestSecrets).to.have.length(2);
        expect(requestSecrets.map((s: any) => s.name)).to.include.members([secret1Name, secret2Name]);

        // Verify ConfigMaps are in downstreamResources
        const requestConfigMaps = request.body.spec.downstreamResources.filter((r: any) => r.kind === 'ConfigMap');

        expect(requestConfigMaps).to.have.length(2);
        expect(requestConfigMaps.map((cm: any) => cm.name)).to.include.members([configMap1Name, configMap2Name]);

        // Verify response body contains downstreamResources (persistence check)
        expect(response?.body?.spec?.downstreamResources).to.be.an('array');
        expect(response.body.spec.downstreamResources).to.have.length(4);

        const responseSecrets = response.body.spec.downstreamResources.filter((r: any) => r.kind === 'Secret');

        expect(responseSecrets).to.have.length(2);
        expect(responseSecrets.map((s: any) => s.name)).to.include.members([secret1Name, secret2Name]);

        const responseConfigMaps = response.body.spec.downstreamResources.filter((r: any) => r.kind === 'ConfigMap');

        expect(responseConfigMaps).to.have.length(2);
        expect(responseConfigMaps.map((cm: any) => cm.name)).to.include.members([configMap1Name, configMap2Name]);
      });
    });

    it('Can edit a HelmOp to remove and add Secrets and ConfigMaps', () => {
      // Use the HelmOp created in the previous test
      const secretName = `helmop-edit-secret-${ Date.now() }`;
      const configMapName = `helmop-edit-cm-${ Date.now() }`;

      // Create test resources
      cy.createRancherResource('v1', 'secrets', {
        type:     'Opaque',
        metadata: {
          name:      secretName,
          namespace: workspace,
        },
        data: { key: btoa('value') },
      }).then(() => {
        secretsList.push({ name: secretName, namespace: workspace });
      });

      cy.createRancherResource('v1', 'configmaps', {
        metadata: {
          name:      configMapName,
          namespace: workspace,
        },
        data: { key: 'value' },
      }).then(() => {
        configMapsList.push({ name: configMapName, namespace: workspace });
      });

      cy.intercept('PUT', `/v1/fleet.cattle.io.helmops/${ workspace }/${ helmOpName }`).as('updateHelmOp');
      cy.intercept('GET', '/v1/secrets?*').as('getSecrets');
      cy.intercept('GET', '/v1/configmaps?*').as('getConfigMaps');

      // Navigate to edit HelmOp
      appBundleListPage.goTo();
      appBundleListPage.waitForPage();
      headerPo.selectWorkspace(workspace);

      // Click Edit Config from row action menu
      appBundleListPage.list().actionMenu(helmOpName).getMenuItem('Edit Config').click();

      const helmOpEditPage = new FleetHelmOpCreateEditPo(workspace, helmOpName);

      helmOpEditPage.waitForPage('mode=edit');

      // Navigate through steps to reach advanced step
      // Start from basics step, navigate to chart, values, target, then advanced
      helmOpEditPage.resourceDetail().createEditView().nextPage(); // Chart step
      helmOpEditPage.resourceDetail().createEditView().nextPage(); // Values step
      helmOpEditPage.resourceDetail().createEditView().nextPage(); // Target step
      helmOpEditPage.resourceDetail().createEditView().nextPage(); // Advanced step

      // Wait for resources to load
      cy.wait('@getSecrets', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      cy.wait('@getConfigMaps', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);

      // Remove existing Secrets and ConfigMaps
      helmOpEditPage.secretsSelector().checkExists();
      // Click the deselect X button for existing secrets
      helmOpEditPage.secretsSelector().clickDeselectButton(secretsList[0].name);
      helmOpEditPage.secretsSelector().clickDeselectButton(secretsList[1].name);

      // Select new Secret
      helmOpEditPage.secretsSelector().toggle();
      helmOpEditPage.secretsSelector().clickLabel(secretName);

      // Remove existing ConfigMaps

      helmOpEditPage.configMapsSelector().checkExists();
      // Click the deselect X button for existing configmaps
      helmOpEditPage.configMapsSelector().clickDeselectButton(configMapsList[0].name);
      helmOpEditPage.configMapsSelector().clickDeselectButton(configMapsList[1].name);

      // Select new ConfigMap
      helmOpEditPage.configMapsSelector().toggle();
      helmOpEditPage.configMapsSelector().clickLabel(configMapName);

      // Save the HelmOp
      helmOpEditPage.resourceDetail().createEditView().save();

      // Wait for successful update request
      // Dashboard automatically retries on 409 conflicts, so we wait for requests until we get a 200
      cy.wait('@updateHelmOp').then((interception) => {
        if (interception.response?.statusCode === 200) {
          return cy.wrap(interception);
        }

        return cy.wait('@updateHelmOp', MEDIUM_TIMEOUT_OPT);
      }).then((interception) => {
        // Verify we got a successful response
        // If Dashboard's automatic retry didn't work, this will fail
        expect(interception.response?.statusCode).to.eq(200);

        return interception;
      }).then(({ request, response }: any) => {
        // Verify request payload contains downstreamResources in spec (not spec.helm)
        // testing: https://github.com/rancher/dashboard/pull/15921
        expect(request.body.spec.downstreamResources).to.be.an('array');

        // Verify Secret is in downstreamResources
        const requestSecrets = request.body.spec.downstreamResources.filter((r: any) => r.kind === 'Secret');

        // After removing old secrets and selecting a new one, only the new secret should be present
        expect(requestSecrets).to.have.length(1);
        expect(requestSecrets[0].name).to.eq(secretName);
        // Verify old secrets are not present
        expect(requestSecrets.map((s: any) => s.name)).to.not.include(secretsList[0].name);
        expect(requestSecrets.map((s: any) => s.name)).to.not.include(secretsList[1].name);

        // Verify ConfigMap is in downstreamResources
        const requestConfigMaps = request.body.spec.downstreamResources.filter((r: any) => r.kind === 'ConfigMap');

        // After removing old configmaps and selecting a new one, only the new configmap should be present
        expect(requestConfigMaps).to.have.length(1);
        expect(requestConfigMaps[0].name).to.eq(configMapName);
        // Verify old configmaps are not present
        expect(requestConfigMaps.map((cm: any) => cm.name)).to.not.include(configMapsList[0].name);
        expect(requestConfigMaps.map((cm: any) => cm.name)).to.not.include(configMapsList[1].name);

        // Total should be 2 (1 secret + 1 configmap) after removing old ones
        expect(request.body.spec.downstreamResources).to.have.length(2);

        // Verify response body contains downstreamResources (persistence check)
        expect(response?.body?.spec?.downstreamResources).to.be.an('array');
        expect(response.body.spec.downstreamResources).to.have.length(2);

        const responseSecrets = response.body.spec.downstreamResources.filter((r: any) => r.kind === 'Secret');

        expect(responseSecrets).to.have.length(1);
        expect(responseSecrets[0].name).to.eq(secretName);
        // Verify old secrets are not present in response
        expect(responseSecrets.map((s: any) => s.name)).to.not.include(secretsList[0].name);
        expect(responseSecrets.map((s: any) => s.name)).to.not.include(secretsList[1].name);

        const responseConfigMaps = response.body.spec.downstreamResources.filter((r: any) => r.kind === 'ConfigMap');

        expect(responseConfigMaps).to.have.length(1);
        expect(responseConfigMaps[0].name).to.eq(configMapName);
        // Verify old configmaps are not present in response
        expect(responseConfigMaps.map((cm: any) => cm.name)).to.not.include(configMapsList[0].name);
        expect(responseConfigMaps.map((cm: any) => cm.name)).to.not.include(configMapsList[1].name);
      });
    });
  });

  after(() => {
    // Clean up created HelmOp
    cy.deleteRancherResource('v1', 'fleet.cattle.io.helmops', `${ helmOpList[0] }`, false);

    // Clean up created Secrets
    secretsList.forEach((secret) => {
      cy.deleteRancherResource('v1', 'secrets', `${ secret.namespace }/${ secret.name }`, false);
    });

    // Clean up created ConfigMaps
    configMapsList.forEach((configMap) => {
      cy.deleteRancherResource('v1', 'configmaps', `${ configMap.namespace }/${ configMap.name }`, false);
    });
  });
});
