import ComponentPo from '@/cypress/e2e/po/components/component.po';
import VersionNumberPo from '~/cypress/e2e/po/components/version-number.po';

export default class ProductNavPo extends ComponentPo {
  constructor() {
    super('.side-nav');
  }

  /**
   * Get all navigation accordion groups
   * @returns {Cypress.Chainable}
   */
  groups(): Cypress.Chainable {
    return this.self().find('.accordion.has-children');
  }

  /**
   * Get all the expanded accordion groups
   * @returns
   */
  expandedGroup(): Cypress.Chainable {
    return this.self().find('.accordion.expanded');
  }

  /**
   * Get all the visible child links
   */
  visibleNavTypes(): Cypress.Chainable {
    return this.self().find('.accordion.expanded li.nav-type>a');
  }

  /**
   * Navigate to a side menu group by label
   */
  navToSideMenuGroupByLabel(label: string): Cypress.Chainable {
    return this.self().should('exist').contains('.accordion.has-children', label).click();
  }

  /**
   * Navigate to a side menu entry by label
   */
  navToSideMenuEntryByLabel(label: string): Cypress.Chainable {
    return this.self().should('exist').find('.child.nav-type a .label').contains(label)
      .click({ force: true });
  }

  /**
   * Check existence of menu group by label
   */
  navToSideMenuGroupByLabelExistence(label: string, assertion: string): Cypress.Chainable {
    return this.self().should('exist').contains('.accordion.has-children', label).should(assertion);
  }

  /**
   * Get tab headers
   */
  tabHeaders(): Cypress.Chainable {
    return this.self().find('.header');
  }

  /**
   * Get version number
   */
  version() {
    return new VersionNumberPo('.side-menu .version');
  }
}
