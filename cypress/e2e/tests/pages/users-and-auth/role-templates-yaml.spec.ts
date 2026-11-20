import * as jsyaml from 'js-yaml';
import RolesPo from '@/cypress/e2e/po/pages/users-and-auth/roles.po';
import { BLANK_CLUSTER } from '@/cypress/support/utils/shell';

const roles = new RolesPo(BLANK_CLUSTER);

const ROLE_TEMPLATE_UPDATE = /\/v3\/roletemplates\/rt-[a-z0-9]+$/i;
const LIFECYCLE_FINALIZER = 'controller.cattle.io/mgmt-auth-roletemplate-lifecycle';
const BOOTSTRAPPING_LABEL = 'authz.management.cattle.io/bootstrapping';

const RULES = [{
  apiGroups: [''], resources: ['configmaps'], verbs: ['get', 'list']
}];

function roleTemplateYaml(data: Record<string, any>) {
  return jsyaml.dump({
    apiVersion: 'management.cattle.io/v3', kind: 'RoleTemplate', ...data
  });
}

function deleteRolesNamed(prefix: string) {
  cy.getRancherResource('v3', 'roleTemplates').then(({ body }) => {
    body.data
      .filter((roleTemplate: any) => roleTemplate.name?.startsWith(prefix))
      .forEach((roleTemplate: any) => cy.deleteRancherResource('v3', 'roleTemplates', roleTemplate.id, false));
  });
  cy.getRancherResource('v3', 'globalRoles').then(({ body }) => {
    body.data
      .filter((globalRole: any) => globalRole.id?.startsWith(prefix))
      .forEach((globalRole: any) => cy.deleteRancherResource('v3', 'globalRoles', globalRole.id, false));
  });
}

function createRoleTemplate(name: string): Cypress.Chainable<string> {
  return cy.createRancherResource('v3', 'roleTemplates', {
    name, context: 'cluster', description: 'created by e2e', rules: RULES
  }).then((resp) => resp.body.id);
}

