import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class AppCardPo extends ComponentPo {
  constructor(selector = '[data-testid="app-card"]') {
    super(selector);
  }

  getAppByName(name: string) {
    return this.self().find('[data-testid="app-card-title"]').contains(name);
  }

  select(name: string) {
    return this.getAppByName(name).click();
  }
}
