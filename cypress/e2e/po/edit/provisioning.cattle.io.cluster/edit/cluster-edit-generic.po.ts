import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

/**
 * Covers core functionality that's common to the dashboard's edit cluster pages
 */
export default class ClusterManagerEditGenericPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterName: string, tab?: string) {
    return `/c/local/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditGenericPagePo.createPath(clusterName));
  }

  constructor(clusterName: string) {
    super(ClusterManagerEditGenericPagePo.createPath(clusterName));
  }

  selectOptionForCloudCredentialWithLabel(label: string) {
    const cloudCredSelect = new LabeledSelectPo(`[data-testid="cluster-prov-select-credential"]`, this.self());

    cloudCredSelect.toggle();
    cloudCredSelect.clickOptionWithLabel(label);
  }

  saveEditCluster() {
    return new AsyncButtonPo('[data-testid="rke2-custom-create-save"]').click();
  }
}
