import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class DropdownMenuPo extends ComponentPo {
  /**
   * Open dropdown menu
   * @returns {CypressChainable}
   */
  public open(): CypressChainable {
    return this.self().should('be.visible').click();
  }

  /**
   * Gets the dropdown menu container
   * @returns {CypressChainable}
   */
  public getContainer(): CypressChainable {
    return cy.get('body').find('[dropdown-menu-collection]');
  }

  /**
   * Gets dropdown menu items from within the container
   * @returns {CypressChainable}
   */
  public getItems(): CypressChainable {
    return this.open().then(() => {
      this.getContainer().find('[dropdown-menu-item]');
    });
  }
}
