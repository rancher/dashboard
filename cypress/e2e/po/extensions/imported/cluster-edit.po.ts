import PagePo from '@/cypress/e2e/po/pages/page.po';
import ACE from '@/cypress/e2e/po/components/ace.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

/**
 * Edit page for imported cluster
 */
export default class ClusterManagerEditImportedPagePo extends PagePo {
  private static createPath(clusterId: string, clusterName: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterId: string, clusterName: string ): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditImportedPagePo.createPath(clusterId, clusterName));
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerEditImportedPagePo.createPath(clusterId, clusterName));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
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
