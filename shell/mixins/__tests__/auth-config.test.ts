import { mount } from '@vue/test-utils';
import authConfigMixin from '@shell/mixins/auth-config';

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
          $store: {
            dispatch: () => model,
            commit:   () => ({ 'auth/loggedInAs': jest.fn() }),
          },
          $route: {
            params: { id: '123' },
            query:  { mode: 'edit' },
          },
        }
      }
    });
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin],
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
});
