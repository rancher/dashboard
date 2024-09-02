import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';

const cloudCredentialsResponse = {
  type:         'collection',
  resourceType: 'cloudCredential',
  data:         [
    {
      annotations:                  { 'provisioning.cattle.io/driver': 'digitalocean' },
      baseType:                     'cloudCredential',
      created:                      '2023-05-17T12:03:44Z',
      createdTS:                    1684325024000,
      creatorId:                    'user-8ajxt',
      digitaloceancredentialConfig: {},
      id:                           'cattle-global-data:cc-zzz2l',
      labels:                       { 'cattle.io/creator': 'norman' },
      name:                         'cypress-do',
      type:                         'cloudCredential',
      uuid:                         'abc6bb3f-0876-4e0f-8057-04d2cc8bdd17'
    }
  ]
};

// Simple helper for reply with a 200 status code
function reply(statusCode: number, body: any): any {
  return (req: any) => {
    req.reply({
      statusCode,
      body
    });
  };
}

describe('RKE2 Cilium CNI', () => {
  beforeEach(() => {
    cy.login();
  });

  it('ipv6 configuration is sent correctly on cluster create', { tags: ['@manager', '@adminUser'] }, () => {
    cy.intercept('GET', '/v3/cloudcredentials', reply(200, cloudCredentialsResponse)).as('cloudCredentials');

    const clusterList = new ClusterManagerListPagePo();
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();
    const clusterName = 'test-do-cilium';

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.goToDigitalOceanCreation('_');
    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.nameNsDescription().name().set(clusterName);

    cy.wait('@cloudCredentials');

    cy.intercept('POST', `/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default`, reply(201, {})).as('dummyMachinePoolSave');
    cy.intercept('POST', `/v1/provisioning.cattle.io.clusters`, reply(201, {})).as('dummyProvClusterSave');

    const labeledSelectPo = new LabeledSelectPo('[data-testid="cluster-rke2-cni-select"]');

    labeledSelectPo.checkExists();
    labeledSelectPo.self().scrollIntoView();

    labeledSelectPo.checkOptionSelected('calico');

    const ipv6 = new CheckboxInputPo('[data-testid="cluster-rke2-cni-ipv6-checkbox"]');

    ipv6.checkNotExists();

    // Change to 'cilium'
    labeledSelectPo.toggle();
    labeledSelectPo.clickLabel('cilium');
    labeledSelectPo.checkOptionSelected('cilium');
    labeledSelectPo.isClosed();

    // Check that the ipv6 checkbox shows up and is not selected
    ipv6.checkExists();
    ipv6.isUnchecked();

    // Check the ipv6 checkbox to enable ipv6 support
    ipv6.set();
    ipv6.isChecked();

    createRKE2ClusterPage.create();

    cy.wait('@dummyMachinePoolSave');

    // If we create the cluster now, check that the model is sent correctly for the new ipv6 format
    cy.wait('@dummyProvClusterSave').then(({ request }) => {
      expect(request.body.spec.rkeConfig.chartValues['rke2-cilium'].ipv6.enabled).to.equal(true);
    });
  });

  it('bandwidth manager configuration is sent correctly on cluster create', { tags: ['@manager', '@adminUser'] }, () => {
    cy.intercept('GET', '/v3/cloudcredentials', reply(200, cloudCredentialsResponse)).as('cloudCredentials');

    const clusterList = new ClusterManagerListPagePo();
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();
    const clusterName = 'test-do-cilium';

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.goToDigitalOceanCreation('_');
    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.nameNsDescription().name().set(clusterName);

    cy.wait('@cloudCredentials');

    cy.intercept('POST', `/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default`, reply(201, {})).as('dummyMachinePoolSave');
    cy.intercept('POST', `/v1/provisioning.cattle.io.clusters`, reply(201, {})).as('dummyProvClusterSave');

    const labeledSelectPo = new LabeledSelectPo('[data-testid="cluster-rke2-cni-select"]');

    labeledSelectPo.checkExists();
    labeledSelectPo.self().scrollIntoView();

    labeledSelectPo.checkOptionSelected('calico');

    const bandwidthManager = new CheckboxInputPo('[data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"]');

    bandwidthManager.checkNotExists();

    // Change to 'cilium'
    labeledSelectPo.toggle();
    labeledSelectPo.clickLabel('cilium');
    labeledSelectPo.checkOptionSelected('cilium');
    labeledSelectPo.isClosed();

    // Check that the Bandwidth Manager checkbox shows up and is not selected
    bandwidthManager.checkExists();
    bandwidthManager.isUnchecked();

    // Check the Bandwidth Manager checkbox to enable bandwidth manager support
    bandwidthManager.set();
    bandwidthManager.isChecked();

    createRKE2ClusterPage.create();

    cy.wait('@dummyMachinePoolSave');

    // If we create the cluster now, check that the model is sent correctly
    cy.wait('@dummyProvClusterSave').then(({ request }) => {
      expect(request.body.spec.rkeConfig.chartValues['rke2-cilium'].bandwidthManager.enabled).to.equal(true);
    });
  });
});
