import { shallowMount } from '@vue/test-utils';
import VmStorageOptions, { DEFAULT_IO_THREAD_COUNT } from '@pkg/harvester-manager/machine-config/VmStorageOptions.vue';

describe('component: VmStorageOptions', () => {
  const createWrapper = (props = {}) => shallowMount(VmStorageOptions, {
    props,
    global: { stubs: { InfoBox: { template: '<div><slot /></div>' } } }
  });

  it('should be collapsed when nothing is set', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="vm-storage-options-io-threads-policy"]').exists()).toBe(false);
  });

  it('should be expanded when a policy is set', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'auto' });

    expect(wrapper.find('[data-testid="vm-storage-options-io-threads-policy"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toBe(false);
  });

  it('should show the thread count for the supplemental pool policy', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toBe(true);
  });

  it('should be hidden in view mode when nothing is set', () => {
    const wrapper = createWrapper({ mode: 'view' });

    expect(wrapper.find('.vm-storage-options').exists()).toBe(false);
  });

  it('should default the thread count when the supplemental pool policy is picked', () => {
    const wrapper = createWrapper();

    (wrapper.vm as any).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['supplementalPool']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([[DEFAULT_IO_THREAD_COUNT]]);
  });

  it('should keep an existing thread count when the supplemental pool policy is picked', () => {
    const wrapper = createWrapper({ ioThreadCount: '8' });

    (wrapper.vm as any).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadCount')).toBeUndefined();
  });

  it('should clear the thread count when another policy is picked', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    (wrapper.vm as any).setIoThreadsPolicy('auto');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['auto']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([['']]);
  });

  it('should explain the shared policy when a disk has a dedicated io thread and no policy is set', async() => {
    const wrapper = createWrapper({ hasDedicatedIoThread: true });

    await wrapper.find('[data-testid="vm-storage-options-toggle"]').trigger('click');

    const banner = wrapper.findComponent({ name: 'Banner' });

    expect(banner.exists()).toBe(true);
    expect(banner.attributes().label).toStrictEqual('%cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.sharedTip%');
  });
});
