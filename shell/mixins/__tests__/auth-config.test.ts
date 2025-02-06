import { mount } from '@vue/test-utils';
import authConfigMixin from '@shell/mixins/auth-config';

describe('authConfigMixin', () => {
  describe('on save', () => {
    it('should not return error', () => {
      const model = { authConfigName: 'whatever' };
      const FakeComponent = {
        render() {},
        mixins:  [authConfigMixin],
        methods: { applyHooks: jest.fn() },
      };
      const instance = mount(FakeComponent, {
        data: () => ({
          value: { configType: 'oidc' },
          model
        }),
        global: {
          mocks: {
            $store: { dispatch: { 'auth/test': () => model } },
            $route: {
              params: { id: '123' },
              query:  { mode: 'edit' },
            },
          }
        }
      }).vm as any;

      instance.save(jest.fn());

      expect(instance.errors).toStrictEqual([]);
    });

    it.each([
      'oidc'
    ])('should keep custom scope on save', async(type) => {
      const scope = 'openid profile email groups whatever';
      const model = {
        scope,
        authConfigName: 'whatever',
      };
      const FakeComponent = {
        render() {},
        mixins:  [authConfigMixin],
        methods: { applyHooks: jest.fn() },
      };
      const instance = mount(FakeComponent, {
        data: () => ({
          value: { configType: 'oidc' },
          model
        }),
        global: {
          mocks: {
            // $store: { dispatch: { 'auth/test': () => model } },
            $route: {
              params: { id: '123' },
              query:  { mode: 'edit' },
            },
          }
        }
      }
      ).vm as any;
      const btnCb = jest.fn();

      await instance.save(btnCb);

      expect(instance.model.scope).toStrictEqual(scope);
    });
  });
});
