import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenu from '@/cypress/e2e/po/components/action-menu.po';

export default class RcItemCardPo extends ComponentPo {
  static getCardById(id: string) {
    return new RcItemCardPo(`[data-testid="item-card-${ id }"]`);
  }

  static getCardByTitle(title: string) {
    return new RcItemCardPo(cy.get('[data-testid="item-card-header-title"]').contains(title).parents('[data-testid*="item-card-"]'));
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
