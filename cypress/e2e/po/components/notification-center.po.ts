import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { NotificationPo } from '@/cypress/e2e/po/components/notification.po';

export default class NotificationsCenterPo extends ComponentPo {
  constructor() {
    super('[data-testid="notifications-center-panel"]');
  }

  dropdownButton() {
    return cy.get('[data-testid="notifications-center"]');
  }

  /**
   * Open/close the notification center
   */
  toggle() {
    return this.dropdownButton().click().then(() => cy.wait(1000)); // eslint-disable-line cypress/no-unnecessary-waiting
  }

  /**
   * Check that the indicator shows there are no unread notifications
   */
  checkAllRead() {
    cy.get('[data-testid="notifications-center-status"]').should('exist');
    cy.get('[data-testid="notifications-center-statusunread"]').should('not.exist');
  }

  /**
   * Check that the indicator shows there are unread notifications
   */
  checkHasUnread() {
    cy.get('[data-testid="notifications-center-status"]').should('not.exist');
    cy.get('[data-testid="notifications-center-statusunread"]').should('exist');
  }

  checkOpen() {
    cy.get('[data-testid="notifications-center"][aria-expanded="true"]').should('exist');
  }

  checkClosed() {
    cy.get('[data-testid="notifications-center"][aria-expanded="false"]').should('exist');
  }

  /**
   * Get a notification by ID
   * @param id ID of the notification in the notification center
   * @returns Notification
   */
  getNotification(id: string) {
    const selector = `[data-testid="notifications-center-item-${ id }"]`;

    return new NotificationPo(selector);
  }

  /**
   * Get a notification by index
   * @param index Index of the notification in the notification center
   * @returns Notification
   */
  getNotificationByIndex(index: number) {
    const selector = `[data-testid="notifications-center-item"]`;

    return new NotificationPo(() => cy.get(selector).eq(index));
  }

  /**
   * Get a notification by selector name
   * @param selectorName Selector name of the notification in the notification center
   * @returns Notification
   */
  getNotificationByName(selectorName: string) {
    const selector = `[data-testid^="notifications-center-item-${ selectorName }"]`;

    return new NotificationPo(() => cy.get(selector));
  }

  markAllRead() {
    cy.get('[data-testid="notifications-center-markall-read"]').click({ force: true });
  }

  /**
   * Check the number of notifications
   */
  checkCount(count: number) {
    return this.self().find('[data-testid="notifications-center-item"]').should('have.length', count);
  }
}
