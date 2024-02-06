import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ResourceListMastheadPo extends ComponentPo {
  actions() {
    return this.self().get('.actions-container .actions .btn');
  }

  title() {
    return this.self().get('.title h1').invoke('text');
  }

  create() {
    return this.self().find('[data-testid="masthead-create-yaml"]').click();
  }
}
