import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import * as jsyaml from 'js-yaml';
import { promptModal } from '@/cypress/e2e/po/prompts/shared/modalInstances.po';

describe('Cluster List', { tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();

  let nsName = '';
  let customClusterName = '';
  let deleteNs = false;

  before(() => {
    cy.login();

    cy.createE2EResourceName('namespace').then((name) => {
      nsName = name;
    });

    cy.createE2EResourceName('generic-cluster').then((name) => {
      customClusterName = name;
    });
  });

  it('can group clusters by namespace', () => {
    cy.intercept('POST', '/v1/provisioning.cattle.io.clusters').as('createCluster');

    // create ns
    cy.createNamespace(nsName).then(() => {
      deleteNs = true;
    });

    clusterList.goTo();
    clusterList.waitForPage();
    // group by namespace feature should not visible by default
    clusterList.list().resourceTable().sortableTable().groupByButtons(0)
      .should('not.exist');

    clusterList.createCluster();
    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.selectCustom(0);
    createRKE2ClusterPage.title().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain('Cluster: Create Custom');
    });
    createRKE2ClusterPage.nameNsDescription().name().checkVisible();
    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.resourceDetail().createEditView().editClusterAsYaml();
    promptModal().checkVisible();
    promptModal().clickActionButton('Save and Continue');
    createRKE2ClusterPage.waitForPage('type=custom&rkeType=rke2', 'basic');
    // provision cluster into a custom namespace
    createRKE2ClusterPage.resourceDetail().resourceYaml().codeMirror().value()
      .then((val) => {
        // convert yaml into json to update values
        const json: any = jsyaml.load(val);

        json.metadata.name = customClusterName;
        json.metadata.namespace = nsName;

        createRKE2ClusterPage.resourceDetail().resourceYaml().codeMirror().set(jsyaml.dump(json));
      });

    createRKE2ClusterPage.resourceDetail().createEditView().saveClusterAsYaml();
    cy.wait('@createCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata.namespace).equals(nsName);
    });
    clusterList.waitForPage();

    clusterList.goTo();
    clusterList.list().state(customClusterName).should('contain.text', 'Updating');

    // testing https://github.com/rancher/dashboard/issues/13341
    // group by namespace feature should be visible - group by namespace
    clusterList.list().resourceTable().sortableTable().groupByButtons(1)
      .should('be.visible')
      .click();
    clusterList.list().resourceTable().sortableTable().groupElementWithName(`Namespace: ${ nsName }`)
      .scrollIntoView()
      .should('be.visible');
  });

  after('clean up', () => {
    if (deleteNs) {
      cy.deleteRancherResource('v1', 'namespaces', nsName);
    }
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
