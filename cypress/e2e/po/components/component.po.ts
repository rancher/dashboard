import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class ComponentPo {
  public self: () => CypressChainable

  constructor(self: CypressChainable);
  constructor(selector: string, parent?: CypressChainable);// selector should be jquery.Selector
  constructor(...args: Array<any>) {
    if (typeof args[0] === 'string') {
      const [selector, parent] = args as [string, CypressChainable];

      this.self = () => (parent || cy).get(selector);
    } else {
      // Note - if the element is removed from screen and shown again this will fail
      const [self] = args as [CypressChainable];

      this.self = () => self;
    }
  }

  isDisabled(): Cypress.Chainable<boolean> {
    return this.self().invoke('attr', 'disabled').then(disabled => disabled === 'disabled');
  }

  checkVisible(): Cypress.Chainable<boolean> {
    return this.self().should('be.visible');
  }
}
