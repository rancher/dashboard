import { shallowMount } from '@vue/test-utils';
import DiskStorageOptions, { PROFILE, applyPerformanceOptions, detectProfile, hasPerformanceOptions } from '@pkg/harvester-manager/machine-config/DiskStorageOptions.vue';

const HIGH_PERFORMANCE = {
  cache: 'none', io: 'native', dedicatedIOThread: true
};

describe('component: DiskStorageOptions', () => {
  const createWrapper = (value = {}, mode = 'create') => shallowMount(DiskStorageOptions, { props: { value, mode } });

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

  it('should be collapsed when the disk has no options', () => {
    const wrapper = createWrapper({ size: 40 });

    expect(wrapper.find('[data-testid="disk-storage-options-profile"]').exists()).toBe(false);
  });

  it('should be expanded when the disk has options', () => {
    const wrapper = createWrapper({ size: 40, ...HIGH_PERFORMANCE });

    expect(wrapper.find('[data-testid="disk-storage-options-profile"]').exists()).toBe(true);
  });

  it('should expand when the toggle is clicked', async() => {
    const wrapper = createWrapper({ size: 40 });

    await wrapper.find('[data-testid="disk-storage-options-toggle"]').trigger('click');

    expect(wrapper.find('[data-testid="disk-storage-options-profile"]').exists()).toBe(true);
  });

  it('should be hidden in view mode when the disk has no options', () => {
    const wrapper = createWrapper({ size: 40 }, 'view');

    expect(wrapper.find('.disk-storage-options').exists()).toBe(false);
  });

  it('should emit the high performance options when that profile is picked', () => {
    const wrapper = createWrapper({ size: 40 });

    (wrapper.vm as any).setProfile(PROFILE.HIGH);

    expect(wrapper.emitted('update:value')).toStrictEqual([[{ size: 40, ...HIGH_PERFORMANCE }]]);
  });

  it('should emit a disk without options when the default profile is picked', () => {
    const wrapper = createWrapper({ size: 40, ...HIGH_PERFORMANCE });

    (wrapper.vm as any).setProfile(PROFILE.DEFAULT);

    expect(wrapper.emitted('update:value')).toStrictEqual([[{ size: 40 }]]);
  });

  it('should show the individual fields only for the custom profile', async() => {
    const wrapper = createWrapper({ size: 40, ...HIGH_PERFORMANCE });

    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toBe(false);

    (wrapper.vm as any).setProfile(PROFILE.CUSTOM);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="disk-storage-options-cache"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="disk-storage-options-io"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="disk-storage-options-dedicated-iothread"]').exists()).toBe(true);
    expect(wrapper.emitted('update:value')).toBeUndefined();
  });

  it('should only allow cache mode none while io mode is native', () => {
    const wrapper = createWrapper({
      size: 40, cache: 'none', io: 'native'
    });
    const enabled = (wrapper.vm as any).cacheOptions.filter((o: any) => !o.disabled).map((o: any) => o.value);

    expect(enabled).toStrictEqual(['none']);
  });
});
