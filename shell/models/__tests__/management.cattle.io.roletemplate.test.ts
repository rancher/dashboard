import cloneDeep from 'lodash/cloneDeep';
import RoleTemplate from '@shell/models/management.cattle.io.roletemplate';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

const BLOCKED_SCHEMA = { resourceMethods: ['GET', 'blocked-DELETE', 'blocked-PUT', 'blocked-PATCH'] };

const NORMAN_SCHEMAS: Record<string, any> = {
  roletemplate: {
    resourceFields: {
      context:         { type: 'string' },
      description:     { type: 'string' },
      locked:          { type: 'boolean' },
      roleTemplateIds: { type: 'array[reference[roleTemplate]]' },
      rules:           { type: 'array[policyRule]' },
    }
  },
  policyrule: {
    resourceFields: {
      apiGroups: { type: 'array[string]' },
      resources: { type: 'array[string]' },
      verbs:     { type: 'array[string]' },
    }
  },
};

function createRoleTemplate(data: Record<string, any>) {
  const cached = {
    id: data.id, type: 'roleTemplate', links: { update: '/v3/roletemplates/rt-abcde' }
  } as Record<string, any>;
  const saved = { save: jest.fn() } as Record<string, any>;
  const ctx: any = {
    getters:     { schemaFor: () => BLOCKED_SCHEMA },
    rootGetters: {
      'type-map/optionsFor': () => ({ isEditable: true }),
      'i18n/t':              jest.fn((key: string) => key),
      'rancher/schemaFor':   (type: string) => NORMAN_SCHEMAS[type.toLowerCase()],
    },
  };

  ctx.dispatch = jest.fn((action: string, payload: any) => {
    if (action === 'rancher/clone') {
      return Promise.resolve(Object.assign(saved, cloneDeep(payload.resource)));
    }

    return Promise.resolve(cached);
  });

  return {
    ctx, cached, saved, roleTemplate: new RoleTemplate({ type: MANAGEMENT.ROLE_TEMPLATE, ...data }, ctx)
  };
}

const HEADER = `apiVersion: management.cattle.io/v3
kind: RoleTemplate
`;

const YAML = `apiVersion: management.cattle.io/v3
kind: RoleTemplate
metadata:
  name: rt-abcde
  labels:
    team: platform
  annotations:
    note: edited
context: project
displayName: Read Config Maps
description: from yaml
locked: true
roleTemplateNames:
  - project-member
rules:
  - apiGroups:
      - ''
    resources:
      - configmaps
    verbs:
      - get
clusterScopedRules:
  - apiGroups:
      - ''
    resources:
      - nodes
    verbs:
      - get
_description: stale description
`;

