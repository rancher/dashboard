import PagePo from '@/cypress/e2e/po/pages/page.po';

import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Edit page for imported cluster
 */
export default class ClusterManagerImportGenericPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/create`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerImportGenericPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(ClusterManagerImportGenericPagePo.createPath(clusterId));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  selectGeneric(index: number) {
    return this.resourceDetail().cruResource().selectSubType(1, index).click();
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }

  create() {
    return this.resourceDetail().createEditView().create();
  }
}
