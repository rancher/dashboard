import { SCC } from '@shell/store/features';
import { REGISTRATION_NOTIFICATION_ID } from './config/constants';
const { IF_HAVE } = require('@shell/store/type-map');

jest.doMock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });

describe('extension: rancher-prime', () => {
  it('should enable routing for admin users with SCC feature', async() => {
    const plugin = await import('./index'); // initialized after the mock
    const virtualTypeSpy = jest.fn();
    const basicTypeSpy = jest.fn();
    const dslMock = jest.fn().mockReturnValue({
      virtualType: virtualTypeSpy,
      basicType:   basicTypeSpy
    });

    const pluginMock = {
      environment: { isPrime: true },
      addProduct:  jest.fn(),
      addRoutes:   jest.fn(),
      addPanel:    jest.fn(),
      addNavHooks: jest.fn(),
      register:    jest.fn(), // Used in installDocHandler
      metadata:    {},
      DSL:         dslMock
    } as any;

    plugin.default(pluginMock); // basic extension import
    pluginMock.addProduct.mock.calls[0][0].init(pluginMock, {}); // force init to trigger as in @rancher/shell

    expect(pluginMock.addProduct).toHaveBeenCalledWith(
      expect.objectContaining({ init: expect.any(Function) })
    );
    expect(virtualTypeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ifHave:    IF_HAVE.ADMIN,
        ifFeature: SCC
      })
    );
  });
});

describe('extension: rancher-prime registration notification', () => {
  const flushPromises = async() => {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  };

  const createStore = (): any => ({
    state:   { managementReady: true },
    getters: {
      'management/schemaFor': jest.fn(() => ({ resourceMethods: ['PUT'] })),
      'features/get':         jest.fn(() => true),
    },
    dispatch: jest.fn(),
  });

  /**
   * Start the registration poll on login and return the controls of the pending initRegistration
   */
  const login = async(store: any, canReadRegistration = true) => {
    let resolveInit: () => void = () => {};
    let rejectInit: (error: Error) => void = () => {};
    const initRegistration = jest.fn(() => new Promise<void>((resolve, reject) => {
      resolveInit = resolve;
      rejectInit = reject;
    }));

    jest.resetModules();
    jest.doMock('./pages/registration.composable', () => ({
      usePrimeRegistration: () => ({
        registration:        { value: { active: false } },
        canReadRegistration: { value: canReadRegistration },
        initRegistration,
      })
    }));
    jest.doMock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

    const plugin = await import('./index');
    const pluginMock = {
      environment: { isPrime: true },
      addProduct:  jest.fn(),
      addRoutes:   jest.fn(),
      addPanel:    jest.fn(),
      addNavHooks: jest.fn(),
      register:    jest.fn(),
      metadata:    {},
    } as any;

    plugin.default(pluginMock);
    pluginMock.addNavHooks.mock.calls[0][0].onLogin(store);
    jest.advanceTimersByTime(1000); // poll finds managementReady and starts resolving the registration

    return {
      resolveInit: () => resolveInit(),
      rejectInit:  (error: Error) => rejectInit(error),
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should add the notification for an admin without an active registration', async() => {
    const store = createStore();
    const { resolveInit } = await login(store);

    resolveInit();
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: REGISTRATION_NOTIFICATION_ID }));
  });

  it('should remove the notification given the user cannot read the registration', async() => {
    const store = createStore();
    const { resolveInit } = await login(store, false);

    resolveInit();
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('notifications/remove', REGISTRATION_NOTIFICATION_ID);
  });

  it('should not add the notification given the user cannot read the registration', async() => {
    const store = createStore();
    const { resolveInit } = await login(store, false);

    resolveInit();
    await flushPromises();

    expect(store.dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
  });

  it('should not look up schemas when logged out while the registration is resolving', async() => {
    const store = createStore();
    const { resolveInit } = await login(store);

    store.state.managementReady = false;
    resolveInit();
    await flushPromises();

    expect(store.getters['management/schemaFor']).toHaveBeenCalledTimes(0);
  });

  it('should not update notifications when logged out while the registration is resolving', async() => {
    const store = createStore();
    const { resolveInit } = await login(store);

    store.state.managementReady = false;
    resolveInit();
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledTimes(0);
  });

  it('should silently handle a failed registration lookup after logging out', async() => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store = createStore();
    const { rejectInit } = await login(store);

    store.state.managementReady = false;
    rejectInit(new Error("Schemas aren't loaded yet"));
    await flushPromises();

    expect(consoleError).toHaveBeenCalledTimes(0);
  });

  it('should log a failed registration lookup while logged in', async() => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store = createStore();
    const { rejectInit } = await login(store);
    const error = new Error('Request failed');

    rejectInit(error);
    await flushPromises();

    expect(consoleError).toHaveBeenCalledWith('Failed to resolve the registration state', error);
  });
});
