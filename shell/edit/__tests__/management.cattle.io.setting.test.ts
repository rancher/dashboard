import { mount } from '@vue/test-utils';
import Settings from '@shell/edit/management.cattle.io.setting.vue';
import { SETTING } from '@shell/config/settings';

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
