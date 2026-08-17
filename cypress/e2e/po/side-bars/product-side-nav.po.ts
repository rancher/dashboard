import ComponentPo from '@/cypress/e2e/po/components/component.po';
import VersionNumberPo from '~/cypress/e2e/po/components/version-number.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

/**
 * This is the side menu
 */
export default class ProductNavPo extends ComponentPo {
  constructor() {
    super('.side-nav');
  }

  /**
   * Get all navigation accordion groups
   * @returns {Cypress.Chainable}
   */
  groups(): Cypress.Chainable {
    // Scope to top-level (depth-0) groups only. The app implements the
    // "one open group collapses its siblings" behaviour at the top level, so
    // matching nested subgroups here breaks collapse-on-click assertions.
    return this.self().find('.accordion.depth-0.has-children');
  }

  /**
   * Get all navigation accordion items
   * @returns {Cypress.Chainable}
   */
  accordionItems(): Cypress.Chainable {
    return this.self().find('.accordion');
  }

  /**
   * Get all the expanded accordion groups
   * @returns
   */
  expandedGroup(): Cypress.Chainable {
    // Scope to top-level (depth-0) expanded groups only, to match groups().
    return this.self().find('.accordion.depth-0.expanded');
  }

  /**
   * Get all the visible child links
   */
  visibleNavTypes(): Cypress.Chainable {
    return this.self().find('.accordion.expanded li.nav-type>a, .accordion:not(.has-children):not(.expanded) li.nav-type>a');
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
    // The main chain below doesn't pick up dynamic additions on its own, so first wait for the entry
    // to render. Give it a long window: a freshly-installed CRD's schema can take a while to propagate
    // into the product side-nav, so the entry can appear well after the resource exists. (Note the
    // timeout must go on `cy.contains`, not on `.should('exist')` where it is ignored.)
    cy.contains('.child.nav-type a .label', label, LONG_TIMEOUT_OPT).should('exist');

    return this.self().should('exist')
      .find('.child.nav-type a .label')
      .filter(`:contains("${ label }")`)
      .filter((index, element) => {
        // Only match exact text, not partial matches
        return element.textContent.trim() === label;
      });
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

  /**
   * Active navigation item
   */
  activeNavItem() {
    return this.accordionItems().find('.router-link-active').should('exist').invoke('text')
      .then((s) => s.trim());
  }
}
