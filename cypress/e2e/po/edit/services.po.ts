import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

export default class ServicesCreateEditPo extends PagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/service`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, id?: string) {
    super(ServicesCreateEditPo.createPath(clusterId, namespace, id));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  title() {
    return this.self().get('.title .primaryheader  h1');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  selectNamespace(label: string) {
    const selectNs = new LabeledSelectPo(`[data-testid="name-ns-description-namespace"]`, this.self());

    selectNs.toggle();
    selectNs.clickLabel(label);
  }

  selectServiceOption(index: number) {
    return this.resourceDetail().cruResource().selectSubTypeByIndex(index).click();
  }

  tabs() {
    return new TabbedPo('[data-testid="tabbed"]');
  }

  externalNameTab() {
    return this.tabs().clickTabWithSelector('[data-testid="define-external-name"]');
  }

  externalNameInput() {
    return new LabeledInputPo('#define-external-name .labeled-input input');
  }

  ipAddressesTab() {
    return this.tabs().clickTabWithSelector('[data-testid="ips"]');
  }

  ipAddressList() {
    return new ArrayListPo('section#ips');
  }

  lablesAnnotationsTab() {
    return this.tabs().clickTabWithSelector('[data-testid="btn-labels-and-annotations"]');
  }

  lablesAnnotationsKeyValue() {
    return new KeyValuePo('section#labels-and-annotations');
  }

  errorBanner() {
    return cy.get('#cru-errors');
  }
}
