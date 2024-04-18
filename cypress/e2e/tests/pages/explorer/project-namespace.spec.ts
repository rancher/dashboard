import ProjectsNamespacesPagePo from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';

describe('Projects/Namespaces', { tags: ['@explorer', '@adminUser'] }, () => {
  const projectsNamespacesPage = new ProjectsNamespacesPagePo('local');

  beforeEach(() => {
    cy.login();

    projectsNamespacesPage.goTo();
  });

  it('flat list view should have create Namespace button', () => {
    projectsNamespacesPage.flatListClick();
    projectsNamespacesPage.createProjectNamespaceButton().should('exist');
  });

  it('create namespace screen should have a projects dropdown', () => {
    projectsNamespacesPage.createProjectNamespaceClick();
    projectsNamespacesPage.nsProject().checkExists();
  });

  describe('Create Project Error Banner', () => {
    beforeEach(() => {
      projectsNamespacesPage.goTo();
    });

    it('displays an error message when submitting a form with errors', () => {
      projectsNamespacesPage.createProjectButtonClick();

      projectsNamespacesPage.name().set('test-1234');
      projectsNamespacesPage.tabResourceQuotas().click();
      projectsNamespacesPage.btnAddResource().click();
      projectsNamespacesPage.inputProjectLimit().set('50');
      projectsNamespacesPage.buttonSubmit().click();

      projectsNamespacesPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      projectsNamespacesPage.bannerError(0).should('have.length', 1);
    });

    it('displays a single error message on repeat submissions of a form with errors', () => {
      projectsNamespacesPage.createProjectButtonClick();

      projectsNamespacesPage.name().set('test-1234');
      projectsNamespacesPage.tabResourceQuotas().click();
      projectsNamespacesPage.btnAddResource().click();
      projectsNamespacesPage.inputProjectLimit().set('50');
      projectsNamespacesPage.buttonSubmit().click();

      projectsNamespacesPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      projectsNamespacesPage.bannerError(0).should('have.length', 1);

      projectsNamespacesPage.buttonSubmit().click();

      projectsNamespacesPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      projectsNamespacesPage.bannerError(0).should('have.length', 1);
      projectsNamespacesPage.bannerError(1).should('have.length', 0);
    });

    it('displays the most recent error after resolving a single error in a form with multiple errors', () => {
      projectsNamespacesPage.createProjectButtonClick();

      // Create the first error
      projectsNamespacesPage.name().set('test-1234');
      projectsNamespacesPage.tabResourceQuotas().click();
      projectsNamespacesPage.btnAddResource().click();
      projectsNamespacesPage.inputProjectLimit().set('50');
      projectsNamespacesPage.buttonSubmit().click();

      // Create a second error
      projectsNamespacesPage.tabContainerDefaultResourceLimit().click();
      projectsNamespacesPage.inputCpuReservation().set('1000');
      projectsNamespacesPage.inputMemoryReservation().set('128');
      projectsNamespacesPage.inputCpuLimit().set('200');
      projectsNamespacesPage.inputMemoryLimit().set('64');
      projectsNamespacesPage.buttonSubmit().click();

      // Assert that there is only a single error message
      projectsNamespacesPage.bannerError(0).should('be.visible').contains('does not have all fields defined on a resourceQuota');
      projectsNamespacesPage.bannerError(0).should('have.length', 1);
      projectsNamespacesPage.bannerError(1).should('have.length', 0);

      // resolve the first error
      projectsNamespacesPage.tabResourceQuotas().click();
      projectsNamespacesPage.inputNamespaceDefaultLimit().set('50');
      projectsNamespacesPage.buttonSubmit().click();

      // Click on Create again and assert that there is only a single error
      projectsNamespacesPage.bannerError(0).should('be.visible').contains('admission webhook "rancher.cattle.io.projects.management.cattle.io" denied the request');
      projectsNamespacesPage.bannerError(0).should('have.length', 1);
      projectsNamespacesPage.bannerError(1).should('have.length', 0);
    });
  });
});
