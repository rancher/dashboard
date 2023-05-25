import ComponentPo from '~/cypress/e2e/po/components/component.po';
import { CypressChainable } from '~/cypress/e2e/po/po.types';

export default class CardPo extends ComponentPo {
  private readonly cardSelector = '[data-testid="card"]';

  getTitle(): CypressChainable {
    return cy.get(this.cardSelector).get('[data-testid="card-title-slot"]');
  }

  getBody(): CypressChainable {
    return cy.get(this.cardSelector).get('[data-testid="card-body-slot"]');
  }

  getActionButton(): CypressChainable {
    return cy.get(this.cardSelector).get('[data-testid="card-actions-slot"]');
  }
}
