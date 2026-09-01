import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import GKECloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-gke.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

/**
 * Create page for a GKE cluster
 */
export default class ClusterManagerCreateGKEPagePo extends ClusterManagerCreatePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=googlegke`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateGKEPagePo.url(clusterId));
  }

  goToGKEClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=googlegke`);
  }

  cloudCredentialsForm(): GKECloudCredentialsCreateEditPo {
    return new GKECloudCredentialsCreateEditPo();
  }

  authProjectId(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Google Project ID');
  }

  saveCreateGkeCluster(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  static getGkeVersionSelect() {
    return new LabeledSelectPo('[data-testid="gke-version-select"]');
  }

  static getGkeZoneSelect() {
    return new LabeledSelectPo('[data-testid="gke-zone-select"]');
  }

  getClusterName() {
    return new LabeledInputPo('[data-testid="gke-cluster-name"]');
  }

  getClusterDescription() {
    return new LabeledInputPo('[data-testid="gke-cluster-description"]');
  }
}
