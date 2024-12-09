import flushPromises from 'flush-promises';
import { shallowMount, Wrapper, mount } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockRegions } from '../../util/__mocks__/aks';
import { _CREATE } from '@shell/config/query-params';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/schemaFor':    jest.fn(),
      'rancher/create':          () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
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
});
