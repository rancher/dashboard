import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ACE from '@/cypress/e2e/po/components/ace.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Edit page for imported cluster
 */
export default class ClusterManagerEditImportedPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default`;
  }

  static goTo(clusterId: string ): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditImportedPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(ClusterManagerEditImportedPagePo.createPath(clusterId));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  ace(): ACE {
    return new ACE();
  }

  enableNetworkAccordion() {
    return this.self().find('[data-testid="network-accordion"]').click();
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }
}
