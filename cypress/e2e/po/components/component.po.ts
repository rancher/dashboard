import { CypressChainable } from '@/cypress/e2e/po/po.types';

const isVisible = (selector: string) => () => {
  return cy.get('body').then((body) => {
    return !!body.find(selector).length;
  });
};

export type CypressChainableFunction = () => CypressChainable;
export type JQueryElement = { jquery: string };

export default class ComponentPo {
  public self: () => CypressChainable;
  public isVisible?: () => Cypress.Chainable<boolean>;
  protected selector = '';

  constructor(self: CypressChainable);
  constructor(self: CypressChainableFunction);
  constructor(selector: string, parent?: CypressChainable);
  constructor(self: JQueryElement);
  constructor(...args: Array<any>) {
    if (typeof args[0] === 'string') {
      const [selector, parent] = args as [string, CypressChainable];

      this.self = () => (parent || cy).get(selector);
      if (!parent) {
        // only works if we can find the element via jquery
        this.isVisible = isVisible(selector);
      }
      this.selector = selector;
    } else if (typeof args[0] === 'function') {
      const [self] = args as [CypressChainableFunction];

      this.self = self;
    } else if (args[0].jquery) {
      // Jquery element - need to wrap (using a function means its evaluated when needed)
      this.self = () => cy.wrap(args[0]);
    } else {
      // Note - if the element is removed from screen and shown again this will fail
      const [self] = args as [CypressChainable];

      this.self = () => self;
    }
  }

  isDisabled(): Cypress.Chainable<boolean> {
    return this.self().invoke('attr', 'disabled').then((disabled) => disabled === 'disabled');
  }

  checkVisible(): Cypress.Chainable<boolean> {
    return this.self().scrollIntoView().should('be.visible');
  }

  checkNotVisible(): Cypress.Chainable<boolean> {
    return this.self().scrollIntoView().should('not.be.visible');
  }

  checkExists(): Cypress.Chainable<boolean> {
    return this.self().should('exist');
  }

  checkNotExists(): Cypress.Chainable<boolean> {
    return this.self().should('not.exist');
  }
}
