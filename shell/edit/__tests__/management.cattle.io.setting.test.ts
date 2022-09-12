import { mount } from '@vue/test-utils';
import Settings from '@shell/edit/management.cattle.io.setting.vue';

describe('management.cattle.io.setting should', () => {
  describe('validate input with provided settings', () => {
    it('allowing to save if valid', () => {
      const wrapper = mount(Settings, {
        data:      () => ({ setting: { rules: [() => undefined] } }),
        propsData: { value: { value: 'anything' } },
        // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
        mocks:     {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            }
          },
          $route:  { query: { AS: '' } },
          $router: { applyQuery: jest.fn() },
        }
      });
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(false);
    });

    it('preventing to save if any error', () => {
      const wrapper = mount(Settings, {
        data:      () => ({ setting: { rules: [() => 'error'] } }),
        propsData: { value: { value: 'anything' } },
        // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
        mocks:     {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            }
          },
          $route:  { query: { AS: '' } },
          $router: { applyQuery: jest.fn() },
        }
      });
      const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

      expect(saveButton.disabled).toBe(true);
    });
  });
});
