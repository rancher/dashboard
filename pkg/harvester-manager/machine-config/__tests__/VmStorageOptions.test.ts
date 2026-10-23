import { shallowMount } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import VmStorageOptions from '@pkg/harvester-manager/machine-config/VmStorageOptions.vue';
import { DEFAULT_IO_THREAD_COUNT, UNSET_IO_THREAD_COUNT } from '@pkg/harvester-manager/machine-config/storage-options';

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));
jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({}) }));

interface VmStorageOptionsVm {
  setIoThreadsPolicy: (policy: string) => void;
}

describe('component: VmStorageOptions', () => {
  const createWrapper = (props = {}) => shallowMount(VmStorageOptions, { props });
  const vmOf = (wrapper: ReturnType<typeof createWrapper>) => wrapper.vm as unknown as VmStorageOptionsVm;

  it('should show the multi-queue and policy fields', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="vm-storage-options-block-multi-queue"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="vm-storage-options-io-threads-policy"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toStrictEqual(false);
  });

  it('should show the thread count for the supplemental pool policy', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toStrictEqual(true);
  });

  it('should only accept whole numbers of at least 1 as the thread count', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });
    const input = wrapper.findComponent(LabeledInput);

    expect(input.props('type')).toStrictEqual('integer');
    expect(input.attributes('min')).toStrictEqual('1');
  });

  it.each([
    ['', 'no count'],
    ['0', 'the schema default'],
  ])('should default the thread count when the supplemental pool policy is picked with %p (%s)', (ioThreadCount) => {
    const wrapper = createWrapper({ ioThreadCount });

    vmOf(wrapper).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['supplementalPool']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([[DEFAULT_IO_THREAD_COUNT]]);
  });

  it('should keep an existing thread count when the supplemental pool policy is picked', () => {
    const wrapper = createWrapper({ ioThreadCount: '8' });

    vmOf(wrapper).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadCount')).toBeUndefined();
  });

  it('should reset the thread count to the schema default when another policy is picked', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    vmOf(wrapper).setIoThreadsPolicy('auto');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['auto']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([[UNSET_IO_THREAD_COUNT]]);
  });

  it('should leave the stored count unchanged after picking the supplemental pool policy and going back', async() => {
    const wrapper = createWrapper({ ioThreadCount: '0' });

    vmOf(wrapper).setIoThreadsPolicy('supplementalPool');
    await wrapper.setProps({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: DEFAULT_IO_THREAD_COUNT });
    vmOf(wrapper).setIoThreadsPolicy('');

    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([[DEFAULT_IO_THREAD_COUNT], [UNSET_IO_THREAD_COUNT]]);
  });

  it('should leave the schema default count alone when another policy is picked', () => {
    const wrapper = createWrapper({ ioThreadCount: '0' });

    vmOf(wrapper).setIoThreadsPolicy('auto');

    expect(wrapper.emitted('update:ioThreadCount')).toBeUndefined();
  });

  it('should emit the thread count as a string', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '2' });

    wrapper.findComponent(LabeledInput).vm.$emit('update:value', 6);

    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([['6']]);
  });

  it('should emit multi-queue changes', () => {
    const wrapper = createWrapper();

    wrapper.findComponent(Checkbox).vm.$emit('update:value', true);

    expect(wrapper.emitted('update:blockMultiQueue')).toStrictEqual([[true]]);
  });

  it('should explain the shared policy when a disk has a dedicated io thread and no policy is set', () => {
    const wrapper = createWrapper({ hasDedicatedIoThread: true });
    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toStrictEqual(true);
    expect(banner.attributes().label).toStrictEqual('%cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.sharedTip%');
  });
});
