import semver from 'semver';
import flushPromises from 'flush-promises';
import { shallowMount, Wrapper } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockRegions, mockVersionsSorted } from '@pkg/aks/util/__mocks__/aks';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(versionSetting),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

jest.mock('@pkg/aks/util/aks');

const setCredential = async(wrapper :Wrapper<any>) => {
  wrapper.setData({ config: { azureCredentialSecret: 'foo' } });
  await flushPromises();
};

describe('aks provisioning form', () => {
  it('should hide the form if no credential has been selected', () => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const form = wrapper.find('[data-testid="cruaks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="cruaks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should auto-select a region when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const regionDropdown = wrapper.find('[data-testid="cruaks-resourcelocation"]');

    expect(regionDropdown.exists()).toBe(true);
    expect(regionDropdown.props().value).toBe(mockRegions[0].name);
  });

  it.each([
    ['<=1.26', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.26'))],
    ['<=1.25', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.25'))],
    ['<=1.24', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.24'))]
  ])('should list only versions satisfying the ui-default-version-range setting', async(versionRange: string, expectedVersions: string[]) => {
    const mockVersionRangeSetting = { value: versionRange };
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup(mockVersionRangeSetting)
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(expectedVersions);
  });

  it('should sort versions from latest to oldest', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('1.27.0');
  });

  it('should auto-select a kubernetes version when a region is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    // version dropdown options are validated in another test so here we can assume they're properly sorted and filtered such that the first one is the default value
    expect(versionDropdown.props().value).toBe(versionDropdown.props().options[0].value);
  });

  it.each([['1.26.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.26.0'))], ['1.24.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.24.0'))],
  ])('should not allow a k8s version downgrade on edit', async(originalVersion, validVersions) => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ originalVersion });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(validVersions);
    await wrapper.destroy();
  });
});
