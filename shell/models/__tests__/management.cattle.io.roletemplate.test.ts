import cloneDeep from 'lodash/cloneDeep';
import RoleTemplate from '@shell/models/management.cattle.io.roletemplate';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

const BLOCKED_SCHEMA = { resourceMethods: ['GET', 'blocked-DELETE', 'blocked-PUT', 'blocked-PATCH'] };

function createRoleTemplate(data: Record<string, any>) {
  const cached = {
    id: data.id, type: 'roleTemplate', links: { update: '/v3/roletemplates/rt-abcde' }
  } as Record<string, any>;
  const saved = { save: jest.fn() } as Record<string, any>;
  const ctx: any = {
    getters:     { schemaFor: () => BLOCKED_SCHEMA },
    rootGetters: { 'type-map/optionsFor': () => ({ isEditable: true }) },
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
      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should leave the cached Norman role template unchanged', async() => {
      const { cached, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(YAML);

      expect(cached.clusterScopedRules).toBeUndefined();
      expect(cached.labels).toBeUndefined();
    });

    it('should not let the YAML replace the Norman role template\'s own id, type or links', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`id: rt-other
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

    it('should keep the display name when an edit removes it from the YAML', async() => {
      const { cached, saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      cached.name = 'Current Name';

      await roleTemplate.saveYaml(`metadata:
  name: rt-abcde
`);

      expect(saved.name).toBe('Current Name');
    });

    it('should use metadata.name as the display name when the YAML for a new role template has none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'cluster' });

      await roleTemplate.saveYaml(`metadata:
  name: my-role
`);

      expect(saved.name).toBe('my-role');
    });

    it('should leave the name out for Norman to reject when the YAML and the form have none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'cluster' });

      await roleTemplate.saveYaml(`displayName: ''
metadata:
  name: ''
`);

      expect(saved.name).toBeUndefined();
    });

    it('should keep the context of the tab the role template is created from when the YAML has none', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ context: 'project' });

      await roleTemplate.saveYaml('displayName: My Role\n');

      expect(saved.context).toBe('project');
    });

    it('should save YAML whose metadata is empty', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml('metadata:\ndisplayName: My Role\n');

      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should save a role template that has no rules of its own', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ id: 'rt-abcde', context: 'cluster' });

      await roleTemplate.saveYaml(`displayName: Inherit Only
roleTemplateNames:
  - cluster-member
`);

      expect(saved.save).toHaveBeenCalledWith();
    });

    it('should save an empty YAML document with the values of the form', async() => {
      const { saved, roleTemplate } = createRoleTemplate({ displayName: 'From The Form', context: 'project' });

      await roleTemplate.saveYaml('');

      expect(saved).toStrictEqual(expect.objectContaining({ context: 'project', projectCreatorDefault: false }));
      expect(saved.save).toHaveBeenCalledWith();
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
  });
});
