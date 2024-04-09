import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import MachinePoolRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/machine-pools-tab-rke2.po';
import BasicsRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/basics-tab-rke2.po';
import AzureCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-azure.po';

/**
 * Create page for an RKE2 Azure cluster
 */
export default class ClusterManagerCreateRke2AzurePagePo extends ClusterManagerCreatePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=azure`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AzurePagePo.url(clusterId));
  }

  goToAzureClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=azure`);
  }

  cloudCredentialsForm(): AzureCloudCredentialsCreateEditPo {
    return new AzureCloudCredentialsCreateEditPo();
  }

  machinePoolTab(): MachinePoolRke2 {
    return new MachinePoolRke2();
  }

  basicsTab(): BasicsRke2 {
    return new BasicsRke2();
  }
}
