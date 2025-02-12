import { CypressChainable } from '@/cypress/e2e/po/po.types';

const isVisible = (selector: string) => () => {
  return cy.get('body').then((body) => {
    return !!body.find(selector).length;
  });
};

export type CypressChainableFunction = () => CypressChainable;
export type JQueryElement = { jquery: string };

export type GetOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>;

export default class ComponentPo {
  public self: (options?: GetOptions) => CypressChainable;
  public isVisible?: () => Cypress.Chainable<boolean>;
  protected selector = '';

  constructor(self: CypressChainable);
  constructor(self: CypressChainableFunction);
  constructor(selector: string, parent?: CypressChainable);
  constructor(self: JQueryElement);
  constructor(...args: Array<any>) {
    if (typeof args[0] === 'string') {
      const [selector, parent] = args as [string, CypressChainable];

      this.self = (options) => (parent || cy).get(selector, options);
      if (!parent) {
        // only works if we can find the element via jquery
        this.isVisible = isVisible(selector);
      }
      this.selector = selector;
    } else if (typeof args[0] === 'function') {
      const [self] = args as [CypressChainableFunction];

      this.self = (options?) => {
        if (options) {
          cy.log('self() does not support options when constructed with a Cypress chainable function');
        }

        return self();
      };
    } else if (args[0].jquery) {
      // Jquery element - need to wrap (using a function means its evaluated when needed)
      this.self = (options?) => {
        if (options) {
          cy.log('self() does not support options when constructed with a jQuery element');
        }

        return cy.wrap(args[0]);
      };
    } else {
      // Note - if the element is removed from screen and shown again this will fail
      const [self] = args as [CypressChainable];

      this.self = (options?) => {
        if (options) {
          cy.log('self() does not support options when constructed with a Cypress chainable');
        }

        return self;
      };
    }
  }

  isDisabled(): Cypress.Chainable<boolean> {
    return this.self().invoke('attr', 'disabled').then((disabled) => disabled === 'disabled');
  }

  checkVisible(options?: GetOptions): Cypress.Chainable<boolean> {
    return this.self(options).scrollIntoView().should('be.visible');
  }

  checkNotVisible(): Cypress.Chainable<boolean> {
    return this.self().scrollIntoView().should('not.be.visible');
  }

  checkExists(): Cypress.Chainable<boolean> {
    return this.self().should('exist');
  }

  checkNotExists(options?: GetOptions): Cypress.Chainable<boolean> {
    return this.self(options).should('not.exist');
  }

  shouldHaveValue(value: string, options?: GetOptions): Cypress.Chainable<boolean> {
    return this.self(options).should('have.value', value);
  }
}
