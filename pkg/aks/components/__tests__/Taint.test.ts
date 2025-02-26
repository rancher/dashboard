
import { shallowMount } from '@vue/test-utils';
import Taint from '@pkg/aks/components/Taint.vue';
import { _EDIT } from '@shell/config/query-params';

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
      'i18n/t': (text: string, v = {}) => {
        return `${ text }${ Object.values(v) }`;
      },
    },
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mixins: [mockedValidationMixin],
      mocks:  {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

describe('aks taint component', () => {
  it.each([
    ['key1=val1:PreferNoSchedule', {
      key: 'key1', value: 'val1', effect: 'PreferNoSchedule'
    }],
    ['key2=val2:NoExecute', {
      key: 'key2', value: 'val2', effect: 'NoExecute'
    }],
    ['=val3:PreferNoSchedule', {
      key: '', value: 'val3', effect: 'PreferNoSchedule'
    }],
    ['key4=:NoExecute', {
      key: 'key4', value: '', effect: 'NoExecute'
    }],
  ])('on edit, should populate each input field with parsed taint value', (taint, expected) => {
    const wrapper = shallowMount(Taint, {
      ...requiredSetup(),
      propsData: {
        mode: _EDIT,
        taint
      },
    });

    const keyInput = wrapper.find('[data-testid="aks-taint-key-input"]');
    const valueInput = wrapper.find('[data-testid="aks-taint-value-input"]');
    const effectSelect = wrapper.find('[data-testid="aks-taint-effect-select"]');

    expect(keyInput.attributes().value).toBe(expected.key);
    expect(valueInput.attributes().value).toBe(expected.value);
    expect(effectSelect.attributes().value).toBe(expected.effect);
  });
});
