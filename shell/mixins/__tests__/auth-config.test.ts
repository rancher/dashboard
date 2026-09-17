import { flushPromises, mount } from '@vue/test-utils';
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

  // An enabled provider opens on who may log in with it. Editing the provider
  // itself is a state of the same page, so whoever links there has to ask for it.
  describe('opening on the provider configuration', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createMock = (query: Record<string, string>) => ({
      data:   () => ({ value: { configType: 'oidc' }, model: {} }),
      global: {
        mocks: {
          $store:  { dispatch: jest.fn() },
          $router: { applyQuery: jest.fn() },
          $route:  { params: { id: 'github' }, query },
        }
      }
    });

    it.each([
      ['asked for', { mode: 'edit', editConfig: 'true' }, true],
      ['not asked for', { mode: 'edit' }, false],
    ])('should edit the configuration when it is %s', (_case, query, expected) => {
      const instance = mount(FakeComponent, createMock(query)).vm as any;

      expect(instance.editConfig).toBe(expected);
    });
  });

  describe('method: cancel', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createMock = (model: any, query: Record<string, string>, $router: any) => ({
      data:   () => ({ value: { configType: 'oidc' }, model }),
      global: {
        mocks: {
          $store: { dispatch: jest.fn().mockResolvedValue(model) },
          $router,
          $route: {
            name:   'c-cluster-auth-config-id',
            params: { cluster: 'local', id: 'github' },
            query,
          },
        }
      }
    });

    const createRouter = () => ({
      applyQuery: jest.fn(), push: jest.fn(), go: jest.fn()
    });

    // The configuration is the whole page when it's opened from the list, so
    // there's nothing left on the page to cancel back to.
    it('should return to the provider list when the page was opened on the configuration', () => {
      const $router = createRouter();
      const model = { enabled: true };
      const instance = mount(FakeComponent, createMock(model, { mode: 'edit', editConfig: 'true' }, $router)).vm as any;

      instance.cancel();

      expect($router.push).toHaveBeenCalledWith({
        name:   'c-cluster-auth-config',
        params: { cluster: 'local' },
      });
    });

    // Editing started on this page, so cancelling puts the page back as it was.
    it('should show who may log in again when the edit started on the page', async() => {
      const $router = createRouter();
      const model = { enabled: true };
      const instance = mount(FakeComponent, createMock(model, { mode: 'edit' }, $router)).vm as any;

      instance.goToEdit();
      instance.cancel();
      await flushPromises();

      expect(instance.editConfig).toBe(false);
      expect($router.push).not.toHaveBeenCalled();
    });

    it('should go back to wherever a provider that is not enabled yet was picked from', () => {
      const $router = createRouter();
      const model = { enabled: false };
      const instance = mount(FakeComponent, createMock(model, { mode: 'edit', editConfig: 'true' }, $router)).vm as any;

      instance.cancel();

      expect($router.go).toHaveBeenCalledWith(-1);
      expect($router.push).not.toHaveBeenCalled();
    });
  });
});
