import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class GrowlManagerPo extends ComponentPo {
  constructor() {
    super('.growl-container');
  }

  growlList() {
    return this.self().find('.growl-list');
  }

  growlMessage() {
    return this.growlList().find('[data-testid^="growl-list-item-"]');
  }

  dismissWarning() {
    return this.growlMessage().first().find('.icon-close').click();
  }
}
