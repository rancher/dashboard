import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ResourceDetailMastheadPo extends ComponentPo {
  /**
   * Get the resource status badge in the masthead
   */
  resourceStatus() {
    return this.self().find('h1.title .badge-state .msg');
  }

  /**
   * Get the resource title text
   */
  resourceTitle() {
    return this.self().find('h1.title');
  }

  /**
   * Get the resource name from the title
   */
  resourceName() {
    return this.self().find('h1.title .name');
  }
}
