import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

// Allow for sub-pixel rounding differences across browsers / DPI
const CENTER_TOLERANCE_PX = 1.5;

/**
 * Regression coverage for the group header label being vertically misaligned in the side menu.
 * The label (`h6`) should be vertically centered within its `.header` row. Jest/jsdom has no
 * layout engine, so this is asserted in a real browser via getBoundingClientRect midpoints.
 */
describe('Side navigation: group label alignment', { tags: ['@navigation', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.goToCluster('local');
  });

  it('vertically centers the group header label within its header row', () => {
    const productNavPo = new ProductNavPo();

    // Only headers that actually render a label (h6) are relevant
    productNavPo.tabHeaders()
      .filter(':visible')
      .find('h6')
      .should('have.length.gt', 0)
      .each(($h6) => {
        cy.wrap($h6).closest('.header').then(($header) => {
          const header = $header[0].getBoundingClientRect();
          const label = $h6[0].getBoundingClientRect();

          // Skip anything not laid out (e.g. collapsed / zero-height)
          if (header.height === 0 || label.height === 0) {
            return;
          }

          const headerMid = header.top + (header.height / 2);
          const labelMid = label.top + (label.height / 2);

          expect(
            Math.abs(headerMid - labelMid),
            'h6 label vertical midpoint should match header midpoint'
          ).to.be.lessThan(CENTER_TOLERANCE_PX);
        });
      });
  });
});
