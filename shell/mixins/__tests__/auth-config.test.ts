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
      ['github', 'githubConfig'],
      ['githubapp', 'githubAppConfig'],
    ])('should default accessMode to restricted for %s on enable', async(id, type) => {
      const model = {
        id,
        type,
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
        type:           'googleOauthConfig',
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

  // Adding a second provider of a type creates a config of its own. Nothing is
  // written until the form saves, because `metadata.name` cannot be changed once
  // the config exists.
  describe('creating a provider', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createMock = (dispatch: jest.Mock, replace: jest.Mock, authConfigCreate: any) => ({
      data: () => ({
        value: { configType: 'oauth' },
        model: {
          clientId: 'client-id', clientSecret: 'shhh', enabled: false
        },
      }),
      computed: { principal: () => ({ me: {} }) },
      global:   {
        provide: { authConfigCreate },
        mocks:   {
          $store:  { dispatch },
          $router: { replace },
          $route:  {
            params: { cluster: 'local' },
            query:  { mode: 'edit' },
          },
        }
      }
    });

    const serverModel = () => ({
      id:          'github-2',
      type:        'githubConfig',
      hostname:    'github.com',
      tls:         true,
      annotations: { 'field.cattle.io/description': 'Contractors' },
      doAction:    jest.fn(),
      save:        jest.fn(),
    });

    const createInstance = (overrides: any = {}) => {
      const created = serverModel();
      const dispatch = jest.fn((action: string, payload: any) => {
        switch (action) {
        case 'rancher/find': return created;
        case 'rancher/clone': return { ...payload.resource };
        case 'auth/test': return 'auth-code';
        case 'rancher/findAll': return [];
        default: return undefined;
        }
      });
      const replace = jest.fn();
      const authConfigCreate = {
        name: 'github-2', normanType: 'githubConfig', takenIds: ['github'], ...overrides
      };

      return {
        created,
        dispatch,
        replace,
        instance: mount(FakeComponent, createMock(dispatch, replace, authConfigCreate)).vm as any,
      };
    };

    it('should create the config through the Kubernetes API', async() => {
      const { instance, dispatch } = createInstance();

      instance.configDescription = 'Contractors';
      await instance.save(jest.fn());

      expect(dispatch).toHaveBeenCalledWith('management/request', {
        url:    '/k8s/clusters/local/apis/management.cattle.io/v3/authconfigs',
        method: 'POST',
        data:   {
          apiVersion: 'management.cattle.io/v3',
          kind:       'AuthConfig',
          metadata:   { name: 'github-2', annotations: { 'field.cattle.io/description': 'Contractors' } },
          type:       'githubConfig',
          enabled:    false,
        },
      });
    });

    it('should leave out the description annotation when none was given', async() => {
      const { instance, dispatch } = createInstance();

      await instance.save(jest.fn());

      const [, payload] = dispatch.mock.calls.find(([action]) => action === 'management/request') as any;

      expect(payload.data.metadata).toStrictEqual({ name: 'github-2' });
    });

    it('should carry what was filled in onto the config the server created', async() => {
      const { instance } = createInstance();

      await instance.save(jest.fn());

      expect(instance.model.clientId).toBe('client-id');
      expect(instance.model.id).toBe('github-2');
      expect(instance.authConfigName).toBe('github-2');
    });

    it('should move to the new config own page once it exists', async() => {
      const { instance, replace } = createInstance();

      await instance.save(jest.fn());

      expect(replace).toHaveBeenCalledWith({
        name:   'c-cluster-auth-config-id',
        params: { cluster: 'local', id: 'github-2' },
        query:  { mode: 'edit' },
      });
    });

    it('should report a failed create and go no further', async() => {
      const { instance, dispatch, replace } = createInstance();
      const btnCb = jest.fn();

      dispatch.mockImplementation((action: string) => {
        if (action === 'management/request') {
          throw new Error('already exists');
        }

        return undefined;
      });

      await instance.save(btnCb);

      expect(btnCb).toHaveBeenCalledWith(false);
      expect(replace).not.toHaveBeenCalled();
      expect(instance.errors.length).toBeGreaterThan(0);
    });

    // The config is on the server once the create succeeds, so a failure picking
    // it back up must not send the next save off to create it again.
    describe('when the config cannot be picked back up', () => {
      const failFirstFind = () => {
        const setup = createInstance();
        const { dispatch, created } = setup;
        const implementation = dispatch.getMockImplementation() as any;
        let finds = 0;

        dispatch.mockImplementation((action: string, payload: any) => {
          if (action === 'rancher/find' && finds++ === 0) {
            throw new Error('not found');
          }

          return implementation(action, payload);
        });

        return { ...setup, created };
      };

      const creates = (dispatch: jest.Mock) => dispatch.mock.calls.filter(([action]) => action === 'management/request').length;

      it('should report the failure', async() => {
        const { instance } = failFirstFind();
        const btnCb = jest.fn();

        await instance.save(btnCb);

        expect(btnCb).toHaveBeenCalledWith(false);
        expect(instance.errors.length).toBeGreaterThan(0);
      });

      it('should not create the config again on the next save', async() => {
        const { instance, dispatch } = failFirstFind();

        await instance.save(jest.fn());
        await instance.save(jest.fn());

        expect(creates(dispatch)).toBe(1);
      });

      it('should pick the config up on the next save', async() => {
        const { instance } = failFirstFind();

        await instance.save(jest.fn());
        await instance.save(jest.fn());

        expect(instance.errors).toStrictEqual([]);
        expect(instance.model.id).toBe('github-2');
      });
    });
  });

  // The API has no description field, so it lives in an annotation, and the form
  // edits it the way it edits any other field of the config.
  describe('configDescription', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createInstance = (model: any) => mount(FakeComponent, {
      data:   () => ({ value: { configType: 'oauth' }, model }),
      global: {
        mocks: {
          $store: { dispatch: jest.fn() },
          $route: { params: { cluster: 'local', id: 'github-5' }, query: { mode: 'edit' } },
        }
      }
    }).vm as any;

    const model = (annotations: Record<string, string>) => ({
      id: 'github-5', type: 'githubConfig', enabled: true, annotations
    });

    it('should read what the admin called this connection', () => {
      const instance = createInstance(model({ 'field.cattle.io/description': 'Contractors' }));

      expect(instance.configDescription).toBe('Contractors');
    });

    it('should be empty when the config has no description', () => {
      const instance = createInstance(model({}));

      expect(instance.configDescription).toBe('');
    });

    it('should write the description onto the config, to be saved with the rest of it', () => {
      const instance = createInstance(model({ 'management.cattle.io/auth-provider-cleanup': 'unlocked' }));

      instance.configDescription = 'Contractors';

      expect(instance.model.annotations['field.cattle.io/description']).toBe('Contractors');
      // ...without disturbing annotations that are not ours
      expect(instance.model.annotations['management.cattle.io/auth-provider-cleanup']).toBe('unlocked');
    });

    it('should take the description away when it has been cleared', () => {
      const instance = createInstance(model({ 'field.cattle.io/description': 'Contractors' }));

      instance.configDescription = '';

      expect(instance.model.annotations['field.cattle.io/description']).toBeUndefined();
    });
  });

  // The name is `metadata.name`, which the API rejects on update, so only a config
  // that has yet to be created has a name the form can still argue with.
  describe('configNameError', () => {
    const FakeComponent = {
      render() {},
      mixins:  [authConfigMixin, childHook],
      methods: { applyHooks: jest.fn() },
    };

    const createInstance = (authConfigCreate: any) => mount(FakeComponent, {
      data:   () => ({ value: { configType: 'oauth' }, model: { id: 'github-2' } }),
      global: {
        provide: authConfigCreate ? { authConfigCreate } : {},
        mocks:   {
          $store: { dispatch: jest.fn() },
          $route: { params: { cluster: 'local', id: 'github-2' }, query: { mode: 'edit' } },
        }
      }
    }).vm as any;

    const adding = (name: string) => ({
      name, normanType: 'githubConfig', takenIds: ['github', 'okta'], created: false
    });

    it('should accept a free name', () => {
      expect(createInstance(adding('github-2')).configNameError).toBeNull();
    });

    it.each([
      ['it is empty', '', 'authConfig.create.name.required'],
      ['it is not a DNS label', 'GitHub Two', 'authConfig.create.name.invalid'],
      ['another config already has it', 'github', 'authConfig.create.name.taken'],
    ])('should reject a name when %s', (_label, name, key) => {
      // The test harness renders a translation key as `%key%`
      expect(createInstance(adding(name)).configNameError).toContain(key);
    });

    it('should stop arguing once the config has been created', () => {
      expect(createInstance({ ...adding(''), created: true }).configNameError).toBeNull();
    });

    it('should have nothing to say about a config that already exists', () => {
      expect(createInstance(null).configNameError).toBeNull();
    });
  });
});
