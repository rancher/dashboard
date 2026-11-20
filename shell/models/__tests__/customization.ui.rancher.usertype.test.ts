import UserType, { USER_TYPE_LABEL } from '@shell/models/customization.ui.rancher.usertype';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

const PRINCIPALS: Record<string, { id: string, principalType: string }> = {
  'local://u-alice':     { id: 'local://u-alice', principalType: 'user' },
  'github_user://123':   { id: 'github_user://123', principalType: 'user' },
  'github_org://devops': { id: 'github_org://devops', principalType: 'group' },
};

/**
 * A user type whose store dispatch answers the actions the model uses. `bindings` are the user type's labelled global role bindings
 */
function userTypeWithStore({ bindings = [] as any[], findRole = (): Promise<any> => Promise.resolve({ id: 'usertype-dev' }) } = {}) {
  const created: any[] = [];
  const dispatch = jest.fn((action: string, args: any) => {
    switch (action) {
    case 'management/find':
      return findRole();
    case 'management/create': {
      const resource = { ...args, _save: jest.fn().mockResolvedValue(undefined) };

      created.push(resource);

      return Promise.resolve(resource);
    }
    case 'management/findLabelSelector':
      return Promise.resolve({ data: bindings });
    case 'rancher/find':
      return Promise.resolve(PRINCIPALS[args.id]);
    }

    return Promise.reject(new Error(`unexpected action ${ action }`));
  });

  const userType = new UserType({
    type:     'customization.ui.rancher.usertype',
    metadata: { name: 'dev', uid: 'uid-1' },
    spec:     { displayName: 'Developer', priority: 0 }
  }, {
    getters: {}, rootGetters: {}, dispatch
  });

  return {
    userType, dispatch, created
  };
}

function binding(fields: object) {
  return { ...fields, remove: jest.fn().mockResolvedValue(undefined) };
}

