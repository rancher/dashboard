import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import { machineSelectorConfigPayload, registriesWithSecretPayload } from '@/cypress/e2e/blueprints/manager/registries-rke2-payload';

const registryHost = 'docker.io';
const registryAuthHost = 'a.registry.com';

const clusters = [];
const secrets = [];

describe('Registries for RKE2', { tags: ['@manager', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    cy.createE2EResourceName('cluster').as('clusterName');
    cy.createE2EResourceName('cluster2').as('clusterName2');
  });

  after(() => {
    clusters.forEach((name) => {
      cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/fleet-default`, `${ name }`);
    });

    secrets.forEach((name) => {
      cy.deleteRancherResource('v1', `secrets/fleet-default`, `${ name }`);
    });
  });

  it('HTTP Basic Auth: Should send the correct payload to the server', function() {
    const clusterList = new ClusterManagerListPagePo();
    const createCustomClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    clusterList.goTo();

    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createCustomClusterPage.waitForPage();
    createCustomClusterPage.rkeToggle().set('RKE2/K3s');

    createCustomClusterPage.selectCustom(0);

    // intercepts
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('customRKE2ClusterCreation');
    cy.intercept('POST', 'v1/secrets/fleet-default').as('registrySecretCreation');

    // cluster name
    createCustomClusterPage.nameNsDescription().name().set(this.clusterName);
    // navigate to Registries tab
    createCustomClusterPage.clusterConfigurationTabs().clickTabWithSelector('#registry');
    // enable registry
    createCustomClusterPage.registries().enableRegistryCheckbox().set();
    // add host
    createCustomClusterPage.registries().addRegistryHost(registryHost);
    // click show advanced
    createCustomClusterPage.registries().clickShowAdvanced();
    // scroll down to registry auth
    createCustomClusterPage.registries().registryConfigs().registryAuthHost(0).self()
      .scrollIntoView();
    // add url
    createCustomClusterPage.registries().registryConfigs().addRegistryAuthHost(0, registryAuthHost);
    // make sure it's not in loading state
    createCustomClusterPage.registries().registryConfigs().registryAuthSelectOrCreate(0).loading()
      .should('not.exist', { timeout: 1000 });
    // create basic secret
    createCustomClusterPage.registries().registryConfigs().registryAuthSelectOrCreate(0).createBasicAuth('test-user', 'test-pass');
    // save
    createCustomClusterPage.create();

    let registrySecret;

    // need to do a wait to make sure intercept doesn't fail on cy.wait for request
    // ci/cd pipelines are notoriously slow... let's wait longer than usual
    cy.wait('@registrySecretCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      registrySecret = req.response?.body?.metadata?.name;

      secrets.push(registrySecret);
    });
    cy.wait('@customRKE2ClusterCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);

      clusters.push(req.response?.body?.metadata.name);

      expect(req.request?.body?.spec.rkeConfig.machineSelectorConfig).to.deep.equal(machineSelectorConfigPayload(registryHost));
      expect(req.request?.body?.spec.rkeConfig.registries).to.deep.equal(
        registriesWithSecretPayload(
          registryAuthHost,
          registrySecret
        ));
      expect(req.request?.body?.spec.rkeConfig.registries.configs[registryHost]).to.equal(undefined);
    });
  });

  it('RKE Auth: Should send the correct payload to the server', function() {
    const clusterList = new ClusterManagerListPagePo();
    const createCustomClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    clusterList.goTo();

    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createCustomClusterPage.waitForPage();
    createCustomClusterPage.rkeToggle().set('RKE2/K3s');

    createCustomClusterPage.selectCustom(0);

    // intercepts
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('customRKE2ClusterCreation');
    cy.intercept('POST', 'v1/secrets/fleet-default').as('registrySecretCreation');

    // cluster name
    createCustomClusterPage.nameNsDescription().name().set(this.clusterName2);
    // navigate to Registries tab
    createCustomClusterPage.clusterConfigurationTabs().clickTabWithSelector('#registry');
    // enable registry
    createCustomClusterPage.registries().enableRegistryCheckbox().set();
    // add host
    createCustomClusterPage.registries().addRegistryHost(registryHost);

    createCustomClusterPage.registries().advancedToggle().scrollIntoView();

    createCustomClusterPage.registries().registryAuthSelector().createRKEAuth('testuser', 'testpassword');

    // save
    createCustomClusterPage.create();

    let registrySecret;

    // need to do a wait to make sure intercept doesn't fail on cy.wait for request
    // ci/cd pipelines are notoriously slow... let's wait longer than usual
    cy.wait('@registrySecretCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      registrySecret = req.response?.body?.metadata?.name;

      // Check registrySecret fields
      expect(req.request.body?.type).to.equal('rke.cattle.io/auth-config');
      expect(req.request.body?.data?.auth).to.equal('dGVzdHVzZXI6dGVzdHBhc3N3b3Jk');
      expect(req.request.body?.data?.username).to.equal(undefined);
      expect(req.request.body?.data?.password).to.equal(undefined);

      secrets.push(registrySecret);
    });

    cy.wait('@customRKE2ClusterCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);

      clusters.push(req.response?.body?.metadata.name);

      expect(req.request?.body?.spec.rkeConfig.machineSelectorConfig).to.deep.equal(machineSelectorConfigPayload(registryHost));
      expect(req.request?.body?.spec.rkeConfig.registries).to.deep.equal(
        registriesWithSecretPayload(
          registryHost,
          registrySecret,
          true
        ));
    });
  });
});
