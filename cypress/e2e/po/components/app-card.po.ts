import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class AppCardPo extends ComponentPo {
  constructor(selector = '[data-testid="app-card"]') {
    super(selector);
  }

  select(name: string) {
    return this.self().find('[data-testid="app-card-title"]').contains(name).click();
  }
}
