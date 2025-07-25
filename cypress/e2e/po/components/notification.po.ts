import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class NotificationPo extends ComponentPo {
  toggleRead() {
    this.self().find('.read-indicator').click({ force: true });
  }

  checkRead() {
    this.self().find('div.read-icon.unread').should('not.exist');
  }

  checkUnread() {
    this.self().find('div.read-icon.unread').should('exist');
  }

  title() {
    return this.self().find('.item-title');
  }

  primaryActionButton() {
    return this.self().find('.role-primary');
  }

  secondaryActionButton() {
    return this.self().find('.role-secondary');
  }
}
