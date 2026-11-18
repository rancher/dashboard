import Principal from '@shell/models/principal';

// NormanModel is JS, so type the constructor to accept a plain data object.
const PrincipalModel = Principal as unknown as new (data: object) => Principal;

describe('class Principal', () => {
  describe('avatarSrc', () => {
    it('should use the github profile picture (sized) when one is set', () => {
      const principal = new PrincipalModel({
        id: 'github_user://123', provider: 'github', profilePicture: 'https://avatars.example/u/123.png'
      });

      expect(principal.avatarSrc).toStrictEqual('https://avatars.example/u/123.png?s=80');
    });

    // Regression: principals resolved from the user list (Principal.vue's fallback) are
    // github but carry no profilePicture. avatarSrc must not call addParam(undefined) -
    // it should fall back to a generated identicon rather than throwing and blanking the row.
    it('should fall back to a generated identicon for a github principal without a picture', () => {
      const principal = new PrincipalModel({ id: 'github_user://123', provider: 'github' });

      expect(() => principal.avatarSrc).not.toThrow();
      expect(principal.avatarSrc).toMatch(/^data:image\/png;base64,/);
    });

    it('should use a generated identicon for non-github providers', () => {
      const principal = new PrincipalModel({ id: 'local://u-abc', provider: 'local' });

      expect(principal.avatarSrc).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('displayType', () => {
    const labels: Record<string, string> = {
      'model.authConfig.provider."github"': 'GitHub',
      'model.authConfig.provider."local"':  'Local',
    };
    const rootGetters = { 'i18n/withFallback': (key: string, _: unknown, fallback: string) => labels[key] || fallback };
    const create = (data: object) => new (Principal as unknown as new (data: object, ctx: object) => Principal)(data, { rootGetters });

    it.each([
      ['github_user://123', 'github', 'GitHub User'],
      ['github-2_user://123', 'github', 'GitHub User (github-2)'],
      ['github-2_team://456', 'github', 'GitHub Team (github-2)'],
    ])('should label %s as %s', (id, provider, expected) => {
      expect(create({ id, provider }).displayType).toStrictEqual(expected);
    });

    it('should not name the config of a local principal', () => {
      expect(create({ id: 'local://u-abc', provider: 'local' }).displayType.trim()).toStrictEqual('Local');
    });
  });
});
