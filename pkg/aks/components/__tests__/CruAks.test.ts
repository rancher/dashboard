import flushPromises from 'flush-promises';
import { shallowMount, Wrapper, mount } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockRegions } from '../../util/__mocks__/aks';
import { _CREATE } from '@shell/config/query-params';

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
    dispatch: (cmd, args) => {
      return cmd === 'rancher/clone' ? args?.resource : null;
    }
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(versionSetting),
        $route:      mockedRoute,
        $fetchState: {},
      },
      stubs: { CruResource: false, Accordion: false }
    }
  };
};

jest.mock('@pkg/aks/util/aks');

const setCredential = async(wrapper :Wrapper<any>, config = {} as any) => {
  config.azureCredentialSecret = 'foo';
  wrapper.setData({ config });
  await flushPromises();
};

describe('aks provisioning form', () => {
  it('should hide the form if no credential has been selected', () => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    const form = wrapper.find('[data-testid="cruaks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = mount(CruAks, {
      props: {
        value: { type: 'something' },
        mode:  _CREATE,
      },
      shallow: true,
      ...requiredSetup(),
    });

    const formSelector = '[data-testid="cruaks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should auto-select a region when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const regionDropdown = wrapper.getComponent('[data-testid="cruaks-resourcelocation"]');

    expect(regionDropdown.exists()).toBe(true);
    expect(regionDropdown.props().value).toBe(mockRegions[0].name);
  });

  it('should show an input with clusters to register when the mode is import', async() => {
    const setup = {
      global: {
        mocks: {
          $store:      mockedStore({ value: '<=1.27.x' }),
          $route:      { query: { mode: 'import' } },
          $fetchState: {},
        },
        stubs: { CruResource: false, Accordion: false }
      }
    };
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...setup
    });

    await setCredential(wrapper);
    const clusterDropdown = wrapper.find('[data-testid="cruaks-import"]');

    expect(clusterDropdown.exists()).toBe(true);
  });

  // https://github.com/rancher/dashboard/issues/13647
  it('should not render the import cluster dropdown nor run its validation when the mode is not import', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const clusterDropdown = wrapper.find('[data-testid="cruaks-import"]');

    expect(clusterDropdown.exists()).toBe(false);

    expect(wrapper.vm.fvUnreportedValidationErrors).toHaveLength(0);
  });

  it.each([
    ['1.26', '1.26.3', '1.26.3'],
    ['1.26.2', '1.26.3', '1.26.2'],
    ['1.28.2', '1.26.3', '1.28.2'],

  ])('should fall back to using the management cluster status.version.gitVersion when the version in spec is missing a patch', async(specVersion, statusVersion, expected) => {
    const mockValue = {
      id:                'test',
      waitForMgmt:       () => {},
      findNormanCluster: () => {
        return { aksConfig: { kubernetesVersion: specVersion } };
      },
      mgmt: { status: { version: { gitVersion: statusVersion } } }
    };

    const wrapper = shallowMount(CruAks, {
      propsData: { value: mockValue, mode: 'edit' },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    await (CruAks as any).fetch.call(wrapper.vm);
    expect(wrapper.vm.originalVersion).toBe(expected);
  });
});
