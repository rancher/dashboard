import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ProductNavPo from '~/cypress/e2e/po/side-bars/product-side-nav.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export default class PaginationPo extends ComponentPo {
  constructor(selector = 'div.paging') {
    super(selector);
  }

  beginningButton() {
    return this.self().find('[data-testid="pagination-first"]');
  }

  leftButton() {
    return this.self().find('[data-testid="pagination-prev"]');
  }

  rightButton() {
    return this.self().find('[data-testid="pagination-next"]');
  }

  endButton() {
    return this.self().find('[data-testid="pagination-last"]');
  }

  paginationText() {
    return this.self().find('span').invoke('text');
  }

  /**
   * Retry the "x - y of z" pagination text until it equals the expected value. Re-queries via
   * `.should` so a transient/unsettled total settles before the assertion, instead of a one-shot
   * `.then(expect)` that catches the transient value and fails.
   */
  checkPaginationTextEquals(expectedText: string, timeoutOpt = MEDIUM_TIMEOUT_OPT) {
    return this.self().find('span', timeoutOpt).should(($span) => {
      expect($span.text().trim()).to.eq(expectedText);
    });
  }

  /**
   * Extract the total `z` from the "x - y of z Label" pagination text as a number.
   *
   * Reading the total from the pager itself couples the pagination-navigation assertions to the exact
   * source the UI renders (the server-side VAI list count), instead of a separate client-side API
   * snapshot. Those two counts disagree by one during the eventual-consistency window right after
   * resources are created - the persistent "24 vs 23" flake - because the collection index the pager
   * reads and a `data.filter` over a single GET settle at slightly different moments. Using the pager's
   * own total tests real pagination behaviour (page size, next/prev/last navigation, last-page math)
   * without a second, independently-racing count source.
   */
  paginationTotalCount(timeoutOpt = MEDIUM_TIMEOUT_OPT): Cypress.Chainable<number> {
    return this.self().find('span', timeoutOpt).invoke('text').then((text) => {
      const match = text.trim().match(/of\s+(\d+)/);

      return match ? parseInt(match[1], 10) : NaN;
    });
  }

  /**
   * Check the x of y pagination text against the side nav count
   */
  checkPaginationText(productNav: ProductNavPo, options: {
    sideNameLabel: string,
    expectedText: (count: number) => string
  }) {
    this.paginationText().then((el) => {
      productNav.sideMenuEntryByLabelCount(options.sideNameLabel).then((count) => {
        expect(el.trim()).to.eq(options.expectedText(count.trim()));
      });
    });
  }
}
