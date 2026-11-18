import roleDeletionCheck from '@shell/promptRemove/mixin/roleDeletionCheck';
import { MANAGEMENT } from '@shell/config/types';

describe('mixin: roleDeletionCheck', () => {
  const users = [
    {
      id: 'u-alice', username: 'alice', principalIds: ['local://u-alice', 'github_user://123']
    },
    {
      id: 'u-bob', username: 'bob', principalIds: ['local://u-bob']
    },
  ];

  // Calls the check with the mixin's state it reads: the store and i18n
  const check = async(bindings: object[]) => {
    const ctx = {
      warning: '',
      info:    '',
      t:       (key: string, args?: { count: number }) => (args ? `${ key }:${ args.count }` : key),
      $store:  { dispatch: jest.fn((action: string, { url }: { url: string }) => Promise.resolve({ data: url.endsWith(MANAGEMENT.USER) ? users : bindings })) },
    };

    await (roleDeletionCheck as any).methods.handleRoleDeletionCheck.call(ctx, [{ id: 'persona-dev' }], MANAGEMENT.GLOBAL_ROLE, '');

    return ctx;
  };

  it('should count a user bound to the role by one of their principals', async() => {
    const ctx = await check([{ globalRoleName: 'persona-dev', userPrincipalName: 'github_user://123' }]);

    expect(ctx.warning).toBe('rbac.globalRoles.usersBound:1');
  });

  it('should count a user bound by name and by principal once', async() => {
    const ctx = await check([
      { globalRoleName: 'persona-dev', userName: 'u-alice' },
      { globalRoleName: 'persona-dev', userPrincipalName: 'local://u-alice' },
      { globalRoleName: 'persona-dev', userPrincipalName: 'local://u-bob' },
    ]);

    expect(ctx.warning).toBe('rbac.globalRoles.usersBound:2');
  });

  it('should not count users bound to other roles', async() => {
    const ctx = await check([{ globalRoleName: 'other', userPrincipalName: 'local://u-alice' }]);

    expect(ctx.warning).toBe('');
  });
});
