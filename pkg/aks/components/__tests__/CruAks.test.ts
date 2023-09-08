import Vue from 'vue';
import { mount, shallowMount, Wrapper } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = {
  getters: {
    'i18n/t':                  (text: string) => text,
    t:                         (text: string) => text,
    currentStore:              () => 'current_store',
    'current_store/schemaFor': jest.fn(),
    'current_store/all':       jest.fn(),
    'management/byId':         jest.fn(),
    'rancher/create':          () => {}
  },
  dispatch: jest.fn()
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore,
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

jest.mock('@pkg/aks/util/aks');

const setCredential = async(wrapper :Wrapper<any>) => {
  wrapper.setData({ config: { azureCredentialSecret: 'foo' } });

  await Vue.nextTick();
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
});