describe('class RoleTemplate', () => {
  describe('getter: canSaveYaml', () => {
    it('should allow saving YAML although Steve blocks writes to role templates', () => {
      const { roleTemplate } = createRoleTemplate({});

      expect(roleTemplate.canSaveYaml).toBe(true);
    });
  });

  describe('getter: canEditYaml', () => {
    it.each([
      {
        has: 'an update link', links: { update: 'blocked' }, expected: true
      },
      {
        has: 'no update link', links: {}, expected: false
      },
    ])('should be $expected when the role template has $has', ({ links, expected }) => {
      const { roleTemplate } = createRoleTemplate({ links });

      expect(roleTemplate.canEditYaml).toBe(expected);
    });
  });

  describe('method: saveYaml', () => {
    it('should update an existing role template through Norman with every field in the YAML', async() => {
      const { ctx, saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(YAML);

      expect(ctx.dispatch).toHaveBeenCalledWith('rancher/find', { id: 'rt-abcde', type: NORMAN.ROLE_TEMPLATE }, { root: true });
      expect(saved).toStrictEqual(expect.objectContaining({
        id:              'rt-abcde',
        type:            'roleTemplate',
        name:            'Read Config Maps',
        description:     'from yaml',
        context:         'project',
        locked:          true,
        roleTemplateIds: ['project-member'],
        rules:           [{
          apiGroups: [''], resources: ['configmaps'], verbs: ['get']
        }],
        clusterScopedRules: [{
          apiGroups: [''], resources: ['nodes'], verbs: ['get']
        }],
        labels:      { team: 'platform' },
        annotations: { note: 'edited' },
      }));
      expect(saved).not.toHaveProperty('_description');
      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should leave the cached Norman role template unchanged', async() => {
      const { cached, roleTemplate } = createRoleTemplate({
        id:      'rt-abcde',
        context: 'cluster',
        locked:  true,
        rules:   [{
          apiGroups: [''], resources: ['pods'], verbs: ['get']
        }],
      });

      await roleTemplate.saveYaml(YAML);

      expect(cached.clusterScopedRules).toBeUndefined();
      expect(cached.labels).toBeUndefined();
      expect(cached.locked).toBeUndefined();
      expect(cached.rules).toBeUndefined();
      expect(cached.context).toBeUndefined();
    });

    it('should not let the YAML replace the Norman role template\'s own id, type or links', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }id: rt-other
type: management.cattle.io.roletemplate
links:
  update: blocked
displayName: Read Config Maps
`);

      expect(saved).toStrictEqual(expect.objectContaining({
        id: 'rt-abcde', type: 'roleTemplate', links: { update: '/v3/roletemplates/rt-abcde' }
      }));
    });

    it('should create a new role template through Norman', async() => {
      const { ctx, saved, roleTemplate } = createRoleTemplate({});

      await roleTemplate.saveYaml(`apiVersion: management.cattle.io/v3
kind: RoleTemplate
metadata:
  name: rt-exported
  labels:
    team: platform
  annotations:
    note: created
context: cluster
displayName: Exported Role
rules: []
`);

      expect(ctx.dispatch).toHaveBeenCalledWith('rancher/create', expect.objectContaining({ type: NORMAN.ROLE_TEMPLATE }), { root: true });
      expect(saved).toStrictEqual(expect.objectContaining({
        name:                  'Exported Role',
        context:               'cluster',
        clusterCreatorDefault: false,
        projectCreatorDefault: false,
        labels:                { team: 'platform' },
        annotations:           { note: 'created' },
      }));
      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should clear the fields an edit deletes from the YAML', async() => {
      const { saved, roleTemplate } = createRoleTemplate({
        id:                'rt-abcde',
        displayName:       'Inherits',
        description:       'current',
        locked:            true,
        roleTemplateNames: ['cluster-member'],
        rules:             [{
          apiGroups: [''], resources: ['pods'], verbs: ['get']
        }],
        metadata: { labels: { team: 'platform' }, annotations: { note: 'current' } },
      });

      roleTemplate.updateSubtype('CLUSTER');

      await roleTemplate.saveYaml(`${ HEADER }displayName: Inherits
context: cluster
`);

      expect(saved).toStrictEqual(expect.objectContaining({
        id:              'rt-abcde',
        type:            'roleTemplate',
        name:            'Inherits',
        context:         'cluster',
        description:     null,
        locked:          false,
        roleTemplateIds: null,
        rules:           null,
        labels:          {},
        annotations:     {},
      }));
      expect(saved).not.toHaveProperty('_subtype');
      expect(saved).not.toHaveProperty('hidden');
    });

    it('should drop the labels and annotations Rancher\'s controllers own from a new role template', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }metadata:
  name: cluster-member
  labels:
    authz.management.cattle.io/bootstrapping: default-roletemplate
    team: platform
  annotations:
    lifecycle.cattle.io/create.mgmt-auth-roletemplate-lifecycle: 'true'
    note: pasted
displayName: Pasted Role
`);

      expect(saved.labels).toStrictEqual({ team: 'platform' });
      expect(saved.annotations).toStrictEqual({ note: 'pasted' });
    });

    it('should send the labels and annotations of an edit as written', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }metadata:
  labels:
    authz.management.cattle.io/bootstrapping: default-roletemplate
  annotations:
    lifecycle.cattle.io/create.mgmt-auth-roletemplate-lifecycle: 'true'
displayName: Cluster Member
`);

      expect(saved.labels).toStrictEqual({ 'authz.management.cattle.io/bootstrapping': 'default-roletemplate' });
      expect(saved.annotations).toStrictEqual({ 'lifecycle.cattle.io/create.mgmt-auth-roletemplate-lifecycle': 'true' });
    });

    it('should keep the display name when an edit removes it from the YAML', async() => {
      const { cached, saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      cached.name = 'Current Name';

      await roleTemplate.saveYaml(`${ HEADER }metadata:
  name: rt-abcde
`);

      expect(saved.name).toBe('Current Name');
    });

    it('should use metadata.name as the display name when the YAML for a new role template has none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }metadata:
  name: my-role
`);

      expect(saved.name).toBe('my-role');
    });

    it('should leave the name out for Norman to reject when the YAML and the form have none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }displayName: ''
metadata:
  name: ''
`);

      expect(saved.name).toBeUndefined();
    });

    it('should not resurrect a form displayName when the YAML for a new role template removes it', async() => {
      const { cached, saved, roleTemplate } = createRoleTemplate({ context: 'cluster', displayName: 'Typed In Form' });

      cached.name = 'Typed In Form';

      await roleTemplate.saveYaml(`${ HEADER }displayName: ''
metadata:
  name: ''
`);

      expect(saved.name).toBeUndefined();
    });

    it('should keep the context of the tab the role template is created from when the YAML has none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'project' });

      await roleTemplate.saveYaml(`${ HEADER }displayName: My Role\n`);

      expect(saved.context).toBe('project');
    });

    it('should save YAML whose metadata is empty', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }metadata:\ndisplayName: My Role\n`);

      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should save a role template that has no rules of its own', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }displayName: Inherit Only