describe('class UserType', () => {
  describe('applyDefaults', () => {
    it('should set the spec defaults when there is no spec', () => {
      const userType = new UserType({ metadata: { name: 'test' } });

      userType.applyDefaults();

      expect(userType.spec).toStrictEqual({
        displayName: '', priority: 0, tags: []
      });
    });

    it('should give each user type its own tags list', () => {
      const first = new UserType({ metadata: { name: 'first' } });
      const second = new UserType({ metadata: { name: 'second' } });

      first.applyDefaults();
      first.spec.tags?.push('development');
      second.applyDefaults();

      expect(second.spec.tags).toStrictEqual([]);
    });

    it.each([
      [
        'all fields set',
        {
          displayName: 'App Developer',
          priority:    10,
          tags:        ['development'],
          rules:       [{
            apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
          }]
        },
        {
          displayName: 'App Developer',
          priority:    10,
          tags:        ['development'],
          rules:       [{
            apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
          }]
        }
      ],
      ['a priority of 0', { priority: 0 }, {
        displayName: '', priority: 0, tags: []
      }],
      ['a negative priority', { priority: -5 }, {
        displayName: '', priority: -5, tags: []
      }],
      ['only a display name', { displayName: 'Ops' }, {
        displayName: 'Ops', priority: 0, tags: []
      }],
    ])('should keep existing spec values with %s', (_, spec, expected) => {
      const userType = new UserType({ metadata: { name: 'test' }, spec });

      userType.applyDefaults();

      expect(userType.spec).toStrictEqual(expected);
    });
  });

  describe('customValidationErrors', () => {
    const ctx = { rootGetters: { 'i18n/t': (key: string) => key, 'i18n/exists': () => false } };

    it.each([
      ['no rules', undefined, []],
      ['an empty rules list', [], []],
      ['a complete rule', [{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
      }], []],
      ['a rule with no verbs', [{
        apiGroups: ['apps'], resources: ['deployments'], verbs: []
      }], ['validation.roleTemplate.roleTemplateRules.missingVerb']],
      ['a rule with no resources', [{
        apiGroups: [''], resources: [], verbs: ['get']
      }], ['validation.roleTemplate.roleTemplateRules.missingOneResource']],
    ])('should validate the resource permissions with %s', (_, rules, expected) => {
      const userType = new UserType({
        type:     'customization.ui.rancher.usertype',
        metadata: { name: 'test' },
        spec:     {
          displayName: 'Test', priority: 0, rules
        }
      }, ctx);

      expect(userType.customValidationErrors(userType)).toStrictEqual(expected);
    });
  });

  describe('globalRoleName', () => {
    it('should name the global role after the user type', () => {
      const { userType } = userTypeWithStore();

      expect(userType.globalRoleName).toBe('usertype-dev');
    });
  });

  describe('ensureGlobalRole', () => {
    it('should return the existing global role without creating one', async() => {
      const { userType, created } = userTypeWithStore();

      const role = await userType.ensureGlobalRole();

      expect(role).toStrictEqual({ id: 'usertype-dev' });
      expect(created).toHaveLength(0);
    });

    it('should create the global role through steve when it does not exist', async() => {
      const { userType, created } = userTypeWithStore({ findRole: () => Promise.reject({ status: 404 }) }); // eslint-disable-line prefer-promise-reject-errors

      await userType.ensureGlobalRole();

      expect(created).toHaveLength(1);
      expect(created[0]).toStrictEqual(expect.objectContaining({
        type:     MANAGEMENT.GLOBAL_ROLE,
        metadata: {
          name:            'usertype-dev',
          ownerReferences: [{
            apiVersion: 'customization.ui.rancher/v1', kind: 'UserType', name: 'dev', uid: 'uid-1'
          }]
        },
        displayName: 'User Type: Developer',
        rules:       [{
          apiGroups: ['customization.ui.rancher'], resources: ['usertypes'], resourceNames: ['dev'], verbs: ['have']
        }]
      }));
      expect(created[0]._save).toHaveBeenCalledTimes(1);
    });

    it('should not create a global role when finding it fails for another reason', async() => {
      const { userType, created } = userTypeWithStore({ findRole: () => Promise.reject({ status: 403 }) }); // eslint-disable-line prefer-promise-reject-errors

      await expect(userType.ensureGlobalRole()).rejects.toStrictEqual({ status: 403 });
      expect(created).toHaveLength(0);
    });
  });

  describe('assignedPrincipalIds', () => {
    it('should find the bindings labelled with the user type, without touching the store', async() => {
      const { userType, dispatch } = userTypeWithStore();

      await userType.assignedPrincipalIds();

      expect(dispatch).toHaveBeenCalledWith('management/findLabelSelector', {
        type:     MANAGEMENT.GLOBAL_ROLE_BINDING,
        matching: { labelSelector: { matchLabels: { [USER_TYPE_LABEL]: 'dev' } } },
        opt:      { transient: true },
      }, { root: true });
    });

    it('should return the user and group principal of each binding', async() => {
      const { userType } = userTypeWithStore({
        bindings: [
          binding({ userPrincipalName: 'local://u-alice' }),
          binding({ groupPrincipalName: 'github_org://devops' }),
          binding({ userName: 'u-bob' }),
        ]
      });

      expect(await userType.assignedPrincipalIds()).toStrictEqual(['local://u-alice', 'github_org://devops']);
    });
  });

  describe('assignPrincipals', () => {
    it('should bind added principals, unbind removed ones and leave the rest', async() => {
      const kept = binding({ groupPrincipalName: 'github_org://devops' });
      const removed = binding({ userPrincipalName: 'local://u-alice' });
      const noPrincipal = binding({ userName: 'u-bob' });
      const { userType, created } = userTypeWithStore({ bindings: [kept, removed, noPrincipal] });

      await userType.assignPrincipals(['github_org://devops', 'github_user://123']);

      expect(created).toHaveLength(1);
      expect(created[0]).toStrictEqual(expect.objectContaining({
        type:              MANAGEMENT.GLOBAL_ROLE_BINDING,
        metadata:          { generateName: 'grb-', labels: { [USER_TYPE_LABEL]: 'dev' } },
        globalRoleName:    'usertype-dev',
        userPrincipalName: 'github_user://123',
      }));
      expect(created[0]._save).toHaveBeenCalledWith({ redirectUnauthorized: false });
      expect(removed.remove).toHaveBeenCalledWith({ redirectUnauthorized: false });
      expect(kept.remove).not.toHaveBeenCalled();
      expect(noPrincipal.remove).not.toHaveBeenCalled();
    });

    it('should bind a group principal as a group', async() => {
      const { userType, created } = userTypeWithStore();

      await userType.assignPrincipals(['github_org://devops']);

      const groupBinding = created.find((c) => c.type === MANAGEMENT.GLOBAL_ROLE_BINDING);

      expect(groupBinding.groupPrincipalName).toBe('github_org://devops');
      expect(groupBinding.userPrincipalName).toBeUndefined();
    });

    it('should look the principal up with its id encoded in the url', async() => {
      const { userType, dispatch } = userTypeWithStore();

      await userType.assignPrincipals(['local://u-alice']);

      expect(dispatch).toHaveBeenCalledWith('rancher/find', {
        type: NORMAN.PRINCIPAL,
        id:   'local://u-alice',
        opt:  { url: '/v3/principals/local%3A%2F%2Fu-alice' }
      }, { root: true });
    });
  });
});
