import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenu from '@/cypress/e2e/po/components/action-menu.po';

export default class RcItemCardPo extends ComponentPo {
  static getCardById(id: string) {
    return new RcItemCardPo(`[data-testid="item-card-${ id }"]`);
  }

  static getCardByTitle(title: string, options?: Partial<Cypress.Timeoutable>) {
    // Pass `options` to `.contains` as well as `cy.get`. A timeout given only to
    // `cy.get` bounds finding *any* card title, but the chained `.contains(title)`
    // then retries at the default command timeout - so a card that renders slowly
    // (e.g. while a chart repo is still fetching under CI load) times out early even
    // when the caller asked for a longer wait.
    const cardElement = () => cy.get('[data-testid="item-card-header-title"]', options)
      .contains(title, options)
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
