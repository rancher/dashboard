import RoleDeletionCheck from '@shell/promptRemove/mixin/roleDeletionCheck';
import { MANAGEMENT } from '@shell/config/types';

describe('roleDeletionCheck mixin', () => {
  describe('handleRoleDeletionCheck', () => {
    it('should show "notBound" when no bindings exist', async() => {
      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: [] }) // role bindings
        .mockResolvedValueOnce({ data: [] }); // users

      const mockT = jest.fn().mockImplementation((key: string) => {
        if (key === 'rbac.globalRoles.notBound') {
          return 'No users or groups bound';
        }

        return key;
      });

      // Create a context object that mimics the component's `this`
      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.notBound', null, true);
      expect(context.info).toContain('No users or groups bound');
      expect(context.warning).toBe('');
    });

    it('should warn when only users are bound to roles', async() => {
      const roleBindings = [
        { globalRoleName: 'test-role', userName: 'user-1' },
        { globalRoleName: 'test-role', userName: 'user-2' }
      ];
      const users = [
        { id: 'user-1', username: 'admin' },
        { id: 'user-2', username: 'viewer' }
      ];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 2, groups: 0 });
      expect(context.warning).toContain('2 users');
      expect(context.warning).toContain('0 groups');
      expect(context.info).toBe('');
    });

    it('should warn when only groups are bound to roles', async() => {
      const roleBindings = [
        { globalRoleName: 'test-role', groupPrincipalName: 'github_team://123' },
        { globalRoleName: 'test-role', groupPrincipalName: 'github_team://456' }
      ];
      const users: any[] = [];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 0, groups: 2 });
      expect(context.warning).toContain('0 users');
      expect(context.warning).toContain('2 groups');
      expect(context.info).toBe('');
    });

    it('should warn when both users and groups are bound to roles', async() => {
      const roleBindings = [
        { globalRoleName: 'test-role', userName: 'user-1' },
        { globalRoleName: 'test-role', groupPrincipalName: 'github_team://123' }
      ];
      const users = [
        { id: 'user-1', username: 'admin' }
      ];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 1, groups: 1 });
      expect(context.warning).toContain('1 users');
      expect(context.warning).toContain('1 groups');
      expect(context.info).toBe('');
    });

    it('should count unique groups across multiple roles', async() => {
      const roleBindings = [
        { globalRoleName: 'role-1', groupPrincipalName: 'github_team://123' },
        { globalRoleName: 'role-2', groupPrincipalName: 'github_team://123' }, // same group, different role
        { globalRoleName: 'role-2', groupPrincipalName: 'github_team://456' }
      ];
      const users: any[] = [];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [
        { id: 'role-1', type: MANAGEMENT.GLOBAL_ROLE },
        { id: 'role-2', type: MANAGEMENT.GLOBAL_ROLE }
      ];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 0, groups: 2 });
      expect(context.warning).toContain('2 groups');
      expect(context.info).toBe('');
    });

    it('should handle single group bound to a role', async() => {
      const roleBindings = [
        { globalRoleName: 'test-role', groupPrincipalName: 'github_team://123' }
      ];
      const users: any[] = [];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 0, groups: 1 });
      expect(context.warning).toContain('1 groups');
      expect(context.info).toBe('');
    });

    it('should not count groups when binding has no groupPrincipalName', async() => {
      const roleBindings = [
        {
          globalRoleName: 'test-role', userName: 'user-1', groupPrincipalName: undefined
        },
        {
          globalRoleName: 'test-role', userName: 'user-2', groupPrincipalName: null
        }
      ];
      const users = [
        { id: 'user-1', username: 'admin' },
        { id: 'user-2', username: 'viewer' }
      ];

      const mockDispatch = jest.fn()
        .mockResolvedValueOnce({ data: roleBindings })
        .mockResolvedValueOnce({ data: users });

      const mockT = jest.fn().mockImplementation((key: string, params?: any) => {
        if (key === 'rbac.globalRoles.bound') {
          return `Caution: ${ params?.users } users and ${ params?.groups } groups bound`;
        }

        return key;
      });

      const context = {
        t:       mockT,
        warning: '',
        info:    '',
        $store:  { dispatch: mockDispatch },
      };

      const rolesToRemove = [{ id: 'test-role', type: MANAGEMENT.GLOBAL_ROLE }];

      await RoleDeletionCheck.methods.handleRoleDeletionCheck.call(context, rolesToRemove, MANAGEMENT.GLOBAL_ROLE, '');

      expect(mockT).toHaveBeenCalledWith('rbac.globalRoles.bound', { users: 2, groups: 0 });
      expect(context.warning).toContain('2 users');
      expect(context.warning).toContain('0 groups');
    });
  });
});
