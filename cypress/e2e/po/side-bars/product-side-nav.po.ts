import ComponentPo from '@/cypress/e2e/po/components/component.po';
import VersionNumberPo from '~/cypress/e2e/po/components/version-number.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
    return cy.get('.side-nav', LONG_TIMEOUT_OPT).should('exist').contains('.accordion.has-children', label, LONG_TIMEOUT_OPT).click();
  }

  sideMenuEntryByLabelCount(label: string): Cypress.Chainable {
    return this.sideMenuEntryByLabel(label).parent().find('.count').should('exist')
      .invoke('text');
  }

  sideMenuEntryByLabel(label: string): Cypress.Chainable {
    return this.self().should('exist', LONG_TIMEOUT_OPT).find('.child.nav-type a .label').contains(label);
  }

  /**
   * Navigate to a side menu entry by label
   */
  navToSideMenuEntryByLabel(label: string): Cypress.Chainable {
    return this.sideMenuEntryByLabel(label).click({ force: true });
  }

  /**
   * Check existence of menu side entry
   */
  checkSideMenuEntryByLabel(label: string, assertion: string): Cypress.Chainable {
    return this.self().should('exist').find('.child.nav-type a .label').contains(label)
      .should(assertion);
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
