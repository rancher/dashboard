import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import { useClusterMembership, saveRoleBindings } from '@shell/composables/useClusterMembership';

jest.mock('@shell/components/form/Members/ClusterMembershipEditor.vue', () => ({ canViewClusterMembershipEditor: jest.fn() }));

const mockUseStore = jest.fn(() => ({ id: 'mock-store' }));

jest.mock('vuex', () => ({ useStore: () => mockUseStore() }));

const mockCanView = canViewClusterMembershipEditor as jest.Mock;

describe('composable: useClusterMembership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({ id: 'mock-store' });
  });

  describe('canManageMembers', () => {
    it('reflects canViewClusterMembershipEditor for the current store', () => {
      mockCanView.mockReturnValue(true);
      const { canManageMembers } = useClusterMembership();

      expect(canManageMembers.value).toBe(true);
      expect(mockCanView).toHaveBeenCalledWith({ id: 'mock-store' });
    });

    it('reflects false when the user cannot manage members', () => {
      mockCanView.mockReturnValue(false);
      const { canManageMembers } = useClusterMembership();

      expect(canManageMembers.value).toBe(false);
    });

    it('is false without throwing when no store is injected', () => {
      mockUseStore.mockReturnValue(undefined as any);
      const { canManageMembers } = useClusterMembership();

      expect(() => canManageMembers.value).not.toThrow();
      expect(canManageMembers.value).toBe(false);
      expect(mockCanView).not.toHaveBeenCalled();
    });
  });

  describe('onMembershipUpdate', () => {
    it('stages the emitted update', () => {
      const { onMembershipUpdate, membershipUpdate } = useClusterMembership();
      const update = {
        newBindings: [], removedBindings: [], save: jest.fn()
      };

      onMembershipUpdate(update);

      expect(membershipUpdate.value).toStrictEqual(update);
    });
  });

  describe('saveRoleBindings', () => {
    it('does nothing when there is no staged update with a save function', async() => {
      await expect(saveRoleBindings({}, 'cluster-id')).resolves.toBeUndefined();
    });

    it('calls the staged update\'s save with the given parent id', async() => {
      const save = jest.fn().mockResolvedValue(undefined);

      await saveRoleBindings({ save }, 'cluster-id');

      expect(save).toHaveBeenCalledWith('cluster-id');
    });
  });
});
