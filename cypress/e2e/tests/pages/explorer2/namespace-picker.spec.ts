import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const namespacePicker = new NamespaceFilterPo();

describe('Namespace picker', { testIsolation: 'off' }, () => {
  let removeProjectAndNs = false;
  let projectId: string;
  const projName = `project${ +new Date() }`;
  const nsName = `namespace${ +new Date() }`;

  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  beforeEach('set up', () => {
    HomePagePo.goTo();
    ClusterDashboardPagePo.navTo();

    // reset namespace picker to default state with proper wait
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabelAndWaitForRequest('Only User Namespaces');
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.closeDropdown();
  });

  it('can filter workloads by project/namespace from the picker dropdown', { tags: ['@explorer2', '@adminUser'] }, () => {
    // Verify 'Namespace: cattle-fleet-system' appears once when filtering by Namespace
    // Verify multiple namespaces within Project: System display when filtering by Project

    // group workloads by namespace - updateNamespaceFilter handles its own waiting internally
    cy.updateNamespaceFilter('local', 'metadata.namespace', '{"local":["all://user"]}');

    const workloadsPodPage = new WorkloadsPodsListPagePo('local');

    cy.intercept('GET', '/v1/pods?*').as('getPods');

    WorkloadsPodsListPagePo.navTo();
    workloadsPodPage.waitForPage();
    cy.wait('@getPods');

    // group by namespace
    workloadsPodPage.list().resourceTable().sortableTable().groupByButtons(1)
      .click();

    // Wait for the namespace picker to be ready before interacting with it
    namespacePicker.namespaceDropdown().should('be.visible');

    // Filter by Namespace: Select 'cattle-fleet-system'
    namespacePicker.toggle();
    // Wait for dropdown to open and options to be populated
    namespacePicker.getOptions().should('be.visible');
    namespacePicker.getOptions().find('#ns_cattle-fleet-system').should('exist');
    namespacePicker.clickOptionByLabel('cattle-fleet-system');
    namespacePicker.isChecked('cattle-fleet-system');
    namespacePicker.closeDropdown();
    // Wait for dropdown to close completely before proceeding
    cy.get('[data-testid="namespaces-filter"]').should('be.visible');
    namespacePicker.getOptions().should('not.exist');

    // Wait for API call to complete and table to update after namespace filter change
    cy.wait('@getPods');
    workloadsPodPage.list().resourceTable().sortableTable().checkVisible();
    workloadsPodPage.list().resourceTable().sortableTable()
      .groupElementWithName('cattle-fleet-system')
      .scrollIntoView()
      .should('be.visible')
      .and('have.length', 1);

    // clear selection: from dropdown controller
    namespacePicker.toggle();
    // Wait for dropdown options to be available before interacting
    namespacePicker.getOptions().should('be.visible');
    namespacePicker.selectedValues().find('i').trigger('click');
    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked('Only User Namespaces');

    // Filter by Project: Select 'Project: System'
    namespacePicker.clickOptionByLabel('Project: System');
    namespacePicker.isChecked('Project: System');
    namespacePicker.closeDropdown();
    // Wait for dropdown to close completely
    cy.get('[data-testid="namespaces-filter"]').should('be.visible');
    namespacePicker.getOptions().should('not.exist');

    // Wait for API call to complete and table to update after project filter change
    cy.wait('@getPods');
    workloadsPodPage.list().resourceTable().sortableTable().checkVisible();
    workloadsPodPage.list().resourceTable().sortableTable().groupElementWithName('kube-system')
      .scrollIntoView()
      .should('be.visible');
    workloadsPodPage.list().resourceTable().sortableTable().groupElementWithName('cattle-fleet-system')
      .scrollIntoView()
      .should('be.visible');
  });

  it('can select only one of the top 5 resource filters at a time', { tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
    // Verify that user can only select one of the first 5 options

    namespacePicker.toggle();

    // Select 'All Namespaces'
    namespacePicker.clickOptionByLabelAndWaitForRequest('All Namespaces');
    namespacePicker.isChecked('All Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only User Namespaces'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Only User Namespaces');
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only System Namespaces'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Only System Namespaces');
    namespacePicker.isChecked('Only System Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Namespaced Resources'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Only Namespaced Resources');
    namespacePicker.isChecked('Only Namespaced Resources');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Cluster Resources'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Only Cluster Resources');
    namespacePicker.isChecked('Only Cluster Resources');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can select multiple projects/namespaces', { tags: ['@explorer2', '@adminUser'] }, () => {
    // Verify that user can select multiple options (other than the first 5 options)

    namespacePicker.toggle();

    // Select 'Project: Default'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Project: Default');
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'default'
    namespacePicker.clickOptionByLabel('default');
    namespacePicker.isChecked('default');
    namespacePicker.checkIcon().should('have.length', 2);

    // Select 'Project: System'
    namespacePicker.clickOptionByLabelAndWaitForRequest('Project: System');
    namespacePicker.isChecked('Project: System');
    namespacePicker.checkIcon().should('have.length', 3);

    // Select 'cattle-fleet-clusters-system'
    namespacePicker.clickOptionByLabel('cattle-fleet-clusters-system');
    namespacePicker.isChecked('cattle-fleet-clusters-system');
    namespacePicker.checkIcon().should('have.length', 4);

    // Checks on dropdown controller: selected value displays, number of hidden selections display, tool top is available
    namespacePicker.selectedValues().find('.ns-value').should('have.length', 4);
    namespacePicker.selectedValues().find('.ns-value').contains('Project: Default').should('be.visible');
    namespacePicker.namespaceDropdown().find('.ns-more').should('contains.text', '+3');
    namespacePicker.closeDropdown();
    namespacePicker.selectedValues().realHover();
    namespacePicker.selectedValues().should('have.class', 'has-clean-tooltip');
    namespacePicker.moreOptionsSelected().realHover();
    namespacePicker.moreOptionsSelected().should('have.class', 'has-clean-tooltip');
  });

  it('can deselect options', { tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
    namespacePicker.toggle();

    // Select 'default' option
    namespacePicker.clickOptionByLabel('default');
    namespacePicker.isChecked('default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear selection from dropdown controller
    namespacePicker.selectedValues().find('i').trigger('click');

    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Project: Default' option
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear selection from dropdown menu
    namespacePicker.clearSelectionButton();
    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can filter after making a selection', { tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
    namespacePicker.toggle();

    // Select 'Project: Default'
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    namespacePicker.searchByName('default');
    namespacePicker.getOptions().find('.ns-option').should('have.length.gte', 2);
  });

  it('can filter options by name', { tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
    namespacePicker.toggle();

    // filter 'cattle-fleet'
    namespacePicker.searchByName('default');
    namespacePicker.getOptions().find('.ns-option').should('have.length.gte', 2);
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear search
    namespacePicker.clearSearchFilter();
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // Reset: clear selection from dropdown menu
    namespacePicker.clearSelectionButton();
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('newly created project/namespace appears in namespace picker', { tags: ['@explorer2', '@adminUser'] }, () => {
    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      // create project
      cy.createProject(projName, 'local', userId).then((resp: Cypress.Response<any>) => {
        projectId = resp.body.id.trim();

        // create ns
        cy.createNamespaceInProject(nsName, projectId);

        // check ns picker
        namespacePicker.toggle();
        cy.contains(projName).should('exist').scrollIntoView().and('be.visible');
        cy.contains(nsName).should('exist').scrollIntoView().and('be.visible');
        removeProjectAndNs = true;
      });
    });
  });

  it('deleted project/namespace gets removed from namespace picker', { tags: ['@explorer2', '@adminUser'] }, () => {
    const projNameToDelete = `project-to-delete${ +new Date() }`;
    const nsNameToDelete = `namespace-to-delete${ +new Date() }`;

    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      // create project
      cy.createProject(projNameToDelete, 'local', userId).then((resp: Cypress.Response<any>) => {
        const projIdToDelete = resp.body.id.trim();

        // create ns
        cy.createNamespaceInProject(nsNameToDelete, projIdToDelete);

        // check ns picker
        namespacePicker.toggle();
        cy.contains(projNameToDelete).should('exist').scrollIntoView().and('be.visible');
        cy.contains(nsNameToDelete).should('exist').scrollIntoView().and('be.visible');

        // delete project and ns
        cy.deleteRancherResource('v1', 'namespaces', nsNameToDelete);
        cy.deleteRancherResource('v3', 'projects', projIdToDelete);

        // check ns picker
        namespacePicker.toggle();
        cy.contains(projNameToDelete, { timeout: 20000 }).should('not.exist');
        cy.contains(nsNameToDelete, { timeout: 20000 }).should('not.exist');
      });
    });
  });

  after('clean up', () => {
    // Use try-catch pattern to handle potential race conditions in namespace filter cleanup
    cy.getRancherResource('v3', 'users?me=true').then((userResp: Cypress.Response<any>) => {
      const userId = userResp.body.data[0].id.trim();

      // Try to reset namespace filter, but don't fail the test if it conflicts
      cy.request({
        method:           'GET',
        url:              `${ Cypress.env('api') }/v1/userpreferences/${ userId }`,
        failOnStatusCode: false
      }).then((resp: Cypress.Response<any>) => {
        if (resp.status === 200) {
          const userPreference = resp.body;
          const updatedData = {
            ...userPreference,
            data: {
              ...userPreference.data,
              cluster:         'local',
              'group-by':      'none',
              'ns-by-cluster': '{"local":["all://user"]}'
            }
          };

          cy.request({
            method:           'PUT',
            url:              `${ Cypress.env('api') }/v1/userpreferences/${ userId }`,
            body:             updatedData,
            failOnStatusCode: false,
            timeout:          10000
          }).then((updateResp: Cypress.Response<any>) => {
            if (updateResp.status >= 400) {
              cy.log(`Namespace filter cleanup failed with status ${ updateResp.status }, but continuing with test cleanup`);
            } else {
              cy.log('Namespace filter successfully reset during cleanup');
            }
          });
        } else {
          cy.log('Could not retrieve user preferences for cleanup, but continuing with test cleanup');
        }
      });
    });

    if (removeProjectAndNs) {
      // delete project and ns
      cy.deleteRancherResource('v1', 'namespaces', nsName);
      cy.deleteRancherResource('v3', 'projects', projectId);
    }
  });
});
