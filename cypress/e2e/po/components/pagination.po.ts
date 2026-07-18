import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ProductNavPo from '~/cypress/e2e/po/side-bars/product-side-nav.po';

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
   * Retry-able assertion on the "x - y of z" pagination summary text.
   * The summary updates asynchronously after a page-navigation click (next/prev/first/last),
   * so reading it once through a non-retry-able `.then()` + `expect` races the re-render and
   * flakes. `.should()` with a callback retries the whole `find('span').invoke('text')` chain
   * until the trimmed text settles on the expected value.
   * @param expected The exact expected summary text (compared after trimming)
   */
  checkPaginationTextEquals(expected: string): Cypress.Chainable {
    return this.self().find('span').invoke('text').should((text) => {
      expect(text.trim()).to.eq(expected);
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
