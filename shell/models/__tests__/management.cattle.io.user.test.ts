import User from '@shell/models/management.cattle.io.user';
import { MANAGEMENT } from '@shell/config/types';

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
});
