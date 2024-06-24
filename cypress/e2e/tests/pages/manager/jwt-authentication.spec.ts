
import JWTAuthenticationPagePo from '@/cypress/e2e/po/pages/cluster-manager/jwt-authentication.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

describe('JWT Authentication', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const jwtAuthenticationPage = new JWTAuthenticationPagePo();

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
      cy.createAmazonRke2Cluster({
        machineConfig: {
          instanceType: 't3a.medium',
          region,
          vpcId:        'vpc-081cec85dbe35e9bd',
          zone:         'a',
          type:         'rke-machine-config.cattle.io.amazonec2config',
          clusterName:  name,
          namespace
        },
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
      cy.createAmazonRke2Cluster({
        machineConfig: {
          instanceType: 't3a.medium',
          region,
          vpcId:        'vpc-081cec85dbe35e9bd',
          zone:         'a',
          type:         'rke-machine-config.cattle.io.amazonec2config',
          clusterName:  name,
          namespace
        },
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
  beforeEach(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('should show the JWT Authentication list page', () => {
    JWTAuthenticationPagePo.navTo();
    jwtAuthenticationPage.waitForPage();
    jwtAuthenticationPage.title().should('be.visible');
    jwtAuthenticationPage.list().resourceTable().sortableTable().checkVisible();
    jwtAuthenticationPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    jwtAuthenticationPage.list().state(instance0).should('contain', 'Disabled');
    jwtAuthenticationPage.list().state(instance1).should('contain', 'Disabled');
  });
  it('should be able to enable JWT Authentication for a cluster', () => {
    jwtAuthenticationPage.goTo();
    cy.intercept('POST', `/v1/management.cattle.io.clusterproxyconfigs`).as('enableJWT');
    jwtAuthenticationPage.list().clickRowActionMenuItem(instance0, 'Enable');

    cy.wait('@enableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.enabled).to.equal(true);
    });

    jwtAuthenticationPage.list().state(instance0).should('contain', 'Enabled');
    jwtAuthenticationPage.list().state(instance1).should('contain', 'Disabled');
  });
  it('should be able to disable JWT Authentication for a cluster', () => {
    jwtAuthenticationPage.goTo();

    cy.intercept('DELETE', `/v1/management.cattle.io.clusterproxyconfigs/**`).as('disableJWT');
    jwtAuthenticationPage.list().clickRowActionMenuItem(instance0, 'Disable');

    cy.wait('@disableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(204);
    });

    jwtAuthenticationPage.list().state(instance0).should('contain', 'Disabled');
    jwtAuthenticationPage.list().state(instance1).should('contain', 'Disabled');
  });
  it('should be able to enable JWT Authentication in bulk', () => {
    jwtAuthenticationPage.goTo();
    cy.intercept('POST', `/v1/management.cattle.io.clusterproxyconfigs`).as('enableJWT');

    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance0)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance1)
      .set();
    jwtAuthenticationPage.list().activate();

    cy.wait('@enableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.enabled).to.equal(true);
    });
    jwtAuthenticationPage.list().state(instance0).should('contain', 'Enabled');
    jwtAuthenticationPage.list().state(instance1).should('contain', 'Enabled');
  });

  it('should be able to disable JWT Authentication in bulk', () => {
    jwtAuthenticationPage.goTo();
    cy.intercept('DELETE', `/v1/management.cattle.io.clusterproxyconfigs/**`).as('disableJWT');

    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance0)
      .set();
    jwtAuthenticationPage.list().resourceTable().sortableTable().rowSelectCtlWithName(instance1)
      .set();
    jwtAuthenticationPage.list().deactivate();

    cy.wait('@disableJWT', { requestTimeout: 10000 }).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(204);
    });

    jwtAuthenticationPage.list().state(instance0).should('contain', 'Disabled');
    jwtAuthenticationPage.list().state(instance1).should('contain', 'Disabled');
  });

  after('clean up', () => {
    if (removeCluster0) {
      //  delete cluster
      cy.get<string>('@rke2Ec2ClusterName0').then((name) => {
        cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, name);
        removeCluster0 = false;
      });
    }
    if (removeCluster1) {
      //  delete cluster
      cy.get<string>('@rke2Ec2ClusterName1').then((name) => {
        cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, name);
        removeCluster1 = false;
      });
    }
  });
});
