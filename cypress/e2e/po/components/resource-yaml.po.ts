import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class ResourceYamlPo extends ComponentPo {
  constructor(parent?: CypressChainable) {
    super('.resource-yaml', parent);
  }

  body(): Cypress.Chainable {
    return this.self().find('.vue-codemirror');
  }

  footer(): Cypress.Chainable {
    return this.self().find('.footer');
  }

  saveOrCreate(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }
}
