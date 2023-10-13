import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';

const clusterDashboard = new ClusterDashboardPagePo('local');
const namespacePicker = new NamespaceFilterPo();

describe('Namespace picker', () => {
  beforeEach(() => {
    cy.login();
  });

  it('can filter workloads by project/namespace from the picker dropdown', { tags: '@adminUser' }, () => {
    // filter Namespace: go to Pods > select cattle-fleet-local-system to filter by namespace > verify 'Namespace: ' appears once
    // filter Project: go to Pods > select Project: System to filter by project > verify 'Namespace: ' more than once
    const workloadsPodPage = new WorkloadsPodsListPagePo('local');

    workloadsPodPage.goTo();
    workloadsPodPage.waitForPage();

    cy.intercept('PUT', '/v1/userpreferences/*').as('optionSelected');

    // Select 'cattle-fleet-local-system'
    namespacePicker.toggle();
    namespacePicker.clickOption(11, 'cattle-fleet-local-system');
    namespacePicker.isChecked(11, 'cattle-fleet-local-system');
    cy.wait('@optionSelected');
    cy.contains('Namespace: ').should('be.visible').and('have.length', 1);

    // clear selection: from dropdown controller
    namespacePicker.selectedValues().find('i').trigger('click');

    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked(1, 'Only User Namespaces');
    cy.wait('@optionSelected');

    // Select 'Project: System'
    namespacePicker.clickOption(9, 'Project: System');
    namespacePicker.isChecked(9, 'Project: System');
    cy.wait('@optionSelected');

    workloadsPodPage.sortableTable().rowElements().find('.group-tab')
      .should('include.text', 'Namespace: ')
      .and('have.length.gte', 2);

    // clear selection: from dropdown controller
    namespacePicker.selectedValues().find('i').trigger('click');

    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked(1, 'Only User Namespaces');
    cy.wait('@optionSelected');
  });

  it('can select only one of the top 5 resource filters at a time', { tags: ['@adminUser', '@standardUser'] }, () => {
    // Verify that user can only select one of the first 5 options

    clusterDashboard.goTo();
    namespacePicker.toggle();

    // Select 'All Namespaces'
    namespacePicker.clickOption(0, 'All Namespaces');
    namespacePicker.isChecked(0, 'All Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only User Namespaces'
    namespacePicker.clickOption(1, 'Only User Namespaces');
    namespacePicker.isChecked(1, 'Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only System Namespaces'
    namespacePicker.clickOption(2, 'Only System Namespaces');
    namespacePicker.isChecked(2, 'Only System Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Namespaced Resources'
    namespacePicker.clickOption(3, 'Only Namespaced Resources');
    namespacePicker.isChecked(3, 'Only Namespaced Resources');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Cluster Resources'
    namespacePicker.clickOption(4, 'Only Cluster Resources');
    namespacePicker.isChecked(4, 'Only Cluster Resources');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can select multiple projects/namespaces', { tags: '@adminUser' }, () => {
    // Verify that user can select multiple options (other than the first 5 options)

    cy.userPreferences({ 'ns-by-cluster': '{"local":["all://user"]}' });

    clusterDashboard.goTo();
    namespacePicker.toggle();

    // Select 'Project: Default'
    namespacePicker.clickOption(6, 'Project: Default');
    namespacePicker.isChecked(6, 'Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'default'
    namespacePicker.clickOption(7, 'default');
    namespacePicker.isChecked(7, 'default');
    namespacePicker.checkIcon().should('have.length', 2);

    // Select 'Project: System'
    namespacePicker.clickOption(9, 'Project: System');
    namespacePicker.isChecked(9, 'Project: System');
    namespacePicker.checkIcon().should('have.length', 3);

    // Select 'cattle-fleet-clusters-system'
    namespacePicker.clickOption(10, 'cattle-fleet-clusters-system');
    namespacePicker.isChecked(10, 'cattle-fleet-clusters-system');
    namespacePicker.checkIcon().should('have.length', 4);

    // Checks on dropdown controller: selected value displays, number of hidden selections display, tool top is available
    namespacePicker.selectedValues().find('.ns-value').should('have.length', 4);
    namespacePicker.selectedValues().find('.ns-value').contains('Project: Default').should('be.visible');
    namespacePicker.namespaceDropdown().find('.ns-more').should('contains.text', '+3');
    namespacePicker.closeDropdown();
    namespacePicker.selectedValues().should('have.class', 'has-tooltip');
    namespacePicker.moreOptionsSelected().should('have.class', 'has-tooltip');

    // Reset: clear selection from dropdown menu
    namespacePicker.toggle();
    namespacePicker.clearSelectionButton();
    namespacePicker.isChecked(1, 'Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can deselect options', { tags: ['@adminUser', '@standardUser'] }, () => {
    cy.userPreferences({ 'ns-by-cluster': '{"local":["all://user"]}' });

    clusterDashboard.goTo();
    namespacePicker.toggle();

    // Select 'default' option
    namespacePicker.clickOption(7, 'default');
    namespacePicker.isChecked(7, 'default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear selection from dropdown controller
    namespacePicker.selectedValues().find('i').trigger('click');

    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked(1, 'Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Project: Default' option
    namespacePicker.clickOption(6, 'Project: Default');
    namespacePicker.isChecked(6, 'Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear selection from dropdown menu
    namespacePicker.clearSelectionButton();

    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked(1, 'Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can filter options by name', { tags: ['@adminUser', '@standardUser'] }, () => {
    cy.userPreferences({ 'ns-by-cluster': '{"local":["all://user"]}' });

    clusterDashboard.goTo();
    namespacePicker.toggle();

    // filter 'cattle-fleet'
    namespacePicker.searchByName('default');
    namespacePicker.getOptions().find('.ns-option').should('have.length.gte', 2);
    namespacePicker.clickOption(0, 'Project: Default');
    namespacePicker.isChecked(0, 'Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // clear search
    namespacePicker.clearSearchFilter();
    namespacePicker.isChecked(6, 'Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // Reset: clear selection from dropdown menu
    namespacePicker.clearSelectionButton();
    namespacePicker.isChecked(1, 'Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('newly created project/namespace appears in namespace picker', { tags: '@adminUser' }, () => {
    const projName = `project${ +new Date() }`;
    const nsName = `namespace${ +new Date() }`;

    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      // create project
      cy.createProject(projName, 'local', userId).then((resp: Cypress.Response<any>) => {
        const projId = resp.body.id.trim();

        // create ns
        cy.createNamespace(nsName, projId);

        // check ns picker
        clusterDashboard.goTo();
        namespacePicker.toggle();
        cy.contains(projName).should('be.visible');
        cy.contains(nsName).should('be.visible');

        // delete project and ns
        cy.deleteRancherResource('v1', 'namespaces', nsName);
        cy.deleteRancherResource('v3', 'projects', projId);

        // check ns picker
        cy.reload();
        namespacePicker.toggle();
        cy.contains(projName).should('not.exist');
        cy.contains(nsName).should('not.exist');
      });
    });
  });
});
