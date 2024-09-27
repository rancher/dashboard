import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import { machineSelectorConfigPayload, registriesWithSecretPayload } from '@/cypress/e2e/blueprints/manager/registries-rke2-payload';

const registryHost = 'docker.io';
const registryAuthHost = 'a.registry.com';

describe.skip('[Vue3 Skip]: Registries for RKE2', { tags: ['@manager', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    cy.createE2EResourceName('cluster').as('clusterName');
  });

  it('Should send the correct payload to the server', function() {
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
    });
    cy.wait('@customRKE2ClusterCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      expect(req.request?.body?.spec.rkeConfig.machineSelectorConfig).to.deep.equal(machineSelectorConfigPayload(registryHost));
      expect(req.request?.body?.spec.rkeConfig.registries).to.deep.equal(
        registriesWithSecretPayload(
          registryAuthHost,
          registrySecret
        ));
      expect(req.request?.body?.spec.rkeConfig.registries.configs[registryHost]).to.equal(undefined);
    });
  });
});
