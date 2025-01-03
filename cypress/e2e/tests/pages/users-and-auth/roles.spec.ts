import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { generateGlobalRolesDataSmall } from '@/cypress/e2e/blueprints/roles/global-roles-get';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

const globalRoleNameYaml = 'test-global-role-yaml';
const globalRoleYaml = `apiVersion: management.cattle.io/v3
kind: GlobalRole
displayName: ${ globalRoleNameYaml }
description: Base user + Read-only on all downstream clusters
metadata:
  name: ${ globalRoleNameYaml }
inheritedClusterRoles:
  - projects-view
rules:
- apiGroups:
  - management.cattle.io
  resources:
  - preferences
  verbs:
  - '*'
- apiGroups:
  - management.cattle.io
  resources:
  - settings
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - management.cattle.io
  resources:
  - features
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - project.cattle.io
  resources:
  - sourcecodecredentials
  verbs:
  - '*'
- apiGroups:
  - project.cattle.io
  resources:
  - sourcecoderepositories
  verbs:
  - '*'
- apiGroups:
  - management.cattle.io
  resources:
  - rancherusernotifications
  verbs:
  - get
  - list
  - watch
`;

const roles = new RolesPo(BLANK_CLUSTER);
const usersPo = new UsersPo(BLANK_CLUSTER);
const userCreate = usersPo.createEdit();
const sideNav = new ProductNavPo();

const downloadsFolder = Cypress.config('downloadsFolder');

let runTimestamp: number;
let runPrefix: string;
let globalRoleName: string;
const roleTemplatesToDelete = [];

