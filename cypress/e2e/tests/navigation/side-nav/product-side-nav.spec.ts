import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import WorkloadPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

const { name: workloadName, namespace } = createDeploymentBlueprint.metadata;
const deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');

Cypress.config();
describe('Side navigation: Cluster ', { tags: ['@navigation', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.intercept('GET', `/v1/apps.deployments/${ namespace }/${ workloadName }`).as('testWorkload');

    deploymentsListPage.goTo();
    deploymentsListPage.createWithKubectl(createDeploymentBlueprint);
  });
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.goToCluster('local');
  });

  it('Can access to first navigation link on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.visibleNavTypes().eq(0).should('be.visible').click()
      .then((link) => {
        cy.url().should('equal', link.prop('href'));
      });
  });

  it('Can open second menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').should('be.visible').click();
    cy.get('@closedGroup').find('ul').should('have.length.gt', 0);
    productNavPo.groups().get('expanded').should('not.be.instanceOf', Array);
  });

  it('Can close first menu groups on click', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().get('.expanded').as('openGroup');
    productNavPo.groups().not('.expanded').eq(0).should('be.visible')
      .click();
    cy.get('@openGroup').find('ul').should('have.length', 0);
  });

  it('Should flag second menu group as active on navigation', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().not('.expanded').eq(0)
      .as('closedGroup');
    cy.get('@closedGroup').should('be.visible').click();
    cy.get('@closedGroup').find('.router-link-active').should('have.length.gt', 0);
  });

  it('Going into resource detail should keep relevant group active', () => {
    const productNavPo = new ProductNavPo();

    productNavPo.groups().get('.expanded').as('openGroup');

    productNavPo.visibleNavTypes().eq(1).should('be.visible').click(); // Go into Workloads
    const workload = new WorkloadPagePo('local');

    workload.goTo();
    workload.waitForPage();
    workload.goToDetailsPage(workloadName);
    cy.get('@openGroup').should('be.visible');
    cy.get('@openGroup').find('.router-link-active').should('have.length.gt', 0);
  });

  it('Should access to every navigation provided from the server link, including nested cases, without errors', () => {
    const productNavPo = new ProductNavPo();
    // iterate through top-level groups

    productNavPo.groups().each((_, index) => {
      const group = productNavPo.groups().eq(index);

      // Select and expand current top-level group
      group.click();
      // check if it has sub-groups and expand them
      productNavPo.groups().eq(index).then((group) => {
        // FIXME: #5966: This may lead to flaky tests and should be replace after ensuring the navigation to be stable
        if (group.find('.accordion').length) {
          cy.wrap(group).get('.accordion .accordion').should('be.visible').click({ multiple: true });
        }
        // ensure group is expanded
        cy.wrap(group).find('ul').should('have.length.gt', 0);
      });

      // Visit each link and confirm the app has navigated to that location
      productNavPo.visibleNavTypes().each((link, idx) => {
        productNavPo.visibleNavTypes().eq(idx)
          .click({ force: true })
          .then((linkEl) => cy.url().should('contain', linkEl.prop('href')));
      });
    });
  });

  it('Clicking on the tab header should navigate', () => {
    const productNavPo = new ProductNavPo();
    const group = productNavPo.groups().eq(1); // First group is 'Workloads'

    // Select and expand current top-level group
    group.click();
    const workloads = new WorkloadPagePo();

    workloads.waitForPage();

    cy.url().then((workloadsUrl) => {
      // Go to the second subgroup
      productNavPo.visibleNavTypes().eq(1).click({ force: true });
      // Clicking back should take us back to workloads
      productNavPo.tabHeaders().eq(1).click(1, 1).then(() => cy.url().should('equal', workloadsUrl));
    });
  });

  after(() => {
    cy.login();
    deploymentsListPage?.goTo();

    deploymentsListPage.deleteWithKubectl(workloadName, namespace);
  });
});
