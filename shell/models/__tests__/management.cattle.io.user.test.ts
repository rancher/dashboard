import User from '@shell/models/management.cattle.io.user';
import { USER_TYPE_LABEL } from '@shell/models/customization.ui.rancher.usertype';
import { CUSTOMIZATION, MANAGEMENT } from '@shell/config/types';

describe('class User', () => {
  const labels: Record<string, string> = {
    'model.authConfig.provider."github"':   'GitHub',
    'model.authConfig.provider."local"':    'Local',
    'model.authConfig.provider."multiple"': 'Multiple',
    'model.authConfig.provider."system"':   'System',
  };
  const drivers: Record<string, object> = {
    github:     { id: 'github', type: 'githubProvider' },
    'github-2': { id: 'github-2', type: 'githubProvider' },
  };
  const rootGetters = {
    'i18n/withFallback': (key: string, _: unknown, fallback: string) => labels[key] || fallback,
    'rancher/byId':      (type: string, id: string) => (type === 'authProvider' ? drivers[id] : undefined),
  };

  const create = (principalIds: string[]) => new (User as unknown as new (data: object, ctx: object) => User)({ principalIds }, { rootGetters });

  describe('provider', () => {
    it.each([
      [['local://u-abc'], 'local'],
      [['system://provisioning', 'local://u-abc'], 'system'],
      [['github_user://1', 'local://u-abc'], 'github'],
      [['github-2_user://1', 'local://u-abc'], 'github'],
      [['github_user://1', 'github-2_user://1'], 'multiple'],
      [['okta-3_user://1'], 'okta-3'],
    ])('should resolve %j to %s', (principalIds, expected) => {
      expect(create(principalIds).provider).toStrictEqual(expected);
    });
  });

  describe('providerDisplay', () => {
    it.each([
      [['local://u-abc'], 'Local'],
      [['github_user://1', 'local://u-abc'], 'GitHub'],
      [['github-2_user://1', 'local://u-abc'], 'GitHub (github-2)'],
      [['github_user://1', 'github-2_user://1'], 'Multiple'],
    ])('should display %j as %s', (principalIds, expected) => {
      expect(create(principalIds).providerDisplay).toStrictEqual(expected);
    });

    it('should sort a named config after the provider it belongs to', () => {
      const names = [create(['github-2_user://1']), create(['github_user://2'])].map((user) => user.providerDisplay).sort();

      expect(names).toStrictEqual(['GitHub', 'GitHub (github-2)']);
    });
  });

  describe('fetchGroupPrincipals', () => {
    const OPS_GROUP = 'openldap_group://cn=ops,ou=Groups,dc=example,dc=test';
    const DEV_TEAM = 'github_team://1234';

    const createWithStore = ({ schema = {} as object | null, find = jest.fn() } = {}) => new (User as unknown as new (data: object, ctx: object) => User)({ id: 'u-alice', principalIds: [] }, {
      rootGetters,
      getters:  { schemaFor: (type: string) => (type === MANAGEMENT.USER_ATTRIBUTE ? schema : null) },
      dispatch: find,
    });

    it('should map every provider\'s groups to their display name', async() => {
      const find = jest.fn().mockResolvedValue({
        GroupPrincipals: {
          local:    { Items: null },
          openldap: { Items: [{ metadata: { name: OPS_GROUP }, displayName: 'ops' }] },
          github:   { Items: [{ metadata: { name: DEV_TEAM }, loginName: 'dev-team' }] },
        }
      });

      const groups = await createWithStore({ find }).fetchGroupPrincipals();

      expect(find).toHaveBeenCalledWith('find', { type: MANAGEMENT.USER_ATTRIBUTE, id: 'u-alice' });
      expect(groups).toStrictEqual({ [OPS_GROUP]: 'ops', [DEV_TEAM]: 'dev-team' });
    });

    it('should fall back to the principal id when a group has no name', async() => {
      const find = jest.fn().mockResolvedValue({ GroupPrincipals: { openldap: { Items: [{ metadata: { name: OPS_GROUP } }] } } });

      expect(await createWithStore({ find }).fetchGroupPrincipals()).toStrictEqual({ [OPS_GROUP]: OPS_GROUP });
    });

    it('should return no groups when the viewer cannot see UserAttributes', async() => {
      const find = jest.fn();

      expect(await createWithStore({ schema: null, find }).fetchGroupPrincipals()).toStrictEqual({});
      expect(find).not.toHaveBeenCalled();
    });

    it('should return no groups when the user has no UserAttribute', async() => {
      const find = jest.fn().mockRejectedValue(new Error('not found'));

      expect(await createWithStore({ find }).fetchGroupPrincipals()).toStrictEqual({});
    });
  });

  describe('fetchAssignedUserTypes', () => {
    const OPS_GROUP = 'github_team://1';
    const OTHER_GROUP = 'github_team://2';
    const MY_PRINCIPAL = 'github_user://10';

    const userType = (name: string) => ({ metadata: { name } });
    const binding = (userType: string, principal: { userPrincipalName?: string, groupPrincipalName?: string }) => ({ metadata: { labels: { [USER_TYPE_LABEL]: userType } }, ...principal });

    const createWithBindings = (bindings: object[], userTypes = [userType('dev'), userType('ops'), userType('other')]) => {
      const dispatch = jest.fn((action: string) => Promise.resolve(action === 'findLabelSelector' ? { data: bindings } : userTypes));
      const user = new (User as unknown as new (data: object, ctx: object) => User)({ id: 'u-alice', principalIds: ['local://u-alice', MY_PRINCIPAL] }, {
        rootGetters, getters: {}, dispatch
      });

      return { user, dispatch };
    };

    const assigned = (result: { userType: { metadata: { name: string } }, direct: boolean, groups: string[] }[]) => result.map(({ userType, direct, groups }) => ({
      name: userType.metadata.name, direct, groups
    }));

    it('should find a user type bound to one of the user\'s principals as direct', async() => {
      const { user } = createWithBindings([binding('dev', { userPrincipalName: MY_PRINCIPAL })]);

      expect(assigned(await user.fetchAssignedUserTypes({}))).toStrictEqual([{
        name: 'dev', direct: true, groups: []
      }]);
    });

    it('should find a user type bound to one of the user\'s groups, by the group\'s name', async() => {
      const { user } = createWithBindings([binding('ops', { groupPrincipalName: OPS_GROUP })]);

      expect(assigned(await user.fetchAssignedUserTypes({ [OPS_GROUP]: 'ops-team' }))).toStrictEqual([{
        name: 'ops', direct: false, groups: ['ops-team']
      }]);
    });

    it('should list a user type bound both ways once, with every way', async() => {
      const { user } = createWithBindings([
        binding('dev', { userPrincipalName: MY_PRINCIPAL }),
        binding('dev', { groupPrincipalName: OPS_GROUP }),
      ]);

      expect(assigned(await user.fetchAssignedUserTypes({ [OPS_GROUP]: 'ops-team' }))).toStrictEqual([{
        name: 'dev', direct: true, groups: ['ops-team']
      }]);
    });

    it('should ignore bindings to another user\'s principal or another group, and bindings for an unknown user type', async() => {
      const { user } = createWithBindings([
        binding('dev', { userPrincipalName: 'github_user://99' }),
        binding('ops', { groupPrincipalName: OTHER_GROUP }),
        binding('gone', { userPrincipalName: MY_PRINCIPAL }),
      ]);

      expect(await user.fetchAssignedUserTypes({ [OPS_GROUP]: 'ops-team' })).toStrictEqual([]);
    });

    it('should ask for the user type bindings by label, without keeping them in the store', async() => {
      const { user, dispatch } = createWithBindings([]);

      await user.fetchAssignedUserTypes({});

      expect(dispatch).toHaveBeenCalledWith('findLabelSelector', {
        type:     MANAGEMENT.GLOBAL_ROLE_BINDING,
        matching: { labelSelector: { matchExpressions: [{ key: USER_TYPE_LABEL, operator: 'Exists' }] } },
        opt:      { transient: true },
      });
      expect(dispatch).toHaveBeenCalledWith('findAll', { type: CUSTOMIZATION.USER_TYPE });
    });
  });
});
