import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ResourceListMastheadPo extends ComponentPo {
  actions() {
    return this.self().get('.actions-container .actions .btn, [data-testid="masthead-action-menu"]');
  }

  title() {
    return this.self().get('.title h1, .primaryheader h1, .title-bar h1.title').invoke('text');
  }

  createYaml() {
    return this.self().find('[data-testid="masthead-create-yaml"]').click();
  }

  create() {
    return this.self().find('[data-testid="masthead-create"]').click();
  }
}
