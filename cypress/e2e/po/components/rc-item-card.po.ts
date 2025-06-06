import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class RcItemCardPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  getCardById(id: string) {
    return this.self().get(`[data-testid="item-card-${ id }"]`);
  }

  getCardByTitle(title: string) {
    return this.self().find('[data-testid="item-card-header-title"]').contains(title);
  }

  getImageByTitle(title: string) {
    return this.getCardByTitle(title).get('[data-testid="item-card-image"] img');
  }

  clickByTitle(name: string) {
    return this.getCardByTitle(name).click();
  }
}
