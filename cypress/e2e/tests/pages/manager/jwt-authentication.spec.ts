
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import JWTAuthenticationPagePo from '@/cypress/e2e/po/pages/cluster-manager/jwt-authentication.po';

const jwtAuthenticationPage = new JWTAuthenticationPagePo();

// Go the JWT Authentication page and ensure the page is fully loaded
function goToJWTAuthenticationPageAndSettle() {
  cy.intercept('GET', '/v1/management.cattle.io.clusterproxyconfigs*').as('fetchJWTAuthentication');
  jwtAuthenticationPage.goTo();
  jwtAuthenticationPage.waitForPage();
  cy.wait('@fetchJWTAuthentication');

  // Wait for the jwt table to load and filter so there are no rows
  jwtAuthenticationPage.list().resourceTable().sortableTable().filter('random text', 200);
  jwtAuthenticationPage.list().resourceTable().sortableTable().rowElements()
    .should((el) => expect(el).to.contain.text('There are no rows which match your search query.'));
  jwtAuthenticationPage.list().resourceTable().sortableTable().resetFilter();
}

describe('JWT Authentication', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  let instance0 = '';
  let instance1 = '';
  let removeCluster0 = false;
  let removeCluster1 = false;
  const region = 'us-west-1';
  const namespace = 'fleet-default';

  before(() => {
    cy.login();
    cy.createE2EResourceName('rke2cluster0').as('rke2Ec2ClusterName0');
    cy.createE2EResourceName('rke2cluster1').as('rke2Ec2ClusterName1');

    cy.get<string>('@rke2Ec2ClusterName0').then((name) => {
      instance0 = name;
      // create real cluster
      cy.createAmazonRke2ClusterWithoutMachineConfig({
        cloudCredentialsAmazon: {
          workspace: namespace,
          name,
          region,
          accessKey: Cypress.env('awsAccessKey'),
          secretKey: Cypress.env('awsSecretKey')
        },
        rke2ClusterAmazon: {
          clusterName: name,
          namespace,
        }
      }).then(() => {
        removeCluster0 = true;
      });
    });
    cy.get<string>('@rke2Ec2ClusterName1').then((name) => {
      instance1 = name;
      // create real cluster
      cy.createAmazonRke2ClusterWithoutMachineConfig({
        cloudCredentialsAmazon: {
          workspace: namespace,
          name,
          region,
          accessKey: Cypress.env('awsAccessKey'),
          secretKey: Cypress.env('awsSecretKey')
        },
        rke2ClusterAmazon: {
          clusterName: name,
          namespace,
        }
      }).then(() => {
        removeCluster1 = true;
      });
    });
  });

  it('should show the JWT Authentication list page', () => {
    goToJWTAuthenticationPageAndSettle();
    jwtAuthenticationPage.list().masthead().title().should('contain', 'JWT Authentication');
    jwtAuthenticationPage.list().resourceTable().sortableTable().checkVisible();
    jwtAuthenticationPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance0, 1).should('contain', 'Disabled');
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance1, 1).should('contain', 'Disabled');
  });

  it('should be able to enable JWT Authentication for a cluster', () => {
    goToJWTAuthenticationPageAndSettle();
    cy.intercept('POST', `/v1/management.cattle.io.clusterproxyconfigs`).as('enableJWT');
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowActionMenuOpen(instance0)
      .getMenuItem('Enable')
      .click();

    cy.wait('@enableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.enabled).to.equal(true);
    });

    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance0, 1).should('contain', 'Enabled');
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance1, 1).should('contain', 'Disabled');
  });

  it('should be able to disable JWT Authentication for a cluster', () => {
    goToJWTAuthenticationPageAndSettle();

    cy.intercept('PUT', `/v1/management.cattle.io.clusterproxyconfigs/**`).as('disableJWT');
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowActionMenuOpen(instance0)
      .getMenuItem('Disable')
      .click();

    cy.wait('@disableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.enabled).to.equal(false);
    });

    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance0, 1).should('contain', 'Disabled');
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance1, 1).should('contain', 'Disabled');
  });

  it('should be able to enable JWT Authentication in bulk', () => {
    goToJWTAuthenticationPageAndSettle();
    cy.intercept('POST', `/v1/management.cattle.io.clusterproxyconfigs`).as('enableJWT');

    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance0)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance1)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().bulkActionButton('Enable')
      .click();

    cy.wait('@enableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.enabled).to.equal(true);
    });
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance0, 1).should('contain', 'Enabled');
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance1, 1).should('contain', 'Enabled');
  });

  it('should be able to disable JWT Authentication in bulk', () => {
    goToJWTAuthenticationPageAndSettle();
    cy.intercept('PUT', `/v1/management.cattle.io.clusterproxyconfigs/**`).as('disableJWT');

    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance0)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance1)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().bulkActionButton('Disable')
      .click();

    cy.wait('@disableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.enabled).to.equal(false);
    });

    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance0, 1).should('contain', 'Disabled');
    jwtAuthenticationPage.list().resourceTable().resourceTableDetails(instance1, 1).should('contain', 'Disabled');
  });

  after('clean up', () => {
    if (removeCluster0) {
      //  delete cluster
      cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, instance0);
    }

    if (removeCluster1) {
      //  delete cluster
      cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, instance1);
    }
  });
});

describe('JWT Authentication (Standard User)', { testIsolation: 'off', tags: ['@manager', '@standardUser', '@jenkins'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('should not have JWT Authentication side menu entry', () => {
    const homePage = new HomePagePo();
    const clusterManagerPage = new ClusterManagerListPagePo('_');

    homePage.manageButton().click();
    clusterManagerPage.waitForPage();

    // Check navigation does not exist
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.checkSideMenuEntryByLabel('JWT Authentication', 'not.exist');
  });
});
