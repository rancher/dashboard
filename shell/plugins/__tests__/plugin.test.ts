import plugin from '@shell/plugins/plugin';

jest.mock('@shell/utils/dynamic-importer', () => ({ listProducts: () => [], loadProduct: jest.fn() }));
jest.mock('@shell/utils/versions', () => ({ fetch: () => Promise.resolve({}) }));

function requestRejection(status: number) {
  return Object.defineProperty({ data: '' }, '_status', { value: status });
}

function createContext(reason: unknown) {
  return {
    route: { query: {} },
    store: {
      dispatch: jest.fn((action: string) => (action === 'management/request' ? Promise.reject(reason) : Promise.resolve())),
      getters:  {},
    },
    $extension: { loadBuiltinExtensions: jest.fn(), reportPendingExtends: jest.fn() },
    $plugin:    {},
  };
}

describe('plugins/plugin.js', () => {
  describe('when the UI Extensions list request fails', () => {
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs that the Extensions Operator may not be installed when the request answers 404', async() => {
      await plugin(createContext(requestRejection(404)));

      expect(logSpy).toHaveBeenCalledWith('Could not load UI Extensions list (Extensions Operator may not be installed)');
    });

    it('does not log an error when the request answers 404', async() => {
      await plugin(createContext(requestRejection(404)));

      expect(errorSpy).not.toHaveBeenCalledWith('Could not load UI Extensions list', expect.anything());
    });

    it.each([
      ['a 500 response', requestRejection(500)],
      ['a network error', new Error('Network Error')],
    ])('logs the original rejection for %s', async(_, reason) => {
      await plugin(createContext(reason));

      expect(errorSpy).toHaveBeenCalledWith('Could not load UI Extensions list', reason);
    });
  });
});
