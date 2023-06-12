import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

// const isVisible = (selector: string) => () => {
//   return getIframeDocument().get('body').then((body) => {
//     return !!body.find(selector).length;
//   });
// };

// const getIframeDocument = () => {
//   return cy.get('[data-testid="ember-iframe"]').its('0.contentDocument.body').should('not.be.empty')
//     .then(cy.wrap);
// };

export default class IframeComponentPo extends ComponentPo {
  constructor(self: CypressChainable);
  constructor(selector: string, parent?: CypressChainable)
  constructor(...args: Array<any>) {
    if (typeof args[0] === 'string') {
      super(cy.getIframeBody().find(args[0]));
      this.selector = args[0];
    } else {
      super(args[0]);
    }
  }

  // constructor(selector: string, parent?: CypressChainable)
  // {
  //   if (parent) {
  //     super(parent.find(selector));
  //   } else {
  //     super(cy.getIframeBody().find(selector));
  //   }
  // }

  // // Note - only selector allowed

  //   self = () => {
  //     return cy.getIframeBody().find(this.selector);
  //   }
}
