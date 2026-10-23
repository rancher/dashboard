import { shallowMount } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import DiskStorageOptions from '@pkg/harvester-manager/machine-config/DiskStorageOptions.vue';
import {
  Disk, PROFILE, applyPerformanceOptions, detectProfile, hasPerformanceOptions
} from '@pkg/harvester-manager/machine-config/storage-options';

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));
jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({}) }));

const HIGH_PERFORMANCE = {
  cache: 'none', io: 'native', dedicatedIOThread: true
};

interface DiskStorageOptionsVm {
  profile: string;
  cacheOptions: { value: string, disabled: boolean }[];
  setProfile: (profile: string) => void;
}

describe('component: DiskStorageOptions', () => {
  const createWrapper = (value: Disk = {}, mode = 'create') => shallowMount(DiskStorageOptions, { props: { value, mode } });
  const vmOf = (wrapper: ReturnType<typeof createWrapper>) => wrapper.vm as unknown as DiskStorageOptionsVm;

  describe('hasPerformanceOptions', () => {
    it.each([
      [{}, false],
      [{ cache: '' }, false],
      [{ cache: 'writeback' }, true],
      [{ io: 'threads' }, true],
      [{ dedicatedIOThread: true }, true],
    ])('should return the expected value for %p', (disk, expected) => {
      expect(hasPerformanceOptions(disk)).toStrictEqual(expected);
    });
  });

  describe('detectProfile', () => {
    it.each([
      [{ size: 40 }, PROFILE.DEFAULT],
      [HIGH_PERFORMANCE, PROFILE.HIGH],
      [{ cache: 'none', io: 'native' }, PROFILE.CUSTOM],
      [{ cache: 'writeback' }, PROFILE.CUSTOM],
    ])('should detect the profile of %p', (disk, expected) => {
      expect(detectProfile(disk)).toStrictEqual(expected);
    });
  });

  describe('applyPerformanceOptions', () => {
    it('should remove unset options so the disk is unchanged', () => {
      const disk = { imageName: 'default/ubuntu', size: 40 };

      expect(applyPerformanceOptions(disk, {
        cache: '', io: '', dedicatedIOThread: false
      })).toStrictEqual(disk);
    });

    it('should force cache mode none for native io', () => {
      expect(applyPerformanceOptions({ size: 10, cache: 'writeback' }, { io: 'native' })).toStrictEqual({
        size: 10, cache: 'none', io: 'native'
      });
    });

    it('should not mutate the given disk', () => {
      const disk = { size: 10 };

      applyPerformanceOptions(disk, { cache: 'none' });

      expect(disk).toStrictEqual({ size: 10 });
    });
  });

  it('should always show the profile, and the individual fields only for the custom profile', () => {
    const wrapper = createWrapper({ size: 40 });

    expect(wrapper.find('[data-testid="disk-storage-options-profile"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toStrictEqual(false);
  });

  it('should not show any options for a CD-ROM', () => {
    const wrapper = createWrapper({ type: 'cd-rom', size: 1 });

    expect(wrapper.find('[data-testid="disk-storage-options-profile"]').exists()).toStrictEqual(false);
  });

  it('should show the individual fields for a disk with custom options', () => {
    const wrapper = createWrapper({ size: 40, cache: 'writeback' });

    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="disk-storage-options-io"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="disk-storage-options-dedicated-iothread"]').exists()).toStrictEqual(true);
  });

  it('should emit the high performance options when that profile is picked', () => {
    const wrapper = createWrapper({ size: 40 });

    vmOf(wrapper).setProfile(PROFILE.HIGH);

    expect(wrapper.emitted('update:value')).toStrictEqual([[{ size: 40, ...HIGH_PERFORMANCE }]]);
  });

  it('should emit a disk without options when the default profile is picked', () => {
    const wrapper = createWrapper({ size: 40, ...HIGH_PERFORMANCE });

    vmOf(wrapper).setProfile(PROFILE.DEFAULT);

    expect(wrapper.emitted('update:value')).toStrictEqual([[{ size: 40 }]]);
  });

  it('should show the individual fields when custom is picked, before any of them is changed', async() => {
    const wrapper = createWrapper({ size: 40 });

    vmOf(wrapper).setProfile(PROFILE.CUSTOM);
    await wrapper.vm.$nextTick();

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.CUSTOM);
    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toStrictEqual(true);
    expect(wrapper.emitted('update:value')).toBeUndefined();
  });

  it('should keep the custom choice with its disk when another disk takes its place', async() => {
    const customDisk = { size: 40 };
    const otherDisk = { size: 10 };
    const wrapper = createWrapper(customDisk);

    vmOf(wrapper).setProfile(PROFILE.CUSTOM);
    await wrapper.setProps({ value: otherDisk });

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.DEFAULT);
    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toStrictEqual(false);

    await wrapper.setProps({ value: customDisk });

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.CUSTOM);
  });

  it('should show the saved profile of a disk that takes another disk\'s place', async() => {
    const wrapper = createWrapper({ size: 10 });

    await wrapper.setProps({ value: { size: 40, ...HIGH_PERFORMANCE } });

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.HIGH);
  });

  describe('disk bus', () => {
    interface ProfileOption { value: string, disabled: boolean }

    it.each([
      [undefined, false],
      ['virtio', false],
      ['sata', true],
      ['scsi', true],
    ])('with bus %p should block a dedicated I/O thread: %p', (bus, blocked) => {
      const wrapper = createWrapper({
        size: 40, bus, cache: 'writeback'
      });
      const high = (wrapper.vm as unknown as { profileOptions: ProfileOption[] }).profileOptions.find((o) => o.value === PROFILE.HIGH);

      expect(high?.disabled).toStrictEqual(blocked);
      expect(wrapper.find('[data-testid="disk-storage-options-bus-warning"]').exists()).toStrictEqual(blocked);
      expect(wrapper.findComponent(Checkbox).props('disabled')).toStrictEqual(blocked);
    });

    it('should still let a dedicated I/O thread set outside the form be turned off', () => {
      const wrapper = createWrapper({
        size: 40, bus: 'sata', cache: 'writeback', dedicatedIOThread: true
      });

      expect(wrapper.findComponent(Checkbox).props('disabled')).toStrictEqual(false);
    });

    it('should only warn about the bus once the disk uses an option', () => {
      const wrapper = createWrapper({ size: 40, bus: 'sata' });

      expect(wrapper.find('[data-testid="disk-storage-options-bus-warning"]').exists()).toStrictEqual(false);
    });
  });

  it('should stay on custom when the custom fields are set to the high performance values', async() => {
    const disk: Disk = { size: 40 };
    const wrapper = createWrapper(disk);

    vmOf(wrapper).setProfile(PROFILE.CUSTOM);
    await wrapper.setProps({ value: Object.assign(disk, HIGH_PERFORMANCE) });

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.CUSTOM);
  });

  it('should leave custom when another profile is picked', async() => {
    const disk: Disk = { size: 40 };
    const wrapper = createWrapper(disk);

    vmOf(wrapper).setProfile(PROFILE.CUSTOM);
    vmOf(wrapper).setProfile(PROFILE.DEFAULT);
    await wrapper.vm.$nextTick();

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.DEFAULT);
  });

  it('should force cache mode none when native io is picked in the form', () => {
    const wrapper = createWrapper({ size: 40, cache: 'writeback' });

    (wrapper.vm as unknown as { set: (options: Disk) => void }).set({ io: 'native' });

    expect(wrapper.emitted('update:value')).toStrictEqual([[{
      size: 40, cache: 'none', io: 'native'
    }]]);
  });

  it('should still show a saved high performance profile on a non-virtio disk, with the warning', () => {
    const wrapper = createWrapper({
      size: 40, bus: 'sata', ...HIGH_PERFORMANCE
    });

    expect(vmOf(wrapper).profile).toStrictEqual(PROFILE.HIGH);
    expect(wrapper.find('[data-testid="disk-storage-options-bus-warning"]').exists()).toStrictEqual(true);
  });

  describe('info banners', () => {
    const labelsOf = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findAllComponents(Banner).map((b) => b.attributes().label);
    const HIGH_TIP = '%cluster.credential.harvester.storageOptions.highPerformanceTip%';
    const NATIVE_TIP = '%cluster.credential.harvester.storageOptions.io.nativeTip%';

    it.each([
      [{}, []],
      [HIGH_PERFORMANCE, [HIGH_TIP]],
      [{ cache: 'none', io: 'native' }, [NATIVE_TIP]],
      [{ cache: 'writeback', io: 'threads' }, []],
    ])('a disk with %p should show %p', (options, expected) => {
      expect(labelsOf(createWrapper({ size: 40, ...options }))).toStrictEqual(expected);
    });

    it('should show the native io tip inside a live region that is there before native io is picked', async() => {
      const wrapper = createWrapper({
        size: 40, cache: 'writeback', io: 'threads'
      });
      const status = wrapper.find('[data-testid="disk-storage-options-native-status"]');

      expect(status.attributes('role')).toStrictEqual('status');
      expect(status.findComponent(Banner).exists()).toStrictEqual(false);

      await wrapper.setProps({
        value: {
          size: 40, cache: 'none', io: 'native'
        }
      });

      expect(wrapper.find('[data-testid="disk-storage-options-native-status"]').element === status.element).toStrictEqual(true);
      expect(status.findComponent(Banner).attributes().label).toStrictEqual(NATIVE_TIP);
    });
  });

  it('should only allow cache mode none while io mode is native', () => {
    const wrapper = createWrapper({
      size: 40, cache: 'none', io: 'native'
    });
    const enabled = vmOf(wrapper).cacheOptions.filter((o) => !o.disabled).map((o) => o.value);

    expect(enabled).toStrictEqual(['none']);
  });
});
