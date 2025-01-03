import CardPo from '@/cypress/e2e/po/components/card.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class ModalWithCardPo {
  private readonly modalSelector: string;
  private readonly card: any;

  constructor() {
    this.modalSelector = '[data-testid="mvc__card"]';
    this.card = new CardPo();
  }

  getModal(): CypressChainable {
    return cy.get(this.modalSelector).should('exist');
  }

  shouldNotExist(): CypressChainable {
    return cy.get(this.modalSelector).should('not.exist');
  }

  getCardTitle(): CypressChainable {
    return this.card.getTitle().should('exist');
  }

  getCardBody(): CypressChainable {
    return this.card.getBody().should('exist');
  }

  getCardActions(): CypressChainable {
    return this.card.getActionButton().should('exist');
  }
}
