import User from '@shell/models/management.cattle.io.user';

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
});
