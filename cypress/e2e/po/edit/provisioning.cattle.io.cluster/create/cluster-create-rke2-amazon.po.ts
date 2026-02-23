import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import MachinePoolRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/machine-pools-tab-rke2.po';
import BasicsRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/basics-tab-rke2.po';
import AmazonCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-amazon.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import NetworkRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/networking-tab-rke2.po';

/**
 * Create page for an RKE2 Amazon EC2 cluster
 */
export default class ClusterManagerCreateRke2AmazonPagePo extends ClusterManagerCreatePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=amazonec2#basic`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AmazonPagePo.url(clusterId));
  }

  goToAmazonClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=amazonec2#basic`);
  }

  cloudCredentialsForm(): AmazonCloudCredentialsCreateEditPo {
    return new AmazonCloudCredentialsCreateEditPo();
  }

  clusterConfigurationTabs(): TabbedPo {
    return new TabbedPo();
  }

  machinePoolTab(): MachinePoolRke2 {
    return new MachinePoolRke2();
  }

  basicsTab(): BasicsRke2 {
    return new BasicsRke2();
  }

  networkTab(): NetworkRke2 {
    return new NetworkRke2();
  }

  ipv6ConfirmationDialog() {
    return cy.get('body').find('[data-testid="ipv6-dialog"]');
  }

  ipv6Recommendations() {
    return cy.get('body').find('[data-testid="ipv6-dialog-reasons"] li');
  }
}
