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
   * Assert the "x - y of z <Resource>" pagination text, retrying until it matches.
   *
   * The list total can momentarily reflect an unsettled value - for example before
   * the namespace filter is fully applied, or while system-managed resources (such
   * as the per-namespace `kube-root-ca.crt` configmap) are still being created. A
   * one-shot `paginationText().then(expect)` can therefore read a transient count
   * and fail intermittently. Using `.should` retries the query and assertion until
   * the text stabilises on the expected value.
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
