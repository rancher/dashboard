import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-decription';

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    // since I wasn't able to fully mock a list of clusters
    // the next best thing is to add a description to the current local cluster
    // testing https://github.com/rancher/dashboard/issues/10441
    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`, (req) => {
      req.continue((res) => {
        const localIndex = res.body.data.findIndex((item) => item.id.includes('/local'));

        if (localIndex >= 0) {
          res.body.data[localIndex].metadata.annotations['field.cattle.io/description'] = longClusterDescription;
        }

        res.send(res.body);
      });
    }).as('provClusters');

    cy.login();

    HomePagePo.goTo();
    BurgerMenuPo.toggle();
  });
  it('Opens and closes on menu icon click', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    BurgerMenuPo.checkOpen();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkClosed();
  });

  it('Local cluster should show a description on the side menu and display a tooltip when hovering it show the full description', { tags: ['@navigation', '@adminUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    // we cannot assert text truncation because it always adds to the HTML the full content
    // truncation (text-overflow: ellipsis) is just a CSS gimick thing that adds the ... visually
    burgerMenuPo.getClusterDescription().should('include', longClusterDescription);
    burgerMenuPo.showClusterDescriptionTooltip();
    burgerMenuPo.getClusterDescriptionTooltipContent().contains(longClusterDescription);
  });

  it('Can display list of available clusters', { tags: ['@navigation', '@adminUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().should('exist');
  });

  it('Pinned and unpinned cluster', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.pinFirstCluster();
    burgerMenuPo.clusterPinnedList().should('exist');
    burgerMenuPo.unpinFirstCluster();
    burgerMenuPo.clusterPinnedList().should('not.exist');
  });

  it('Can display at least one menu category label', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.categories().should('have.length', 1);
  });

  it('Should show tooltip on mouse-hover when the menu is collapsed', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.clusters().first().trigger('mouseover');
    BurgerMenuPo.checkIconTooltipOff();
    BurgerMenuPo.toggle();
    BurgerMenuPo.checkIconTooltipOn();
  });

  // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
  it.skip('Contains valid links', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    const burgerMenuPo = new BurgerMenuPo();
    // Navigate through all the links

    burgerMenuPo.links().each((_, idx) => {
      // Cant bind to looped element due DOM changes while opening/closing side bar
      burgerMenuPo.links().eq(idx).should('be.visible').click({ force: true })
        .then((linkEl) => {
          cy.location('href').should('exist');
        });
    });
  });
});
