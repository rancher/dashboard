import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import EKSCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-eks.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

/**
 * Create page for an EKS cluster
 */
export default class ClusterManagerCreateEKSPagePo extends ClusterManagerCreateRke2AmazonPagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=amazoneks&rkeType=rke2`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AmazonPagePo.url(clusterId));
  }

  goToAmazonClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=amazoneks&rkeType=rke2`);
  }

  cloudCredentialsForm(): EKSCloudCredentialsCreateEditPo {
    return new EKSCloudCredentialsCreateEditPo();
  }

  getClusterName() {
    return new LabeledInputPo('[data-testid="eks-name-input"]');
  }

  getClusterDescription() {
    return new LabeledInputPo('[placeholder*="better describes this resource"]');
}
}