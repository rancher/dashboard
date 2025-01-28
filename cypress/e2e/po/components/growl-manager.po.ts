import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class GrowlManagerPo extends ComponentPo {
  constructor() {
    super('.growl-container');
  }

  growlList() {
    return this.self().find('.growl-list');
  }

  growlMessage() {
    return this.self().find('.growl-message');
  }

  dismissWarning() {
    return this.self().find('.icon-close').click();
  }

  dismissAllWarnings() {
    return this.self().find('button.btn').contains('Clear All Notifications').click();
  }
}
