import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { generateFakeNavClusterData } from '@/cypress/e2e/blueprints/nav/fake-cluster';

const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-decription';
const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';
const fakeNavClusterData = generateFakeNavClusterData(fakeProvClusterId, fakeMgmtClusterId);

Cypress.config();
describe('Side Menu: main', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Needs intercepts BEFORE route navigation', () => {
    beforeEach(() => {
      // add description to local cluster for testing https://github.com/rancher/dashboard/issues/10441
      // add extra cluster to the nav list to test https://github.com/rancher/dashboard/issues/10452
      cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`, (req) => {
        req.continue((res) => {
          const localIndex = res.body.data.findIndex((item) => item.id.includes('/local'));

          if (localIndex >= 0) {
            const localCluster = res.body.data[localIndex];

            localCluster.metadata.annotations['field.cattle.io/description'] = longClusterDescription;
          }

          res.body.data.unshift(fakeNavClusterData.provClusterObj);

          res.send(res.body);
        });
      }).as('provClusters');

      // add extra cluster to the nav list to test https://github.com/rancher/dashboard/issues/10452
      cy.intercept('GET', `/v1/management.cattle.io.clusters?*`, (req) => {
        req.continue((res) => {
          res.body.data.unshift(fakeNavClusterData.mgmtClusterObj);
          res.send(res.body);
        });
      }).as('mgmtClusters');

      // intercept schemas check for enabling cluster explorer for fake cluster https://github.com/rancher/dashboard/issues/10452
      cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/schemas?*`, (req) => {
        req.reply({
          statusCode: 200,
          body:       {
            data: [
              fakeNavClusterData.fakeNodeSchema,
              fakeNavClusterData.fakeCountSchema,
              fakeNavClusterData.fakeNamespaceSchema
            ]
          },
        });
      }).as('clusterSchemas');

      // intercept counts for fake cluster https://github.com/rancher/dashboard/issues/10452
      cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/counts?*`, (req) => {
        req.reply({
          statusCode: 200,
          body:       { data: fakeNavClusterData.fakeCountsReply },
        });
      }).as('clusterCounts');

      // intercept namespaces for fake cluster https://github.com/rancher/dashboard/issues/10452
      cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/namespaces?*`, (req) => {
        req.reply({
          statusCode: 200,
          body:       { data: fakeNavClusterData.fakeNamespacesReply },
        });
      }).as('clusterNamespaces');

      HomePagePo.goTo();
    });

    it('Pressing keyboard combo should display appropriate icon on cluster menu icon box', { tags: ['@navigation', '@adminUser'] }, () => {
      const sideNav = new ProductNavPo();
      const pagePoFake = new PagePo('');

      // nav to project/namespaces in the fake cluster
      pagePoFake.navToClusterMenuEntry(fakeProvClusterId);
      sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');

      // press key combo
      cy.get('body').focus().type('{shift}{alt}', { release: false });

      // assert that icons are displayed for the key combo
      BurgerMenuPo.burguerMenuNavClusterKeyComboIconCheck(0);
      BurgerMenuPo.burguerMenuNavClusterKeyComboIconCheck(1);

      // nav to local
      pagePoFake.navToClusterMenuEntry('local');

      // assert that we are on the expected page
      cy.url().should('include', '/local');
      cy.url().should('include', '/projectsnamespaces');
    });

    it('Local cluster should show a description on the side menu and display a tooltip when hovering it show the full description', { tags: ['@navigation', '@adminUser'] }, () => {
      BurgerMenuPo.toggle();

      const burgerMenuPo = new BurgerMenuPo();

      // we cannot assert text truncation because it always adds to the HTML the full content
      // truncation (text-overflow: ellipsis) is just a CSS gimick thing that adds the ... visually
      burgerMenuPo.getClusterDescription().should('include', longClusterDescription);
      burgerMenuPo.showClusterDescriptionTooltip();
      burgerMenuPo.getClusterDescriptionTooltipContent().contains(longClusterDescription);
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
