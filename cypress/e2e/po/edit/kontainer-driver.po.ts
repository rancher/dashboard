import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';

export default class KontainerDriverCreateEditPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/kontainerDriver/create`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KontainerDriverCreateEditPo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(KontainerDriverCreateEditPo.createPath(clusterId));
  }

  downloadUrl() {
    return new LabeledInputPo('[data-testid="driver-create-url-field"]');
  }

  customUiUrl() {
    return new LabeledInputPo('[data-testid="driver-create-uiurl-field"]');
  }

  checksum() {
    return new LabeledInputPo('[data-testid="driver-create-checksum-field"]');
  }

  whitelistDomains() {
    return new ArrayListPo('[data-testid="driver-create-whitelist-list"]');
  }

  addWhitelistDomain(domain: string, idx: number) {
    return new ArrayListPo('[data-testid="driver-create-whitelist-list"]').setValueAtIndex(domain, idx);
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
