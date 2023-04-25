import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const { baseUrl } = Cypress.config();
// const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;

describe('rke1-provisioning', () => {
  const clusterList = new ClusterManagerListPagePo();

  beforeEach(() => {
    cy.login();
  });

  describe('RKE1 Custom cluster', () => {
    const createClusterPage = new ClusterManagerCreateRke1PagePo();

    it('can create a new cluster', () => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      createClusterPage.waitForPage();
      // createClusterPage.rkeToggle().toggle();
      createClusterPage.selectCustom(0);
    });
  });
});
