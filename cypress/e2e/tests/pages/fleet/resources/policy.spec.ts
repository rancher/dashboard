import { FleetPolicyListPagePo, FleetPolicyCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.policy.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Fleet Policy', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const fleetPolicyListPage = new FleetPolicyListPagePo();
  const fleetDashboardPage = new FleetDashboardListPagePo('_');

  before(() => {
    cy.login();
  });

  it('should be listed as a resource in the Fleet product navigation', () => {
    FleetDashboardListPagePo.goTo('_');
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');

    FleetPolicyListPagePo.navEntry().should('exist').and('be.visible');
  });

  it('should navigate to the Fleet Policy list page from the nav', () => {
    FleetPolicyListPagePo.navTo();

    fleetPolicyListPage.waitForPage();
    // Assert the list actually rendered: the resource-not-found page also has a (non-empty) masthead.
    fleetPolicyListPage.baseResourceList().masthead().title()
      .should('contain', 'Policies');
    fleetPolicyListPage.list().resourceTable().checkExists();
  });

  describe('create form', { tags: ['@fleet', '@adminUser'] }, () => {
    const headerPo = new HeaderPo();
    const workspace = 'fleet-default';
    const serviceAccounts = ['tenant-1-deployer', 'tenant-2-deployer'];
    const clientSecret = 'tenant-1-git-credentials';
    let policyName = '';
    let policyCreated = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-policy').then((name) => {
        policyName = name;
      });
    });

    it('should create a policy from the form', () => {
      const createPage = new FleetPolicyCreateEditPo();

      cy.intercept('POST', '/v1/fleet.cattle.io.policies').as('createPolicy');

      fleetPolicyListPage.goTo();
      fleetPolicyListPage.waitForPage();
      headerPo.selectWorkspace(workspace);
      fleetPolicyListPage.baseResourceList().masthead().create();
      createPage.waitForPage();

      createPage.nameNsDescription().name().set(policyName);
      createPage.requireServiceAccount().check();

      createPage.restrictServiceAccounts().set(1);
      serviceAccounts.forEach((name) => createPage.enterName(createPage.allowedServiceAccounts(), name));

      createPage.enterName(createPage.defaultServiceAccount('git-repo'), serviceAccounts[0]);
      createPage.restrictSecrets('git-repo').set(1);
      createPage.enterName(createPage.allowedSecrets('git-repo'), clientSecret);

      createPage.cruResource().saveOrCreate().click();

      cy.wait('@createPolicy').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        policyCreated = true;

        const body = response?.body;

        expect(body.requireServiceAccount).to.eq(true);
        expect(body.allowedServiceAccounts).to.deep.eq(serviceAccounts);
        expect(body.gitRepo.defaultServiceAccount).to.eq(serviceAccounts[0]);
        expect(body.gitRepo.allowedClientSecretNames).to.deep.eq([clientSecret]);
        // HelmOps was left untouched, so it is not saved as an empty object
        expect(body.helmOp).to.eq(undefined);
      });

      fleetPolicyListPage.waitForPage();
      fleetPolicyListPage.list().rowWithName(policyName).checkVisible();
    });

    it('should show what was saved when the policy is edited again', () => {
      const editPage = new FleetPolicyCreateEditPo(workspace, policyName);

      editPage.goTo('mode=edit');
      editPage.waitForPage('mode=edit');

      editPage.requireServiceAccount().isChecked();
      editPage.restrictServiceAccounts().isChecked(1);
      serviceAccounts.forEach((name) => editPage.allowedServiceAccounts().checkContainsOptionSelected(name));

      editPage.defaultServiceAccount('git-repo').checkOptionSelected(serviceAccounts[0]);
      editPage.restrictSecrets('git-repo').isChecked(1);
      editPage.allowedSecrets('git-repo').checkContainsOptionSelected(clientSecret);

      // HelmOps was never filled in, so it comes back allowing everything
      editPage.restrictSecrets('helm-op').isChecked(0);
    });

    after('clean up', () => {
      if (policyCreated) {
        cy.deleteRancherResource('v1', `fleet.cattle.io.policies/${ workspace }`, policyName, false);
      }
    });
  });
});
