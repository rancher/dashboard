import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

type ParentFn = () => CypressChainable;

const TITLE_SELECTOR = '> .section-header .title';

/**
 * RcSection (pkg/rancher-components/src/components/RcSection)
 */
export default class RcSectionPo extends ComponentPo {
  /**
   * Find a section by its exact title. Matching the whole title avoids e.g. 'Labels' matching 'Labels & Annotations'
   */
  static byTitle(parent: ParentFn, title: string): RcSectionPo {
    return new RcSectionPo(() => parent()
      .find('.rc-section')
      .filter((_, el) => Cypress.$(el).find(TITLE_SELECTOR).first().text()
        .trim() === title)
    );
  }

  /**
   * The titles of the sections that are not nested inside another section, in page order
   */
  static topLevelTitles(parent: ParentFn): Cypress.Chainable<string[]> {
    return parent()
      .find('.rc-section')
      .filter((_, el) => !el.parentElement?.closest('.rc-section'))
      .then(($sections) => Cypress._.map($sections, (el) => Cypress.$(el).find(TITLE_SELECTOR).first().text()
        .trim()));
  }

  header() {
    return this.self().find('> .section-header');
  }

  toggleButton() {
    return this.header().find('.toggle-button');
  }

  content() {
    return this.self().find('> .section-content');
  }

  toggle() {
    return this.toggleButton().click();
  }

  /**
   * Expand the section if it's collapsed
   */
  expand() {
    return this.toggleButton().then(($button) => {
      if ($button.attr('aria-expanded') !== 'true') {
        cy.wrap($button).click();
      }
    });
  }

  checkExpanded() {
    return this.toggleButton().should('have.attr', 'aria-expanded', 'true');
  }
}
