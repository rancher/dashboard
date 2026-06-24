import { mount } from '@vue/test-utils';
import authConfigMixin from '@shell/mixins/auth-config';
import childHook from '@shell/mixins/child-hook';
//
describe('mixin: authConfigMixin', () => {
  describe('method: save', () => {
    const componentMock = (model: any) => ({
      data: () => ({
        value: { configType: 'oidc' },
        model,
      }),
      computed: { principal: () => ({ me: {} }) },
      global:   {
        mocks: {
          $store: { dispatch: () => model },
          $route: {
            params: { id: '123' },
            query:  { mode: 'edit' },
          },
        }
      }
    });
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    it('should return error', async() => {
      const instance = mount(FakeComponent, componentMock({
        doAction: jest.fn(),
        save:     'make it fail'
      })).vm as any;
      const fakeCallback = jest.fn();

      await instance.save(fakeCallback);

      expect(fakeCallback).toHaveBeenCalledWith(false);
    });

    it('should not return error', async() => {
      const model = {
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           async() => {}
      };
      const instance = mount(FakeComponent, componentMock(model)).vm as any;
      const fakeCallback = jest.fn();

      await instance.save(fakeCallback);

      expect(fakeCallback).toHaveBeenCalledWith(true);
    });

    it.each([
      'oidc'
    ])('should keep custom scope on save', async(type) => {
      const scope = 'openid profile email groups whatever';
      const model = {
        scope,
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           async() => {}
      };
      const instance = mount(FakeComponent, componentMock(model)).vm as any;

      await instance.save(jest.fn());

      expect(instance.model.scope).toStrictEqual(scope);
    });
  });

  describe('accessMode on enable', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createMock = (model: any, overrides: Record<string, any> = {}) => ({
      data: () => ({
        value: { configType: 'oidc' },
        model,
        ...overrides,
      }),
      computed: { principal: () => ({ me: {} }) },
      global:   {
        mocks: {
          $store: { dispatch: () => model },
          $route: {
            params: { id: model.id || '123' },
            query:  { mode: 'edit' },
          },
        }
      }
    });

    it.each([
      'github',
      'githubapp',
    ])('should default accessMode to restricted for %s on enable', async(id) => {
      const model = {
        id,
        enabled:        false,
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           jest.fn(),
      };
      const instance = mount(FakeComponent, createMock(model)).vm as any;

      await instance.save(jest.fn());

      expect(model.save).toHaveBeenCalled();
      expect(instance.model.accessMode).toStrictEqual('required');
    });

    it('should default accessMode to unrestricted for non-github oauth on enable', async() => {
      const model = {
        id:             'googleoauth',
        enabled:        false,
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           jest.fn(),
      };
      const instance = mount(FakeComponent, createMock(model)).vm as any;

      await instance.save(jest.fn());

      expect(instance.model.accessMode).toStrictEqual('required');
    });

    it('should set accessMode to required after enabling a provider', async() => {
      const model = {
        enabled:        false,
        accessMode:     'unrestricted',
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           async() => {}
      };
      const instance = mount(FakeComponent, createMock(model)).vm as any;

      await instance.save(jest.fn());

      expect(instance.model.accessMode).toStrictEqual('required');
    });

    it('should not change accessMode when editing an already enabled provider', async() => {
      const model = {
        enabled:        true,
        accessMode:     'unrestricted',
        authConfigName: 'whatever',
        doAction:       jest.fn(),
        save:           async() => {}
      };
      const instance = mount(FakeComponent, createMock(model, { editConfig: true })).vm as any;

      await instance.save(jest.fn());

      expect(instance.model.accessMode).toStrictEqual('unrestricted');
    });
  });
});
