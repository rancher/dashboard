import { mount } from '@vue/test-utils';
import Settings from '@shell/edit/management.cattle.io.setting/index.vue';
import { SETTING } from '@shell/config/settings';
import { RadioGroup } from '@components/Form/Radio';

const requiredSetup = () => ({
  // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
  global: {
    mocks: {
      $store: {
        getters: {
          currentStore:              () => 'current_store',
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  jest.fn(),
          'i18n/exists':             jest.fn(),
        },
        dispatch: jest.fn(),
      },
      $route:  { query: { AS: '' } },
      $router: { applyQuery: jest.fn() },
      t:       (key: string) => key,
    }
  }
});

describe('view: management.cattle.io.setting should', () => {
  it('allowing to save if no rules in settings', () => {
    const wrapper = mount(Settings, {
      props: { value: { value: 'anything' } },
      data:  () => ({ setting: { } }),
      ...requiredSetup()
    });
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(false);
  });

  describe('using predefined generic rule', () => {
    const id = SETTING.PASSWORD_MIN_LENGTH;

    describe('validate input with provided settings', () => {
      it('allowing to save if pass', () => {
        const wrapper = mount(Settings, {
          props: { value: { id, value: '3' } },
          ...requiredSetup()
        });
        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });

      // TODO: Test results incorrectly false, but it's not possible to identify the reason and required premises
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip('preventing to save if any error', () => {
        const wrapper = mount(Settings, {
          props: { value: { id, value: '1' } },
          ...requiredSetup()
        });
        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });
    });

    it('retrieve correct rules based on settings', () => {
      const wrapper = mount(Settings, {
        props: { value: { id, value: '' } },
        ...requiredSetup()
      });
      const expectation = [{
        path:  'value',
        rules: ['betweenValues', 'isInteger', 'isPositive', 'isOctal']
      }];

      expect(wrapper.vm.$data['fvFormRuleSets']).toStrictEqual(expectation);
    });

    it('generate extra rules based on settings', () => {
      const wrapper = mount(Settings, {
        props: { value: { id, value: '' } },
        ...requiredSetup()
      });
      const expectation = ['betweenValues', 'isInteger', 'isPositive', 'isOctal'];

      // Avoid integration tests with mixin as it returns the whole function
      const rules = Object.keys((wrapper.vm as any)['fvExtraRules']);

      expect(rules).toStrictEqual(expectation);
    });
  });
});

describe('edit: management.cattle.io.setting should', () => {
  it('display form errors', () => {
    const wrapper = mount(Settings, {
      props: {
        value: { value: 'anything' },
        mode:  'edit',
      },
      data: () => ({
        setting: { },
        errors:  ['generic'] as any,
      }),
      ...requiredSetup()
    });
    const errorBanner = wrapper.find('[data-testid="banner-content"]');

    expect(errorBanner.element.textContent).toBe('generic');
  });
});

describe('edit: management.cattle.io.setting with radio enum display', () => {
  const createWrapper = (value: string) => {
    const { global } = requiredSetup();
    const $store = {
      ...global.mocks.$store,
      getters: {
        ...global.mocks.$store.getters,
        'i18n/t':      (key: string) => key,
        'i18n/exists': () => true,
      },
    };

    return mount(Settings, {
      props:  { value: { id: SETTING.UI_APPCO_ENABLED, value } },
      global: { ...global, mocks: { ...global.mocks, $store } },
    });
  };

  it('should offer each option, the empty one included, with its label and description', () => {
    const radioGroup = createWrapper('true').findComponent(RadioGroup);

    expect(radioGroup.props('options')).toStrictEqual([
      {
        label: 'advancedSettings.enum.ui-appco-enabled.true', description: 'advancedSettings.enumDescription.ui-appco-enabled.true', value: 'true'
      },
      {
        label: 'advancedSettings.enum.ui-appco-enabled.false', description: 'advancedSettings.enumDescription.ui-appco-enabled.false', value: 'false'
      },
      {
        label: 'advancedSettings.enum.ui-appco-enabled.none', description: 'advancedSettings.enumDescription.ui-appco-enabled.none', value: '__empty__'
      },
    ]);
  });

  it.each([
    ['true', 'true'],
    ['', '__empty__'],
  ])('should check the option for the value %p', (value, expected) => {
    expect(createWrapper(value).findComponent(RadioGroup).props('value')).toBe(expected);
  });

  it.each([
    ['false', 'false'],
    ['__empty__', ''],
  ])('should save %p as %p', async(option, expected) => {
    const wrapper = createWrapper('true');

    await wrapper.findComponent(RadioGroup).vm.$emit('update:value', option);

    expect((wrapper.props('value') as any).value).toBe(expected);
  });
});
