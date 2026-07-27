import ComponentPo from '@/cypress/e2e/po/components/component.po';

/**
 * The 'fail whale' error content.
 *
 * Used both as the full page (`shell/pages/fail-whale.vue`) and in-context, in place of a
 * resource list, when the resource type is unknown (`shell/components/FailWhale.vue`).
 */
export default class FailWhalePo extends ComponentPo {
  constructor() {
    super('[data-testid="fail-whale"]');
  }

  /**
   * The error title (e.g. 'Error' or 'HTTP Error 404: ...')
   */
  title() {
    return this.self().find('h1');
  }

  /**
   * The error message
   */
  message() {
    return this.self().find('h2');
  }
}
