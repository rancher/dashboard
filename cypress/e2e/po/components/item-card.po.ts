import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ItemCardPo extends ComponentPo {
  constructor(selector = '[data-testid="item-card"]') {
    super(selector);
  }

  getAppByName(name: string) {
    return this.self().find('[data-testid="item-card-header-title"]').contains(name);
  }

  select(name: string) {
    return this.getAppByName(name).click();
  }
}
