import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ACE from '@/cypress/e2e/po/components/ace.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Edit page for imported cluster
 */
export default class ClusterManagerEditImportedPagePo extends PagePo {
  private static createPath(clusterId: string, clusterName: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterId: string, clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditImportedPagePo.createPath(clusterId, clusterName));
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerEditImportedPagePo.createPath(clusterId, clusterName));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  ace(): ACE {
    return new ACE();
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }
}