roleTemplateNames:
  - cluster-member
`);

      expect(saved.save).toHaveBeenCalledWith();
    });

    it.each([
      ['an empty document', ''],
      ['a ConfigMap', 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: rt-abcde\n'],
      ['a document without apiVersion and kind', 'displayName: My Role\n'],
    ])('should reject %s without saving anything', async(_, yaml) => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await expect(roleTemplate.saveYaml(yaml)).rejects.toBe('resourceYaml.errors.wrongKind');
      expect(saved.save).not.toHaveBeenCalled();
    });

    it.each([
      ['rules written as a map', 'rules:\n  apiGroups: [""]\n  resources: [pods]\n  verbs: [get]\n', 'rules'],
      ['a rule written as text', 'rules:\n  - get pods\n', 'rules[0]'],
      ['verbs written as text', 'rules:\n  - resources: [pods]\n    verbs: get\n', 'rules[0].verbs'],
      ['a verb written as a number', 'rules:\n  - resources: [pods]\n    verbs: [1]\n', 'rules[0].verbs[0]'],
      ['roleTemplateNames written as text', 'roleTemplateNames: cluster-member\n', 'roleTemplateNames'],
      ['locked written as text', 'locked: "yes"\n', 'locked'],
      ['a description written as a list', 'description: [a]\n', 'description'],
    ])('should reject %s without saving anything', async(_, fields, path) => {
      const { ctx, saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await expect(roleTemplate.saveYaml(`${ HEADER }displayName: My Role\n${ fields }`)).rejects.toBe('resourceYaml.errors.wrongType');
      expect(ctx.rootGetters['i18n/t']).toHaveBeenCalledWith('resourceYaml.errors.wrongType', { path });
      expect(saved.save).not.toHaveBeenCalled();
    });

    it('should save fields written as null, and fields the Norman schema does not have, as they are', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`${ HEADER }displayName: My Role
