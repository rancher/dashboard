import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class RcItemCardPo extends ComponentPo {
  static getCardById(id: string) {
    return new RcItemCardPo(`[data-testid="item-card-${ id }"`);
  }

  static getCardByTitle(title: string) {
    return new RcItemCardPo(cy.get('.item-card').contains(title));
  }

  getImage() {
    return this.self().get('[data-testid="item-card-image"] img');
  }

  click() {
    this.self().click({ force: true });
  }
}
