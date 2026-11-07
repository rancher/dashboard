import { shallowMount } from '@vue/test-utils';
import GCEImage from '@shell/machine-config/components/GCEImage.vue';
import { getGKEFamiliesFromProject } from '@shell/components/google/util/gcp';

jest.mock('@shell/components/google/util/gcp', () => ({
  getGKEFamiliesFromProject: jest.fn().mockResolvedValue({}),
  getGKEImageFamilies:       jest.fn().mockResolvedValue({}),
}));

describe('component: GCEImage', () => {
  const createWrapper = (propsData: Record<string, unknown> = {}) => shallowMount(GCEImage, {
    propsData: {
      value:        '',
      credentialId: 'credentialId',
      location:     { zone: 'us-central1-a' },
      ...propsData,
    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': (key: string) => key } },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list the openSUSE image project first for a new machine pool', async() => {
    const wrapper = createWrapper();

    await (wrapper.vm as any).getFamilies();

    expect((wrapper.vm as any).imageProjects).toStrictEqual('opensuse-cloud,ubuntu-os-cloud');
    expect(getGKEFamiliesFromProject).toHaveBeenCalledWith(expect.anything(), 'credentialId', null, { zone: 'us-central1-a' }, 'opensuse-cloud,ubuntu-os-cloud', false);
  });

  it('should keep the image project of an existing machine pool', () => {
    const wrapper = createWrapper({ poolCreateMode: false, value: 'ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20240501' });

    expect((wrapper.vm as any).imageProjects).toStrictEqual('ubuntu-os-cloud');
  });
});
