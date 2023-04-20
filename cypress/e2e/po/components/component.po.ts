import { CypressChainable } from '@/cypress/e2e/po/po.types';

const isVisible = (selector: string) => () => {
  return cy.get('body').then((body) => {
    return !!body.find(selector).length;
  });
};

export default class ComponentPo {
  public self: () => CypressChainable;
  public isVisible?: () => Cypress.Chainable<boolean>;

  constructor(self: CypressChainable);
  constructor(selector: string, parent?: CypressChainable);// selector should be jquery.Selector
  constructor(...args: Array<any>) {
    if (typeof args[0] === 'string') {
      const [selector, parent] = args as [string, CypressChainable];

      this.self = () => (parent || cy).get(selector);
      if (!parent) {
        // only works if we can find the element via jquery
        this.isVisible = isVisible(selector);
      }
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
