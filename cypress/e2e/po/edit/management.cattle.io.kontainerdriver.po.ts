import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';

export default class MgmtKontainerDriverEditPo extends PagePo {
  private static createPath(clusterId: string, type = 'create') {
    return `/c/${ clusterId }/manager/kontainerDriver/create`;
  }

  static goTo(clusterId: string, type = 'create'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MgmtKontainerDriverEditPo.createPath(clusterId, type));
  }

  constructor(clusterId: string, type = 'create') {
    super(MgmtKontainerDriverEditPo.createPath(clusterId, type));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  urlField() {
    return this.self().get('[data-testid="driver-create-url-field"]').invoke('val');
  }

  enterUrl(url: string) {
    return new LabeledInputPo('[data-testid="driver-create-url-field"]').set(url);
  }

  uiUrlField() {
    return this.self().get('[data-testid="driver-create-uiurl-field"]').invoke('val');
  }

  enterUiUrl(url: string) {
    return new LabeledInputPo('[data-testid="driver-create-uiurl-field"]').set(url);
  }

  checksumField() {
    return this.self().get('[data-testid="driver-create-checksum-field"]').invoke('val');
  }

  enterChecksum(checksum: string) {
    return new LabeledInputPo('[data-testid="driver-create-checksum-field"]').set(checksum);
  }

  whitelistDomains() {
    return new ArrayListPo('[data-testid="driver-create-whitelist-list"]');
  }

  addWhitelistDomain(domain: string, idx: number) {
    return new ArrayListPo('[data-testid="driver-create-whitelist-list"]').setValueAtIndex(domain, idx);
  }

  create() {
    return this.resourceDetail().createEditView().create();
  }

  save() {
    return new AsyncButtonPo('[data-testid="action-button"]').click();
  }
}
