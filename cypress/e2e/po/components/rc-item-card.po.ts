import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenu from '@/cypress/e2e/po/components/action-menu.po';

export default class RcItemCardPo extends ComponentPo {
  static getCardById(id: string) {
    return new RcItemCardPo(`[data-testid="item-card-${ id }"]`);
  }

  static getCardByTitle(title: string, options?: Partial<Cypress.Timeoutable>) {
    const cardElement = () => cy.get('[data-testid="item-card-header-title"]', options)
      .contains(title)
      .parents('[data-testid*="item-card-"]')
      .first();

    return new RcItemCardPo(cardElement);
  }

  getImage() {
    return this.self().get('[data-testid="item-card-image"] img');
  }

  click() {
    this.self().click();
  }

  openActionMenu() {
    this.self().find('[data-testid="item-card-header-action-menu"]').click();

    return new ActionMenu(undefined);
  }
}
