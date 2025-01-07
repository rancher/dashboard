import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';

const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Needs intercepts BEFORE route navigation', () => {
    beforeEach(() => {
      generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId);

      HomePagePo.goTo();
    });

    it('Pressing keyboard combo should display appropriate icon on cluster menu icon box', { tags: ['@navigation', '@adminUser'] }, () => {
      const sideNav = new ProductNavPo();
      const pagePoFake = new PagePo('');

      // nav to project/namespaces in the fake cluster
      pagePoFake.navToClusterMenuEntry(fakeProvClusterId);
      sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');

      BurgerMenuPo.burgerMenuGetNavClusterbyLabel('local').should('exist');
      BurgerMenuPo.burgerMenuGetNavClusterbyLabel(fakeProvClusterId).should('exist');

      // press key combo
      cy.get('body').focus().type('{alt}', { release: false });

      // assert that icons are displayed for the key combo
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheck(0);
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheck(1);

      // nav to local
      pagePoFake.navToClusterMenuEntry('local');

      // assert that we are on the expected page
      cy.url().should('include', '/local');
      cy.url().should('include', '/projectsnamespaces');
    });

    it('Local cluster should show a name and description on the side menu and display a tooltip when hovering it show the full name and description', { tags: ['@navigation', '@adminUser'] }, () => {
      BurgerMenuPo.toggle();

      const burgerMenuPo = new BurgerMenuPo();

      // we cannot assert text truncation because it always adds to the HTML the full content
      // truncation (text-overflow: ellipsis) is just a CSS gimick thing that adds the ... visually
      burgerMenuPo.getClusterDescription().should('include', longClusterDescription);
      burgerMenuPo.showClusterDescriptionTooltip();
      burgerMenuPo.getClusterDescriptionTooltipContent().should('include.text', 'local').and('be.visible');
      burgerMenuPo.getClusterDescriptionTooltipContent().should('include.text', longClusterDescription).and('be.visible');
    });
  });

  describe('No intercepts needed before route navigation', () => {
    beforeEach(() => {
      HomePagePo.goTo();
      BurgerMenuPo.toggle();
    });

    it('Opens and closes on menu icon click', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      BurgerMenuPo.checkOpen();
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkClosed();
    });

    it('Can display list of available clusters', { tags: ['@navigation', '@adminUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.clusterNotPinnedList().should('exist');
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

      burgerMenuPo.allClusters().first().trigger('mouseover');
      BurgerMenuPo.checkIconTooltipOff();
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkIconTooltipOn();
    });

    // TODO: #5966: Verify cause of race condition issue making navigation link not trigger
    // it.skip('Contains valid links', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
    //   const burgerMenuPo = new BurgerMenuPo();
    //   // Navigate through all the links

    //   burgerMenuPo.links().each((_, idx) => {
    //   // Cant bind to looped element due DOM changes while opening/closing side bar
    //     burgerMenuPo.links().eq(idx).should('be.visible').click({ force: true })
    //       .then((linkEl) => {
    //         cy.location('href').should('exist');
    //       });
    //   });
    // });

    it('Check first item in global section is Cluster Management', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      HomePagePo.goTo();
      BurgerMenuPo.categoryByLabel('Global Apps').parent().parent().get('.option-link')
        .first()
        .should('contain.text', 'Cluster Management');
    });
  });
});
