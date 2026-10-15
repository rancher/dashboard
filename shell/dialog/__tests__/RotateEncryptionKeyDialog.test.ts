import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { createStore } from 'vuex';
import RotateEncryptionKeyDialog from '@shell/dialog/RotateEncryptionKeyDialog.vue';
import { OPERATION } from '@shell/config/types';
import { createOperationCR } from '@shell/utils/operation-cr';
import { Banner } from '@components/Banner';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));

const mockUseFetch = jest.fn();

jest.mock('@shell/components/Resource/Detail/FetchLoader/composables', () => ({ useFetch: (...args: any[]) => mockUseFetch(...args) }));

// Global test-suite mock in jest.setup.js: t(key, options) => `${key}${options ? `-${JSON.stringify(options)}` : ''}`
const t = (key: string, args?: any) => `${ key }${ args ? `-${ JSON.stringify(args) }` : '' }`;

describe('component: RotateEncryptionKeyDialog', () => {
  const createTestStore = () => createStore({
    getters: {
      'prefs/get': () => (key: string) => (key.includes('date') ? 'YYYY-MM-DD' : 'HH:mm:ss'),
      isRancher:   () => true,
    },
    actions: { 'management/findAll': jest.fn() }
  });

  const createWrapper = (cluster: any, useFetchState: any = {}) => {
    mockUseFetch.mockImplementation(() => ref({
      loading:    false,
      refreshing: false,
      data:       [],
      refresh:    jest.fn(),
      ...useFetchState,
    }));

    const store = createTestStore();

    jest.spyOn(store, 'dispatch');

    const modal = { show: true, onClose: jest.fn() };
    const wrapper = shallowMount(RotateEncryptionKeyDialog, {
      props:  { cluster, modal },
      global: {
        plugins: [store],
        // shallowMount's own RcModal stub drops its slots, hiding the dialog body and footer buttons
        stubs:   { RcModal: { template: '<div><slot /><slot name="actions" :cancel="() => {}" :primary-action="() => {}" /></div>' } }
      },
    });

    return {
      store, wrapper, modal, vm: wrapper.vm as any
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('states', () => {
    it('warns and disables Rotate Keys when there is no snapshot', () => {
      const { wrapper } = createWrapper({}, { data: [] });
      const vm = wrapper.vm as any;

      expect(vm.latestBackup).toBeNull();
      expect(vm.warningMessage).toBe(t('promptRotateEncryptionKey.warning.noBackup'));
      expect(vm.showTakeSnapshot).toBe(true);
      expect(vm.rotateDisabled).toBe(true);
    });

    it('warns but allows rotation when the latest snapshot is stale', () => {
      const created = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
      const { wrapper } = createWrapper({}, { data: [{ id: 'fleet-default/snap-1:abc', snapshotFile: { createdAt: created } }] });
      const vm = wrapper.vm as any;

      expect(vm.latestBackup).toStrictEqual({ name: 'fleet-default/snap-1', created });
      expect(vm.warningMessage).toBe(t('promptRotateEncryptionKey.warning.outdated', { days: 9 }));
      expect(vm.showTakeSnapshot).toBe(true);
      expect(vm.rotateDisabled).toBe(false);
    });

    it('shows no warning and no take-snapshot button when the latest snapshot is recent', () => {
      const created = new Date(Date.now() - 14 * 60 * 1000).toISOString();
      const { wrapper } = createWrapper({}, { data: [{ id: 'fleet-default/snap-1:abc', snapshotFile: { createdAt: created } }] });
      const vm = wrapper.vm as any;

      expect(vm.latestBackup).toStrictEqual({ name: 'fleet-default/snap-1', created });
      expect(vm.warningMessage).toBe('');
      expect(vm.showTakeSnapshot).toBe(false);
      expect(vm.rotateDisabled).toBe(false);
    });

    it('picks the most recent of several snapshots', () => {
      const older = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const newer = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      const { wrapper } = createWrapper({}, {
        data: [
          { id: 'fleet-default/older:abc', snapshotFile: { createdAt: older } },
          { id: 'fleet-default/newer:def', snapshotFile: { createdAt: newer } },
        ]
      });
      const vm = wrapper.vm as any;

      expect(vm.latestBackup.name).toBe('fleet-default/newer');
    });

    it('reads the date from snapshotFile.createdAt, not the resource\'s own top-level created', () => {
      // Regression test: the resource's own `created` (when the k8s object was made) is
      // not when the snapshot content was actually taken -- using it made LiveDate show
      // "-" against a real backend, since real snapshot resources don't reliably set it.
      const createdAt = new Date(Date.now() - 14 * 60 * 1000).toISOString();
      const { wrapper } = createWrapper({}, {
        data: [{
          id:           'fleet-default/snap-1:abc',
          created:      '2020-01-01T00:00:00.000Z',
          snapshotFile: { createdAt }
        }]
      });
      const vm = wrapper.vm as any;

      expect(vm.latestBackup.created).toBe(createdAt);
    });
  });

  describe('footer', () => {
    const recentSnapshot = () => [{ id: 'fleet-default/snap-1:abc', snapshotFile: { createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString() } }];

    it('offers Take Snapshot and a disabled Rotate Keys when there is no snapshot', () => {
      const { wrapper } = createWrapper({}, { data: [] });

      expect(wrapper.find('[data-testid="rotate-encryption-key-take-snapshot"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rotate-encryption-key-rotate"]').attributes('disabled')).toBe('true');
    });

    it('hides Take Snapshot and enables Rotate Keys when the latest snapshot is recent', () => {
      const { wrapper } = createWrapper({}, { data: recentSnapshot() });

      expect(wrapper.find('[data-testid="rotate-encryption-key-take-snapshot"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rotate-encryption-key-rotate"]').attributes('disabled')).toBe('false');
    });

    it('disables Rotate Keys while snapshots are loading', () => {
      const { vm } = createWrapper({}, { loading: true, data: recentSnapshot() });

      expect(vm.rotateDisabled).toBe(true);
    });
  });

  describe('rotate', () => {
    const recentSnapshot = () => [{ id: 'fleet-default/snap-1:abc', snapshotFile: { createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString() } }];

    const importedCluster = () => ({
      isImportedWithDayTwoOps: true,
      mgmt:                    { id: 'c-m-1' },
      save:                    jest.fn(),
      spec:                    { rkeConfig: {} }
    });

    it('should create operation CR for imported day 2 ops clusters', async() => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);

      const cluster = importedCluster();
      const { store, modal, vm } = createWrapper(cluster, { data: recentSnapshot() });

      await vm.rotate();

      expect(createOperationCR).toHaveBeenCalledWith(store.dispatch, OPERATION.ENCRYPTION_KEY_ROTATE, {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       'c-m-1',
        }
      }, 'c-m-1', 'c-m-1', { notifyGeneratedName: true });
      expect(cluster.save).not.toHaveBeenCalled();
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });

    it('should keep the dialog open with the error when the operation CR cannot be created', async() => {
      (createOperationCR as jest.Mock).mockRejectedValue({ status: 403, message: 'forbidden' });

      const { wrapper, modal, vm } = createWrapper(importedCluster(), { data: recentSnapshot() });

      await vm.rotate();
      await wrapper.vm.$nextTick();

      const banner = wrapper.findAllComponents(Banner).find((b) => b.props('color') === 'error');

      expect(vm.errors).toStrictEqual(['forbidden']);
      expect(vm.rotating).toBe(false);
      expect(banner?.props('label')).toBe('forbidden');
      expect(modal.onClose).not.toHaveBeenCalled();
    });

    it('should update generation and save for non-day-2 clusters', async() => {
      const save = jest.fn().mockResolvedValue(undefined);
      const cluster = {
        isImportedWithDayTwoOps: false,
        mgmt:                    { id: 'c-m-1' },
        save,
        spec:                    { rkeConfig: { rotateEncryptionKeys: { generation: 4 } } }
      };
      const { modal, vm } = createWrapper(cluster, { data: recentSnapshot() });

      await vm.rotate();

      expect(createOperationCR).not.toHaveBeenCalled();
      expect(cluster.spec.rkeConfig.rotateEncryptionKeys.generation).toBe(5);
      expect(save).toHaveBeenCalledWith();
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });

    it('should surface errors and not close the dialog', async() => {
      const error = new Error('nope');
      const cluster = {
        isImportedWithDayTwoOps: false,
        spec:                    { rkeConfig: { rotateEncryptionKeys: { generation: 0 } } },
        save:                    jest.fn().mockRejectedValue(error),
      };
      const { modal, vm } = createWrapper(cluster, { data: recentSnapshot() });

      await vm.rotate();

      // exceptionToErrorsArray passes a plain Error through as-is, rather than its message
      expect(vm.errors).toStrictEqual([error]);
      expect(modal.onClose).not.toHaveBeenCalled();
    });

    it('refuses to close, and to rotate again, while a rotation is in flight', async() => {
      let finish: (value?: unknown) => void = () => {};

      (createOperationCR as jest.Mock).mockReturnValue(new Promise((resolve) => {
        finish = resolve;
      }));

      const { modal, vm } = createWrapper(importedCluster(), { data: recentSnapshot() });
      const pending = vm.rotate();

      expect(vm.rotating).toBe(true);
      expect(vm.rotateDisabled).toBe(true);

      vm.close();
      await vm.rotate();

      expect(modal.onClose).not.toHaveBeenCalled();
      expect(createOperationCR).toHaveBeenCalledTimes(1);

      finish();
      await pending;

      expect(vm.rotating).toBe(false);
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });

    it('does nothing while there is no snapshot to fall back on', async() => {
      const cluster = importedCluster();
      const { modal, vm } = createWrapper(cluster, { data: [] });

      await vm.rotate();

      expect(createOperationCR).not.toHaveBeenCalled();
      expect(cluster.save).not.toHaveBeenCalled();
      expect(modal.onClose).not.toHaveBeenCalled();
    });
  });

  describe('takeSnapshot', () => {
    it('starts the snapshot and closes the dialog without waiting for it to complete', () => {
      const cluster = { snapshotAction: jest.fn() };
      const { modal, vm } = createWrapper(cluster);

      vm.takeSnapshot();

      expect(cluster.snapshotAction).toHaveBeenCalledWith();
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