rules:
  - resources: [pods]
    verbs: [get]
    resourceNames:
roleTemplateNames:
unknownField: 1
`);

      expect(saved).toStrictEqual(expect.objectContaining({
        rules: [{
          resources: ['pods'], verbs: ['get'], resourceNames: null
        }],
        roleTemplateIds: null,
        unknownField:    1,
      }));
      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should save without checking types when the Norman schema is not loaded', async() => {
      const { ctx, saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      ctx.rootGetters['rancher/schemaFor'] = () => undefined;

      await roleTemplate.saveYaml(`${ HEADER }displayName: My Role\nroleTemplateNames: cluster-member\n`);

      expect(saved.roleTemplateIds).toBe('cluster-member');
      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should clear the fields deleted from the YAML of a clone', async() => {
      const { saved, roleTemplate } = createRoleTemplate({
        context:           'cluster',
        locked:            true,
        roleTemplateNames: ['cluster-member'],
        rules:             [{
          apiGroups: [''], resources: ['pods'], verbs: ['get']
        }],
      });

      await roleTemplate.saveYaml(`${ HEADER }displayName: Clone\n`);

      expect(saved).toStrictEqual(expect.objectContaining({
        name: 'Clone', context: 'cluster', locked: false, roleTemplateIds: null, rules: null
      }));
    });

    it('should keep the context when an edit removes it from the YAML', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'project' });

      await roleTemplate.saveYaml(`${ HEADER }displayName: My Role\n`);

      expect(saved.context).toBe('project');
    });
  });

  describe('method: save', () => {
    it('should create the role template from the form through Norman', async() => {
      const rules = [{
        apiGroups: [''], resources: ['pods'], verbs: ['get']
      }];
      const { ctx, cached, roleTemplate } = createRoleTemplate({
        displayName: 'Form Role', context: 'cluster', locked: true, clusterCreatorDefault: true, description: 'from the form', roleTemplateNames: ['cluster-member'], rules
      });

      cached.save = jest.fn();

      await roleTemplate.save();

      expect(ctx.dispatch).toHaveBeenCalledWith('rancher/create', { type: NORMAN.ROLE_TEMPLATE, name: 'Form Role' }, { root: true });
      expect(cached).toStrictEqual(expect.objectContaining({
        context:               'cluster',
        locked:                true,
        clusterCreatorDefault: true,
        projectCreatorDefault: false,
        description:           'from the form',
        roleTemplateIds:       ['cluster-member'],
        rules,
      }));
      expect(cached.save).toHaveBeenCalledWith();
    });
  });

  describe('method: saveNorman', () => {
    it.each([
      [
        'keeps only the non-resource URLs of a rule that has them',
        {
          nonResourceURLs: ['/healthz'], resources: ['pods'], apiGroups: [''], verbs: ['get']
        },
        { nonResourceURLs: ['/healthz'], verbs: ['get'] },
      ],
      [
        'drops the empty non-resource URLs of a rule for resources',
        {
          nonResourceURLs: [], resources: ['pods'], apiGroups: [''], verbs: ['get']
        },
        {
          resources: ['pods'], apiGroups: [''], verbs: ['get']
        },
      ],
    ])('%s', (_, rule, expected) => {
      const { roleTemplate } = createRoleTemplate({});
      const norman = { rules: [rule], save: jest.fn() };

      roleTemplate.saveNorman(norman);

      expect(norman.rules).toStrictEqual([expected]);
      expect(norman.save).toHaveBeenCalledWith();
    });

    it.each([
      ['null entries in rules', [null]],
      ['non-array rules', 'invalid'],
    ])('should tolerate %s without throwing', (_, rules) => {
      const { roleTemplate } = createRoleTemplate({});
      const norman = { rules, save: jest.fn() };

      expect(() => roleTemplate.saveNorman(norman)).not.toThrow();
      expect(norman.save).toHaveBeenCalledWith();
    });
  });
});
