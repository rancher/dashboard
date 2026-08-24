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
      generateFakeClusterDataAndIntercepts({
        fakeProvClusterId, fakeMgmtClusterId, longClusterDescription
      });

      HomePagePo.goTo();
    });

    it('Pressing keyboard combo should display appropriate icon on cluster menu icon box', { tags: ['@navigation', '@adminUser'] }, () => {
      const sideNav = new ProductNavPo();
      const pagePoFake = new PagePo('');

      // Visit the downstream cluster (so it lands in RECENT and stays visible in the shelf), then return
      // to local. The alt-combo only lights up when there is a ready cluster to jump to that isn't the
      // current one — `local` is excluded from that set, so we sit on local with the downstream as the
      // jump target. SURE-8192.
      pagePoFake.navToClusterMenuEntry(fakeProvClusterId);
      pagePoFake.navToClusterMenuEntry('local');
      sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');

      BurgerMenuPo.burgerMenuGetNavClusterByLabel('local').should('exist');
      BurgerMenuPo.burgerMenuGetNavClusterByLabel(fakeProvClusterId).should('exist');

      // press key combo
      cy.get('body').focus().type('{alt}', { release: false });

      // assert that the key-combo (jump) icon is displayed on both the local slot and the downstream row
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheckByLabel('local');
      BurgerMenuPo.burgerMenuNavClusterKeyComboIconCheckByLabel(fakeProvClusterId);
    });

    it('Local cluster shows a "Management cluster" subtitle in the expanded shelf and a tooltip when collapsed', { tags: ['@navigation', '@adminUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      // Expanded: the local slot shows the cluster name + a fixed "Management cluster" subtitle. The
      // redesign no longer inlines the cluster's own description here (SURE-8192).
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkOpen();
      burgerMenuPo.getClusterDescription('local').should('include', 'Management cluster');

      // Collapsed: hovering the local icon reveals a tooltip with the cluster name.
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkClosed();
      burgerMenuPo.firstClusterIcon().realHover();
      burgerMenuPo.getClusterDescriptionTooltipContent().should('include.text', 'local').and('be.visible');
    });

    it('Pinned and unpinned cluster', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      BurgerMenuPo.toggle();
      BurgerMenuPo.checkOpen();

      // Reveal the ALL CLUSTERS directory (the whole estate lives behind the search "door"). Using the
      // intercepted downstream cluster keeps this deterministic regardless of the environment's real
      // topology, and `local` is no longer pinnable (it has its own fixed slot). SURE-8192.
      burgerMenuPo.openClusterSearch();
      burgerMenuPo.clusterListRowByLabel(fakeProvClusterId).find('.pin').should('have.attr', 'aria-pressed', 'false');

      // Pin it — the row reflects the pinned state immediately.
      burgerMenuPo.pinClusterByLabel(fakeProvClusterId);
      burgerMenuPo.clusterListRowByLabel(fakeProvClusterId).find('.pin').should('have.attr', 'aria-pressed', 'true');

      // Unpin it — back to the unpinned state.
      burgerMenuPo.clusterListRowByLabel(fakeProvClusterId).find('.pin').click();
      burgerMenuPo.clusterListRowByLabel(fakeProvClusterId).find('.pin').should('have.attr', 'aria-pressed', 'false');
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

    it('Can display the local cluster and open the cluster directory', { tags: ['@navigation', '@adminUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      // local is always shown in its fixed slot...
      burgerMenuPo.getClusterIcon('local').should('exist');

      // ...and the full estate opens behind the search "door" (SURE-8192).
      burgerMenuPo.openClusterSearch();
      burgerMenuPo.self().find('.clustersList').should('exist');
    });

    it('Can display at least one menu category label', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      burgerMenuPo.categories().should('have.length', 1);
    });

    it('Should show tooltip on mouse-hover when the menu is collapsed', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      const burgerMenuPo = new BurgerMenuPo();

      // Collapse the menu
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkClosed();

      // Hover over the first cluster icon and check that the tooltip is shown with the correct content
      burgerMenuPo.firstClusterIcon().realHover();
      BurgerMenuPo.checkIconTooltipOn('local');

      // Open the menu
      BurgerMenuPo.toggle();
      BurgerMenuPo.checkOpen();

      burgerMenuPo.firstClusterIcon().realHover();
      BurgerMenuPo.checkIconTooltipOff();
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
