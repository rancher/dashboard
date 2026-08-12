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
