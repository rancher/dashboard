import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class GrowlManagerPo extends ComponentPo {
  constructor() {
    super('[data-testid^="growl-list-item-"]');
  }

  growlList() {
    return this.self().find('.growl-list');
  }

  growlMessage() {
    return this.self();
  }

  dismissWarning() {
    return this.self().find('.icon-close').click();
  }

  dismissAllWarnings() {
    return this.self().find('button.btn').contains('Clear All Notifications').click();
  }
}
