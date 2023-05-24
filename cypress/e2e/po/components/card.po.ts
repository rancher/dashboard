import { CypressChainable } from '~/cypress/e2e/po/po.types';

export default class CardPo {
  private readonly cardSelector: string;

  constructor() {
    this.cardSelector = '[data-testid="card"]';
  }

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
