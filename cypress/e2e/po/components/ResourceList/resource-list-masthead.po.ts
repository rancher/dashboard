import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ResourceListMastheadPo extends ComponentPo {
  actions() {
    return this.self().get('.actions-container .actions .btn');
  }
}
