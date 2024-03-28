import flushPromises from 'flush-promises';
import { shallowMount, Wrapper } from '@vue/test-utils';
import { EKSConfig } from 'types';
import CruEKS from '@pkg/eks/components/CruEKS.vue';

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

const setCredential = async(wrapper :Wrapper<any>, config = {} as EKSConfig) => {
  config.amazonCredentialSecret = 'foo';
  wrapper.setData({ config });
  await flushPromises();
};

describe('eKS provisioning form', () => {
  it('should hide the form if no credential is selected', () => {
    const wrapper = shallowMount(CruEKS, { propsData: { value: {}, mode: 'create' }, ...requiredSetup() });

    const form = wrapper.find('[data-testid="crueks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="crueks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });
});