describe('Role Templates as YAML', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  let prefix: string | undefined;

  beforeEach(() => {
    prefix = undefined;
    cy.login();
    cy.createE2EResourceName('role-yaml').then((name) => {
      prefix = name;
      deleteRolesNamed(name);
    });
  });

  afterEach(() => {
    if (prefix) {
      deleteRolesNamed(prefix);
    }
  });

  [
    {
      tab: 'CLUSTER', createLabel: 'Create Cluster Role', context: 'cluster'
    },
    {
      tab: 'NAMESPACE', createLabel: 'Create Project/Namespaces Role', context: 'project'
    },
  ].forEach(({ tab, createLabel, context }) => {
    it(`can create a ${ context } role template with Edit as YAML`, () => {
      const name = `${ prefix }-${ context }-create`;

      roles.goTo(undefined, tab);
      roles.waitForPage(undefined, tab);
      roles.listCreate(createLabel);

      const createRole = roles.createRole();

      createRole.waitForPage(`roleContext=${ tab }`, 'grant-resources');
      createRole.editAsYaml().click();
      createRole.yamlEditor().set(roleTemplateYaml({
        context, displayName: name, description: 'created as YAML', rules: RULES
      }));

      cy.intercept('POST', '/v3/roletemplates').as('createRoleTemplate');
      createRole.saveYamlForm().click();

      cy.wait('@createRoleTemplate').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(response?.body).to.include({
          name, context, description: 'created as YAML'
        });
        expect(response?.body.rules[0].resources).to.deep.eq(['configmaps']);
      });

      roles.waitForPage(undefined, tab);
      roles.list(tab as 'CLUSTER' | 'NAMESPACE').resourceTable().sortableTable().filter(`${ name }{enter}`);
      roles.list(tab as 'CLUSTER' | 'NAMESPACE').resourceTable().sortableTable().checkRowCount(false, 1);
    });
  });

  it('can edit a role template with Edit YAML from the list', () => {
    const name = `${ prefix }-list`;
    const renamed = `${ prefix }-list-renamed`;

    createRoleTemplate(name).then((id) => {
      roles.goTo(undefined, 'CLUSTER');
      roles.waitForPage(undefined, 'CLUSTER');
      roles.list('CLUSTER').actionMenu(name).getMenuItem('Edit YAML').click();

      const editRole = roles.createRole(id);

      editRole.waitForPage();
      cy.url().should('include', 'as=yaml');
      editRole.yamlEditor().value().then((yaml) => {
        const roleTemplate: any = jsyaml.load(yaml);

        roleTemplate.displayName = renamed;
        roleTemplate.description = 'edited as YAML';
        roleTemplate.metadata.labels = { ...roleTemplate.metadata.labels, e2e: 'yaml' };

        editRole.yamlEditor().set(jsyaml.dump(roleTemplate));
      });

      cy.intercept('PUT', ROLE_TEMPLATE_UPDATE).as('updateRoleTemplate');
      editRole.saveEditYamlForm().click();

      cy.wait('@updateRoleTemplate').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.include({
          id, name: renamed, description: 'edited as YAML'
        });
        expect(response?.body.labels).to.include({ e2e: 'yaml' });
      });

      roles.waitForPage(undefined, 'CLUSTER');
      roles.list('CLUSTER').resourceTable().sortableTable().filter(`${ renamed }{enter}`);
      roles.list('CLUSTER').resourceTable().sortableTable().checkRowCount(false, 1);
    });
  });

  it('can edit a role template with Edit as YAML on its edit form', () => {
    const name = `${ prefix }-form`;

    createRoleTemplate(name).then((id) => {
      const editRole = roles.createRole(id);

      editRole.goTo();
      editRole.waitForPage();
      editRole.editAsYaml().click();
      editRole.yamlEditor().value().then((yaml) => {
        const roleTemplate: any = jsyaml.load(yaml);

        roleTemplate.locked = true;
        roleTemplate.rules = [...roleTemplate.rules, {
          apiGroups: [''], resources: ['secrets'], verbs: ['get']
        }];

        editRole.yamlEditor().set(jsyaml.dump(roleTemplate));
      });

      cy.intercept('PUT', ROLE_TEMPLATE_UPDATE).as('updateRoleTemplate');
      editRole.saveYamlForm().click();

      cy.wait('@updateRoleTemplate').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.include({ id, locked: true });
        expect(response?.body.rules.map((rule: any) => rule.resources[0])).to.deep.eq(['configmaps', 'secrets']);
      });

      roles.waitForPage(undefined, 'CLUSTER');
    });
  });

  it('shows why Rancher rejected a role template created with Edit as YAML', () => {
    roles.goTo(undefined, 'CLUSTER');
    roles.waitForPage(undefined, 'CLUSTER');
    roles.listCreate('Create Cluster Role');

    const createRole = roles.createRole();

    createRole.waitForPage('roleContext=CLUSTER', 'grant-resources');
    createRole.editAsYaml().click();
    createRole.yamlEditor().set(roleTemplateYaml({ context: 'cluster', rules: RULES }));

    cy.intercept('POST', '/v3/roletemplates').as('createRoleTemplate');
    createRole.saveYamlForm().click();

    cy.wait('@createRoleTemplate').its('response.statusCode').should('eq', 422);
    createRole.errors().should('contain', 'name is required');
    createRole.waitForPage('roleContext=CLUSTER');
  });

  it('does not copy the metadata Rancher owns when cloning a built-in role template as YAML', () => {
    const name = `${ prefix }-clone`;

    roles.goTo(undefined, 'CLUSTER');
    roles.waitForPage(undefined, 'CLUSTER');
    roles.list('CLUSTER').rowCloneYamlClick('cluster-member');

    const cloneRole = roles.createRole();

    cy.url().should('include', 'mode=clone');
    cloneRole.name().set(name);
    cloneRole.editAsYaml().click();
    cloneRole.yamlEditor().value().then((yaml) => {
      const roleTemplate: any = jsyaml.load(yaml);
      const annotations = Object.keys(roleTemplate.metadata?.annotations || {});

      expect(roleTemplate.metadata?.labels || {}).not.to.have.property(BOOTSTRAPPING_LABEL);
      expect(annotations.filter((key) => key.startsWith('lifecycle.cattle.io/'))).to.deep.eq([]);
    });

    cy.intercept('POST', '/v3/roletemplates').as('createRoleTemplate');
    cloneRole.saveYamlForm().click();

    cy.wait('@createRoleTemplate').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.name).to.eq(name);
      expect(response?.body.labels || {}).not.to.have.property(BOOTSTRAPPING_LABEL);

      cy.waitForRancherResource('v1', 'management.cattle.io.roletemplates', response?.body.id, (resp: any) => resp.body.metadata.finalizers?.includes(LIFECYCLE_FINALIZER))
        .should('eq', true);
    });
  });

  it('can create a global role with Edit as YAML', () => {
    const name = `${ prefix }-global`;

    roles.goTo(undefined, 'GLOBAL');
    roles.waitForPage(undefined, 'GLOBAL');
    roles.listCreate('Create Global Role');

    const createGlobalRole = roles.createGlobal();

    createGlobalRole.waitForPage('roleContext=GLOBAL', 'grant-resources');
    createGlobalRole.editAsYaml().click();
    createGlobalRole.yamlEditor().set(jsyaml.dump({
      apiVersion: 'management.cattle.io/v3', kind: 'GlobalRole', metadata: { name }, displayName: name, rules: RULES
    }));

    cy.intercept('POST', '/v1/management.cattle.io.globalroles').as('createGlobalRole');
    createGlobalRole.saveYamlForm().click();

    cy.wait('@createGlobalRole').its('response.statusCode').should('eq', 201);

    roles.waitForPage(undefined, 'GLOBAL');
    roles.list('GLOBAL').resourceTable().sortableTable().filter(`${ name }{enter}`);
    roles.list('GLOBAL').resourceTable().sortableTable().checkRowCount(false, 1);
  });
});
