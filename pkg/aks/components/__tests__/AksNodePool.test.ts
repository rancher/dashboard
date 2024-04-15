
import { shallowMount } from '@vue/test-utils';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

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
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

describe('aks provisioning form', () => {
  it('should show an error if a pool has an invalid name', () => {
    const wrapper = shallowMount(AksNodePool, {
      propsData: { pool: {}, mode: 'create' },
      ...requiredSetup()
    });

    const nameInput = wrapper.find(`[data-testid=pool-name]`);

    expect(nameInput.exists()).toBe(true);
    expect(nameInput.vm.rules[0]()).toBeUndefined();

    wrapper.setData({ pool: { name: '123-abc', _validName: false } });
    expect(nameInput.vm.rules[0]()).toBeDefined();
  });
});
