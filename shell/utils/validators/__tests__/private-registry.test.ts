import { privateRegistryRequired } from '@shell/utils/validators/private-registry';

const makeCtx = (overrides: any = {}) => ({
  t:                      jest.fn((key: string, params?: any) => (params ? `${ key }:${ JSON.stringify(params) }` : key)),
  privateRegistryEnabled: false,
  normanCluster:          { importedConfig: {} },
  $store:                 { getters: { 'management/byId': () => null } },
  ...overrides,
});

const storeWithGlobalRegistry = {
  getters: { 'management/byId': () => ({ value: 'registry.global.io' }) }
};

describe('privateRegistryRequired', () => {
  it('should return undefined when a global default registry is configured', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      $store:                 storeWithGlobalRegistry,
    });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toBeUndefined();
  });

  it('should return undefined when the registry toggle is off', () => {
    const ctx = makeCtx({ privateRegistryEnabled: false });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toBeUndefined();
  });

  it('should return a required error when enabled but the url is empty', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      normanCluster:          { importedConfig: { privateRegistryURL: '' } },
    });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toStrictEqual('validation.required:{"key":"cluster.privateRegistry.label"}');
  });

  it('should return a required error when normanCluster.importedConfig is missing', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      normanCluster:          {},
    });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toStrictEqual('validation.required:{"key":"cluster.privateRegistry.label"}');
  });

  it('should return a format error when enabled and the url is malformed', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      normanCluster:          { importedConfig: { privateRegistryURL: 'goober' } },
    });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toStrictEqual('cluster.privateRegistry.privateRegistryUrlError');
  });

  it('should return undefined when enabled and the url is valid', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      normanCluster:          { importedConfig: { privateRegistryURL: 'registry.io:5000' } },
    });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toBeUndefined();
  });

  it('should handle $store getter throwing gracefully', () => {
    const ctx = makeCtx({
      privateRegistryEnabled: true,
      normanCluster:          { importedConfig: {} },
      $store:                 {
        getters: {
          get 'management/byId'() {
            throw new Error('no store');
          }
        }
      },
    });
    const rule = privateRegistryRequired(ctx);

    // Falls through to validation since no global default detected
    expect(rule()).toStrictEqual('validation.required:{"key":"cluster.privateRegistry.label"}');
  });
});
