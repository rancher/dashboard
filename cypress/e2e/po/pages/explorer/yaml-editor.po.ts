import PagePo from '@/cypress/e2e/po/pages/page.po';
import KeyboardMappingIndicatorPo from '@/cypress/e2e/po/components/keyboard-mapping-indicator.po';

export default class ResourceYamlEditorPagePo extends PagePo {
  private static createPath(resourceId: string, clusterId = 'local') {
    return `/c/${ clusterId }/explorer/${ resourceId }/create?as=yaml`;
  }

  static goTo(resourceId: string, clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ResourceYamlEditorPagePo.createPath(resourceId, clusterId));
  }

  constructor(resourceId: string, clusterId = 'local') {
    super(ResourceYamlEditorPagePo.createPath(resourceId, clusterId));
  }

  // Get the keyboard mapping indicator that can app[ear in the top-right
  keyboardMappingIndicator() {
    return new KeyboardMappingIndicatorPo();
  }
}
