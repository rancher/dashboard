import { mount } from '@vue/test-utils';
import authConfigMixin from '@shell/mixins/auth-config';
import childHook from '@shell/mixins/child-hook';

describe('mixin: authConfigMixin', () => {
  const FakeComponent = {
    render() {},
    mixins:  [authConfigMixin, childHook],
    methods: { applyHooks: jest.fn() },
  };

  describe('method: applyDefaults', () => {
    const createInstance = (configType: string, model: any = {}) => {
      const instance = mount(FakeComponent, {
        data: () => ({
          value: { configType },
          model: { id: configType, ...model },
        }),
        computed: { principal: () => ({ me: {} }) },
        global:   {
          mocks: {
            $store: { dispatch: () => model },
            $route: {
              params: { id: configType },
              query:  { mode: 'edit' },
            },
          }
        }
      }).vm as any;

      instance.applyDefaults();

      return instance;
    };

    it.each([
      'saml',
      'ldap',
    ])('should set accessMode to required for %s config type', (configType) => {
      const instance = createInstance(configType);

      expect(instance.model.accessMode).toStrictEqual('required');
    });

    it('should set accessMode to unrestricted for oidc config type', () => {
      const instance = createInstance('oidc');

      expect(instance.model.accessMode).toStrictEqual('unrestricted');
    });
  });

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
});
