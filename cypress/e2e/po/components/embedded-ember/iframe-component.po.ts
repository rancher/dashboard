import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

const isVisible = (selector: string) => () => {
  return getIframeDocument().get('body').then((body) => {
    return !!body.find(selector).length;
  });
};

const getIframeDocument = () => {
  return cy.get('iframe[data-testid="ember-iframe"]').its('0.contentDocument').should('exist')
    .then(cy.wrap);
};

export default class IframeComponentPo extends ComponentPo {
  constructor(selector: string) {
    const parent = getIframeDocument().get('body').then(cy.wrap);

    super(selector, parent);
  }
}
