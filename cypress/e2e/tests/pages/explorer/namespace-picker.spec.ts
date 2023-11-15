import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const namespacePicker = new NamespaceFilterPo();

describe('Namespace picker', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  beforeEach('set up', () => {
    ClusterDashboardPagePo.navTo();

    // reset namespace picker to default state
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('Only User Namespaces');
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.closeDropdown();
  });

  it('can filter workloads by project/namespace from the picker dropdown', { tags: ['@adminUser'] }, () => {
    // Verify 'Namespace: cattle-fleet-local-system' appears once when filtering by Namespace
    // Vrify multiple namespaces within Project: System display when filtering by Project

    const workloadsPodPage = new WorkloadsPodsListPagePo('local');

    WorkloadsPodsListPagePo.navTo();
    workloadsPodPage.waitForPage();

    // Filter by Namespace: Select 'cattle-fleet-local-system'
    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('cattle-fleet-local-system');
    namespacePicker.isChecked('cattle-fleet-local-system');
    namespacePicker.closeDropdown();
    workloadsPodPage.sortableTable().rowElementWithName('cattle-fleet-local-system').should('be.visible').and('have.length', 1);

    // clear selection: from dropdown controller
    namespacePicker.toggle();
    namespacePicker.selectedValues().find('i').trigger('click');
    // 'Only User Namespaces' option should be selected after clearing
    namespacePicker.isChecked('Only User Namespaces');

    // Filter by Project: Select 'Project: System'
    namespacePicker.clickOptionByLabel('Project: System');
    namespacePicker.isChecked('Project: System');
    namespacePicker.closeDropdown();
    workloadsPodPage.sortableTable().rowElementWithName('kube-system').should('be.visible');
    workloadsPodPage.sortableTable().rowElementWithName('cattle-fleet-local-system').scrollIntoView().should('be.visible');
  });

  it('can select only one of the top 5 resource filters at a time', { tags: ['@adminUser', '@standardUser'] }, () => {
    // Verify that user can only select one of the first 5 options

    namespacePicker.toggle();

    // Select 'All Namespaces'
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.isChecked('All Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only User Namespaces'
    namespacePicker.clickOptionByLabel('Only User Namespaces');
    namespacePicker.isChecked('Only User Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only System Namespaces'
    namespacePicker.clickOptionByLabel('Only System Namespaces');
    namespacePicker.isChecked('Only System Namespaces');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Namespaced Resources'
    namespacePicker.clickOptionByLabel('Only Namespaced Resources');
    namespacePicker.isChecked('Only Namespaced Resources');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'Only Cluster Resources'
    namespacePicker.clickOptionByLabel('Only Cluster Resources');
    namespacePicker.isChecked('Only Cluster Resources');
    namespacePicker.checkIcon().should('have.length', 1);
  });

  it('can select multiple projects/namespaces', { tags: ['@adminUser'] }, () => {
    // Verify that user can select multiple options (other than the first 5 options)

    namespacePicker.toggle();

    // Select 'Project: Default'
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.isChecked('Project: Default');
    namespacePicker.checkIcon().should('have.length', 1);

    // Select 'default'
    namespacePicker.clickOptionByLabel('default');
    namespacePicker.isChecked('default');
    namespacePicker.checkIcon().should('have.length', 2);

    // Select 'Project: System'
    namespacePicker.clickOptionByLabel('Project: System');
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
    namespacePicker.selectedValues().should('have.class', 'has-tooltip');
    namespacePicker.moreOptionsSelected().should('have.class', 'has-tooltip');
  });

  it('can deselect options', { tags: ['@adminUser', '@standardUser'] }, () => {
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

  it('can filter options by name', { tags: ['@adminUser', '@standardUser'] }, () => {
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

  it('newly created project/namespace appears in namespace picker', { tags: ['@adminUser'] }, () => {
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

  after('clean up', () => {
    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      cy.setRancherResource('v1', 'userpreferences', userId, {
        id:   userId,
        type: 'userpreference',
        data: {
          cluster:         'local',
          'group-by':      'none',
          'ns-by-cluster': '{"local":["all://user"]}',
        }
      });
    });
  });
});
