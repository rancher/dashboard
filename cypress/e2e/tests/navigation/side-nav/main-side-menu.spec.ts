import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';

const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-decription';
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

    // testing https://github.com/rancher/dashboard/issues/10192
    it('"documentation" link in editing a cluster should open in a new tab', { tags: ['@navigation', '@adminUser'] }, () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      const page = new PagePo('');
      const clusterList = new ClusterManagerListPagePo('_');

      page.navToMenuEntry('Cluster Management');
      clusterList.waitForPage();

      clusterList.list().actionMenu(fakeProvClusterId).getMenuItem('Edit Config').click();

      // since in Cypress we cannot assert directly a link on a new tab
      // next best thing is to assert that the link has _blank
      // change it to _seft, then assert the link of the new page
      cy.get('[data-testid="edit-cluster-reprovisioning-documentation"] a').should('be.visible')
        .then(($a) => {
          expect($a).to.have.attr('target', '_blank');
          // update attr to open in same tab
          $a.attr('target', '_self');
        })
        .click();

      cy.url().should('include', 'https://ranchermanager.docs.rancher.com/v2.9/how-to-guides/new-user-guides/launch-kubernetes-with-rancher/rke1-vs-rke2-differences#cluster-api');
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

    it('Check first item in global section is Cluster Management', { tags: ['@navigation', '@adminUser', '@standardUser'] }, () => {
      HomePagePo.goTo();
      BurgerMenuPo.categoryByLabel('Global Apps').parent().parent().get('.option-link')
        .first()
        .should('contain.text', 'Cluster Management');
    });
  });
});
