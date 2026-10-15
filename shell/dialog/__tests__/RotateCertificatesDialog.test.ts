import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import RotateCertificatesDialog from '@shell/dialog/RotateCertificatesDialog.vue';
import { OPERATION } from '@shell/config/types';
import { createOperationCR } from '@shell/utils/operation-cr';
import { Banner } from '@components/Banner';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));

// Global test-suite mock in jest.setup.js: t(key, options) => `${key}${options ? `-${JSON.stringify(options)}` : ''}`
const t = (key: string, args?: any) => `${ key }${ args ? `-${ JSON.stringify(args) }` : '' }`;

const RKE2_SERVICES = [
  'admin',
  'api-server',
  'auth-proxy',
  'cloud-controller',
  'controller-manager',
  'etcd',
  'kube-proxy',
  'kubelet',
  'rke2-controller',
  'rke2-server',
  'scheduler',
];

// Imported clusters with day 2 ops can also rotate the supervisor certificate
const IMPORTED_RKE2_SERVICES = [...RKE2_SERVICES, 'supervisor'];

describe('component: RotateCertificatesDialog', () => {
  const createWrapper = (cluster: any) => {
    const store = createStore({});

    jest.spyOn(store, 'dispatch');

    const modal = { show: true, onClose: jest.fn() };
    const wrapper = shallowMount(RotateCertificatesDialog, {
      props:  { cluster, modal },
      global: {
        plugins: [store],
        // shallowMount's own RcModal stub drops its slots, hiding the dialog body and Rotate button
        stubs:   { RcModal: { template: '<div><slot /><slot name="primary-action" :primary-action="() => {}" /></div>' } }
      },
    });

    return {
      store, wrapper, modal, vm: wrapper.vm as any
    };
  };

  const importedCluster = () => ({
    isImportedWithDayTwoOps: true,
    isRke2:                  false,
    mgmt:                    { id: 'c-m-1' },
    save:                    jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('service options', () => {
    it.each([
      ['an RKE2 cluster', { isRke2: true }, RKE2_SERVICES],
      ['an imported cluster with day 2 ops', { isImportedWithDayTwoOps: true }, IMPORTED_RKE2_SERVICES],
    ])('lists the rke2 services, sorted, for %s', (_, cluster, services) => {
      const { vm } = createWrapper(cluster);

      expect(vm.serviceNames).toStrictEqual(services);
    });

    it('lists the k3s services instead of the rke2 ones for a K3s cluster', () => {
      const { vm } = createWrapper({ isImportedWithDayTwoOps: true, isK3s: true });

      expect(vm.serviceNames).toContain('k3s-controller');
      expect(vm.serviceNames).toContain('k3s-server');
      expect(vm.serviceNames).not.toContain('rke2-server');
    });
  });

  describe('states', () => {
    it('defaults to all services, with the service select hidden and Rotate enabled', () => {
      const { wrapper, vm } = createWrapper(importedCluster());

      expect(vm.rotateAllServices).toBe(true);
      expect(wrapper.find('[data-testid="rotate-certificates-services"]').exists()).toBe(false);
      expect(vm.rotateDisabled).toBe(false);
    });

    it('reveals the service select and disables Rotate while no service is chosen', async() => {
      const { wrapper, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="rotate-certificates-services"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rotate-certificates-reset"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rotate-certificates-summary"]').exists()).toBe(false);
      expect(vm.rotateDisabled).toBe(true);
    });

    it('enables Rotate and shows Reset and the selection summary once services are chosen', async() => {
      const { wrapper, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      vm.selectedServices = ['api-server', 'etcd'];
      await wrapper.vm.$nextTick();

      expect(vm.rotateDisabled).toBe(false);
      expect(wrapper.find('[data-testid="rotate-certificates-reset"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rotate-certificates-summary"]').text()).toBe(t('cluster.rotateCertificates.selectionSummary', { count: 2, total: IMPORTED_RKE2_SERVICES.length }));
    });

    it('clears the selection on Reset', async() => {
      const { wrapper, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      vm.selectedServices = ['api-server', 'etcd'];
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="rotate-certificates-reset"]').trigger('click');

      expect(vm.selectedServices).toStrictEqual([]);
      expect(vm.rotateDisabled).toBe(true);
    });

    it.each([
      [['api-server'], 0],
      [['api-server', 'etcd', 'kubelet'], 0],
      [['api-server', 'etcd', 'kubelet', 'admin', 'scheduler'], 2],
    ])('collapses %p beyond the first three tokens into %p more', (selected, hidden) => {
      const { vm } = createWrapper(importedCluster());

      vm.selectedServices = selected;

      expect(vm.hiddenTokenCount).toBe(hidden);
    });
  });

  describe('rotate', () => {
    it('creates a certificate rotation operation CR for all services on an imported day 2 ops cluster', async() => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);

      const cluster = importedCluster();
      const { store, modal, vm } = createWrapper(cluster);

      await vm.rotate();

      expect(createOperationCR).toHaveBeenCalledWith(store.dispatch, OPERATION.CERTIFICATE_ROTATE, {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       'c-m-1',
        }
      }, 'c-m-1', 'c-m-1', { notifyGeneratedName: true });
      expect(cluster.save).not.toHaveBeenCalled();
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });

    it('passes only the selected services to the operation CR', async() => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);

      const { store, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      vm.selectedServices = ['api-server', 'etcd'];
      await vm.rotate();

      expect(createOperationCR).toHaveBeenCalledWith(store.dispatch, OPERATION.CERTIFICATE_ROTATE, {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       'c-m-1',
        },
        args: { services: ['api-server', 'etcd'] }
      }, 'c-m-1', 'c-m-1', { notifyGeneratedName: true });
    });

    it('ignores a leftover selection once the user switches back to all services', async() => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);

      const { store, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      vm.selectedServices = ['etcd'];
      vm.rotateAllServices = true;
      await vm.rotate();

      expect(createOperationCR).toHaveBeenCalledWith(store.dispatch, OPERATION.CERTIFICATE_ROTATE, {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       'c-m-1',
        }
      }, 'c-m-1', 'c-m-1', { notifyGeneratedName: true });
    });

    it('keeps the dialog open and shows the error when the operation CR cannot be created', async() => {
      (createOperationCR as jest.Mock).mockRejectedValue({ status: 403, message: 'forbidden' });

      const { wrapper, modal, vm } = createWrapper(importedCluster());

      await vm.rotate();
      await wrapper.vm.$nextTick();

      const banner = wrapper.findComponent(Banner);

      expect(vm.rotating).toBe(false);
      expect(modal.onClose).not.toHaveBeenCalled();
      expect(banner.exists()).toBe(true);
      expect(banner.props('label')).toBe('forbidden');
    });

    it('refuses to close, and to rotate again, while a rotation is in flight', async() => {
      let finish: (value?: unknown) => void = () => {};

      (createOperationCR as jest.Mock).mockReturnValue(new Promise((resolve) => {
        finish = resolve;
      }));

      const { modal, vm } = createWrapper(importedCluster());
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

    it('does nothing while Rotate is disabled', async() => {
      const { modal, vm } = createWrapper(importedCluster());

      vm.rotateAllServices = false;
      await vm.rotate();

      expect(createOperationCR).not.toHaveBeenCalled();
      expect(modal.onClose).not.toHaveBeenCalled();
    });

    it.each([
      ['all services', true, [], []],
      ['the selected services', false, ['etcd', 'kubelet'], ['etcd', 'kubelet']],
    ])('bumps the rotateCertificates generation with %s and saves an RKE2 cluster', async(_, all, selected, expected) => {
      const save = jest.fn().mockResolvedValue(undefined);
      const cluster = {
        isRke2: true, save, spec: { rkeConfig: { rotateCertificates: { generation: 2 } } }
      };
      const { modal, vm } = createWrapper(cluster);

      vm.rotateAllServices = all;
      vm.selectedServices = selected;
      await vm.rotate();

      expect(createOperationCR).not.toHaveBeenCalled();
      expect(cluster.spec.rkeConfig.rotateCertificates).toStrictEqual({ generation: 3, services: expected });
      expect(save).toHaveBeenCalledWith();
      expect(modal.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