describe('Roles Templates', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  describe('Roles', () => {
    beforeEach(() => {
      cy.login();
      cy.viewport(1280, 720);
    });

    it('can create a Global Role template', () => {
      // We want to define these here because if this test fails after it created the global role all subsequent
      // retries will reference the wrong global-role because a second roll will with the same name but different id will be created
      runTimestamp = +new Date();
      runPrefix = `e2e-test-${ runTimestamp }`;
      globalRoleName = `${ runPrefix }-my-global-role`;

      // create global role
      const fragment = 'GLOBAL';

      roles.goTo(undefined, fragment);
      roles.waitForPage(undefined, fragment);

      // check if burger menu nav is highlighted correctly for users & auth
      // https://github.com/rancher/dashboard/issues/10010
      BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Users & Authentication');

      // catching regression https://github.com/rancher/dashboard/issues/10576
      BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local', false);

      roles.listCreate('Create Global Role');

      const createGlobalRole = roles.createGlobal();

      createGlobalRole.waitForPage('roleContext=GLOBAL', 'grant-resources');
      createGlobalRole.name().set(globalRoleName);
      createGlobalRole.description().set('e2e-description');
      createGlobalRole.selectCreatorDefaultRadioBtn(0);
      createGlobalRole.selectVerbs(0, 3);
      createGlobalRole.selectVerbs(0, 4);
      createGlobalRole.selectResourcesByLabelValue(0, 'GlobalRoles');

      createGlobalRole.saveAndWaitForRequests('POST', '/v3/globalroles').then((res) => {
        const globalRoleId = res.response?.body.id;

        // view role details
        roles.waitForPage(undefined, fragment);

        // testing https://github.com/rancher/dashboard/issues/9800
        // confirming that the globalRole created is not flagged as built-in
        roles.list('GLOBAL').checkBuiltIn(globalRoleName, false);
        // eo test

        roles.list('GLOBAL').details(globalRoleName, 2).find('a').click();

        const globalRoleDetails = roles.detailGlobal(globalRoleId);

        globalRoleDetails.waitForPage();
        globalRoleDetails.mastheadTitle().should('include', `${ globalRoleName }`);

        sideNav.navToSideMenuEntryByLabel('Role Templates');
        roles.waitForPage(undefined, fragment);

        // testing https://github.com/rancher/dashboard/issues/5291
        roles.list('GLOBAL').checkDefault(globalRoleName, true);
        UsersPo.navTo();
        usersPo.list().create();
        userCreate.waitForPage();
        userCreate.globalRoleBindings().roleCheckbox(globalRoleId).checkVisible();
        userCreate.globalRoleBindings().roleCheckbox(globalRoleId).isChecked();
        sideNav.navToSideMenuEntryByLabel('Role Templates');

        // testing https://github.com/rancher/dashboard/issues/9800
        roles.goToEditYamlPage(globalRoleName);

        createGlobalRole.yamlEditor().value().then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.builtin = false;

          createGlobalRole.yamlEditor().set(jsyaml.dump(json));
          createGlobalRole.saveEditYamlForm().click();

          roles.waitForPage();
          // confirming, once again, that the globalRole created is not flagged as built-in
          roles.list('GLOBAL').details(globalRoleName, 4).should('not.contain', 'i.icon-checkmark');
        });
      // eo test
      });
    });

    it('can create a Cluster Role template', () => {
      const clusterRoleName = `${ runPrefix }-my-cluster-role`;
      const fragment = 'CLUSTER';

      // create cluster role
      roles.goTo(undefined, fragment);

      roles.waitForPage(undefined, fragment);
      roles.listCreate('Create Cluster Role');

      const createClusterRole = roles.createRole();

      createClusterRole.waitForPage('roleContext=CLUSTER', 'grant-resources');
      createClusterRole.name().set(clusterRoleName);
      createClusterRole.description().set('e2e-create-cluster-role');
      createClusterRole.selectCreatorDefaultRadioBtn(0);
      createClusterRole.selectLockedRadioBtn(0);
      createClusterRole.selectVerbs(0, 3);
      createClusterRole.selectVerbs(0, 4);
      createClusterRole.selectResourcesByLabelValue(0, 'ClusterRoles');

      const clusterRoleId = createClusterRole.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
        const roleId = res.response?.body.id;

        roleTemplatesToDelete.push(roleId);

        return roleId;
      });

      // view role details
      roles.waitForPage(undefined, fragment);
      roles.list('CLUSTER').resourceTable().sortableTable().filter(`${ clusterRoleName }{enter}`);
      roles.waitForPage(undefined, fragment);
      roles.list('CLUSTER').resourceTable().sortableTable().checkRowCount(false, 1);
      roles.list('CLUSTER').checkDefault(clusterRoleName, true);
      roles.list('CLUSTER').details(clusterRoleName, 2).find('a').click();

      clusterRoleId.then((id) => {
        const clusterRoleDetails = roles.detailRole(id);

        clusterRoleDetails.waitForPage();
        cy.contains(`Cluster - ${ clusterRoleName }`);
      });
    });

    it('can create a Project/Namespaces Role template', () => {
      const fragment = 'NAMESPACE';
      const projectRoleName = `${ runPrefix }-my-project-role`;

      // create project role
      roles.goTo(undefined, fragment);
      roles.waitForPage(undefined, fragment);
      roles.listCreate('Create Project/Namespaces Role');

      const createProjectRole = roles.createRole();

      createProjectRole.waitForPage('roleContext=NAMESPACE', 'grant-resources');
      createProjectRole.name().set(projectRoleName);
      createProjectRole.description().set('e2e-description');
      createProjectRole.selectCreatorDefaultRadioBtn(0);
      createProjectRole.selectLockedRadioBtn(0);
      createProjectRole.selectVerbs(0, 3);
      createProjectRole.selectVerbs(0, 4);
      createProjectRole.selectResourcesByLabelValue(0, 'Namespaces');
      const projectRoleId = createProjectRole.saveAndWaitForRequests('POST', '/v3/roletemplates').then((res) => {
        const roleId = res.response?.body.id;

        roleTemplatesToDelete.push(roleId);

        return roleId;
      });

      // view role details
      roles.waitForPage(undefined, fragment);
      roles.list('NAMESPACE').resourceTable().sortableTable().filter(`${ projectRoleName }{enter}`);
      roles.waitForPage(undefined, fragment);
      roles.list('NAMESPACE').resourceTable().sortableTable().checkRowCount(false, 1);
      roles.list('NAMESPACE').checkDefault(projectRoleName, true);
      roles.list('NAMESPACE').details(projectRoleName, 2).find('a').click();

      projectRoleId.then((id) => {
        const projectRoleDetails = roles.detailRole(id);

        projectRoleDetails.waitForPage();
        cy.contains(`Project/Namespaces - ${ projectRoleName }`);
      });
    });

    it('can Download YAML', () => {
    // Download YAML and verify file exists

      roles.waitForRequests();
      roles.list('GLOBAL').elementWithName(globalRoleName).click();
      cy.intercept('GET', '/v1/management.cattle.io.globalroles/*').as('downloadYaml');
      roles.list('GLOBAL').downloadYaml().click();
      cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
      const downloadedFilename = path.join(downloadsFolder, `${ globalRoleName }.yaml`);

      cy.readFile(downloadedFilename).should('exist');
    });

    it('shows warning message when deleting the Administrator role', () => {
      const fragment = 'GLOBAL';
      const globalAdminRoleName = 'Administrator';

      roles.goTo(undefined, fragment);
      roles.waitForPage(undefined, fragment);

      // Show delete confirmation dialog
      roles.waitForRequests();
      roles.list('GLOBAL').elementWithName(globalAdminRoleName).click();
      roles.list('GLOBAL').delete().click();
      const promptRemove = new PromptRemove();

      promptRemove.warning().should('be.visible');
      promptRemove.warning().shouldHaveCssVar('color', '--warning'); // Check warning message color
      promptRemove.warning().first().should('contain.text', 'Caution:'); // Check warning message content
    });

    it('can delete a role template from the detail page', () => {
      // Delete role and verify role is removed from list
      roles.waitForRequests();
      const oneRoleTemplateId = roleTemplatesToDelete.splice(0, 1)[0];
      const detailPage = roles.detailRole(oneRoleTemplateId);

      detailPage.goTo();
      detailPage.waitForPage();

      const actionMenu = detailPage.detail().openMastheadActionMenu();

      actionMenu.clickMenuItem(5);

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      roles.list('CLUSTER').elementWithName(oneRoleTemplateId).should('not.exist');
    });

    it('can delete a role template', () => {
    // Delete role and verify role is removed from list
      roles.waitForRequests();
      roles.list('GLOBAL').elementWithName(globalRoleName).click();
      roles.list('GLOBAL').delete().click();
      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/globalRoles/*').as('deleteRole');
      promptRemove.remove();
      cy.wait('@deleteRole').its('response.statusCode').should('be.lessThan', 300); // Can sometimes be 204
      roles.list('GLOBAL').elementWithName(globalRoleName).should('not.exist');
    });

    it('Cloning a Global Role with "inheritedClusterRoles" should pass the property correctly', () => {
      const clusterDashboard = new ClusterDashboardPagePo('local');
      const header = new HeaderPo();

      // import YAML for test
      clusterDashboard.goTo();
      clusterDashboard.waitForPage();

      header.importYamlHeaderAction().click();
      header.importYaml().importYamlEditor().set(globalRoleYaml);
      header.importYaml().importYamlImportClick();

      header.importYaml().importYamlSuccessTitleCheck();
      header.importYaml().importYamlCloseClick();

      roleTemplatesToDelete.push(globalRoleNameYaml);

      // clone role
      roles.goTo(undefined, 'GLOBAL');
      roles.waitForPage(undefined, 'GLOBAL');
      roles.list('GLOBAL').elementWithName(globalRoleNameYaml).click();
      roles.list('GLOBAL').rowCloneYamlClick(globalRoleNameYaml);

      cy.intercept('POST', '/v3/globalroles').as('cloneYamlRole');

      const clusterRoleName = 'cloned-global-role';
      const editGlobalRole = roles.createRole();

      editGlobalRole.name().set(clusterRoleName);
      editGlobalRole.saveCreateForm().click();

      // check property exists
      cy.wait('@cloneYamlRole', { requestTimeout: 15000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        expect('projects-view').to.be.oneOf(response?.body?.inheritedClusterRoles);
      });
    });

    after(() => {
      roleTemplatesToDelete.forEach((r) => cy.deleteRancherResource('v3', 'roleTemplates', r, false));
    });
  });

  describe('List', { testIsolation: 'off', tags: ['@vai', '@adminUser'] }, () => {
    let uniqueRoleName = SortableTablePo.firstByDefaultName('role');
    const globalRolesIdsList = [];
    const rolesList = roles.list('GLOBAL');
    const paginatedRoleTab = roles.paginatedTab('GLOBAL');
    let initialCount: number;

    before('set up', () => {
      cy.login();
      cy.getRancherResource('v1', 'management.cattle.io.globalroles').then((resp: Cypress.Response<any>) => {
        initialCount = resp.body.count;
      });

      // create global roles
      let i = 0;

      while (i < 25) {
        const globalRoleName = Cypress._.uniqueId(Date.now().toString());

        cy.createGlobalRole(globalRoleName, ['events.k8s.io'], [], ['events'], ['get'], false, false, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
          const roleId = resp.body.id;

          globalRolesIdsList.push(roleId);
        });

        i++;
      }

      // create one more for sorting test
      cy.createGlobalRole(uniqueRoleName, ['events.k8s.io'], [], ['events'], ['get'], false, true, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
        const roleId = resp.body.id;

        uniqueRoleName = resp.body.name;

        globalRolesIdsList.push(roleId);
      });
      cy.tableRowsPerPageAndNamespaceFilter(10, 'local', 'none', '{\"local\":[]}');
    });

    it('filter global roles', () => {
      usersPo.goTo();
      RolesPo.navTo();
      roles.waitForPage();

      rolesList.resourceTable().sortableTable().checkVisible();
      rolesList.resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

      // filter by display name key (id)
      rolesList.resourceTable().sortableTable().filter(globalRolesIdsList[0]);
      rolesList.resourceTable().sortableTable().checkRowCount(false, 1);
      rolesList.resourceTable().sortableTable().rowElementWithName(globalRolesIdsList[0])
        .scrollIntoView()
        .should('be.visible');

      // filter by name
      rolesList.resourceTable().sortableTable().filter(uniqueRoleName);
      rolesList.resourceTable().sortableTable().checkRowCount(false, 1);
      rolesList.resourceTable().sortableTable().rowElementWithName(uniqueRoleName)
        .scrollIntoView()
        .should('be.visible');

      rolesList.resourceTable().sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated global roles data', () => {
      usersPo.goTo();
      RolesPo.navTo();
      roles.waitForPage();

      // check table is sorted by name in ASC order by default
      rolesList.resourceTable().sortableTable().tableHeaderRow().self()
        .scrollIntoView();
      rolesList.resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(3, 'down');

      // sort by display name in ASC order
      rolesList.resourceTable().sortableTable().sort(2)
        .click();
      rolesList.resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // global role should be visible on first page (sorted in ASC order)
      rolesList.resourceTable().sortableTable().rowElementWithName(uniqueRoleName)
        .should('be.visible');

      // navigate to last page
      paginatedRoleTab.endButton().scrollIntoView().click();

      // global role should NOT be visible on last page (sorted in ASC order)
      rolesList.resourceTable().sortableTable().rowElementWithName(uniqueRoleName)
        .should('not.exist');

      // sort by display name in DESC order
      rolesList.resourceTable().sortableTable().sort(2)
        .click();
      rolesList.resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // global role should be NOT visible on first page (sorted in DESC order)
      rolesList.resourceTable().sortableTable().rowElementWithName(uniqueRoleName)
        .should('not.exist');

      // navigate to last page
      paginatedRoleTab.endButton().scrollIntoView().click();

      // global role should be visible on last page (sorted in DESC order)
      rolesList.resourceTable().sortableTable().rowElementWithName(uniqueRoleName)
        .scrollIntoView()
        .should('be.visible');
    });

    it('pagination is visible and user is able to navigate through global roles data', () => {
      const count = initialCount + 26;

      cy.waitForRancherResources('v1', 'management.cattle.io.globalroles', count).then((resp: Cypress.Response<any>) => {
        usersPo.goTo(); // This is needed for the @vai only world
        RolesPo.navTo();
        roles.waitForPage();

        // pagination is visible
        paginatedRoleTab.checkVisible().scrollIntoView();

        // basic checks on navigation buttons
        paginatedRoleTab.leftButton().isDisabled();
        paginatedRoleTab.rightButton().isEnabled();
        paginatedRoleTab.endButton().isEnabled();

        // check text before navigation
        paginatedRoleTab.paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } GlobalRoles`);
          });

        // navigate to next page - right button
        paginatedRoleTab.rightButton().click();

        // check text and buttons after navigation
        paginatedRoleTab.paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } GlobalRoles`);
          });
        paginatedRoleTab.beginningButton().isEnabled();
        paginatedRoleTab.leftButton().isEnabled();

        // navigate to first page - left button
        paginatedRoleTab.leftButton().click();

        // check text and buttons after navigation
        paginatedRoleTab.paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } GlobalRoles`);
          });
        paginatedRoleTab.beginningButton().isDisabled();
        paginatedRoleTab.leftButton().isDisabled();

        // navigate to last page - end button
        paginatedRoleTab.endButton().scrollIntoView().click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        paginatedRoleTab.paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } GlobalRoles`);
          });

        // navigate to first page - beginning button
        paginatedRoleTab.beginningButton().click();

        // check text and buttons after navigation
        paginatedRoleTab.paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } GlobalRoles`);
          });
        paginatedRoleTab.beginningButton().isDisabled();
        paginatedRoleTab.leftButton().isDisabled();
      });
    });

    it('pagination is hidden', () => {
      generateGlobalRolesDataSmall();
      usersPo.goTo(); // this is needed here for the intercept to work
      RolesPo.navTo();
      roles.waitForPage();
      cy.wait('@globalRolesDataSmall');

      rolesList.resourceTable().sortableTable().checkVisible();
      rolesList.resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      rolesList.resourceTable().sortableTable().checkRowCount(false, 2);
      paginatedRoleTab.checkNotExists();
    });

    after(() => {
      globalRolesIdsList.forEach((r) => cy.deleteRancherResource('v3', 'globalRoles', r, false));
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, 'local', 'none', '{"local":["all://user"]}');
    });
  });

  describe('Global Roles', () => {
    before(() => {
      cy.login();
    });

    it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
      const customRoleName = `${ runPrefix }-my-custom-role`;
      const standardUsername = `${ runPrefix }-standard-user-e2e`;
      const standardPassword = 'standard-password';

      // create global role
      roles.goTo();
      roles.listCreate('Create Global Role');

      const createGlobal = roles.createGlobal();

      createGlobal.name().set(customRoleName);
      createGlobal.selectVerbs(0, 3);
      createGlobal.selectVerbs(0, 4);
      createGlobal.selectResourcesByLabelValue(0, 'GlobalRoles');
      createGlobal.saveAndWaitForRequests('POST', '/v3/globalroles');

      // create standard user
      usersPo.goTo();
      usersPo.list().create();

      userCreate.username().set(standardUsername);
      userCreate.newPass().set(standardPassword);
      userCreate.confirmNewPass().set(standardPassword);
      userCreate.selectCheckbox(customRoleName).set();
      userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings', true);

      // let's just check that the user is on the list view before attempting to login
      usersPo.goTo();
      usersPo.waitForPage();
      usersPo.list().elementWithName(standardUsername).should('exist');

      // logout admin
      cy.logout();

      // login as standard user
      cy.login(standardUsername, standardPassword);

      // navigate to the roles page and make sure user can see it
      roles.goTo();
      roles.list('GLOBAL').masthead().title().should('contain', 'Role Templates');
      roles.list('GLOBAL').elements().should('have.length.of.at.least', 1);

      // navigate to the users page and make sure user can see it
      usersPo.waitForRequests();
      usersPo.list().masthead().title().should('contain', 'Users');
      usersPo.list().elements().should('have.length', 1);
    });
  });
});
