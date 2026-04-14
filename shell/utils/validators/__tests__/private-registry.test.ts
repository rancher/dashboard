import { privateRegistryRequired } from '@shell/utils/validators/private-registry';

const makeCtx = (overrides: any = {}) => ({
  t:                      jest.fn((key: string, params?: any) => (params ? `${ key }:${ JSON.stringify(params) }` : key)),
  privateRegistryEnabled: false,
  normanCluster:          { importedConfig: { privateRegistryURL: null } },
  isImportedCluster:      true,
  ...overrides,
});

describe('privateRegistryRequired', () => {
  it('should return undefined when the cluster is not imported', () => {
    const ctx = makeCtx({ isImportedCluster: false, privateRegistryEnabled: true });
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toBeUndefined();
  });

  it('should default isImportedCluster to true when the property is absent from the context', () => {
    const ctx: any = {
      t:                      jest.fn((key: string, params?: any) => (params ? `${ key }:${ JSON.stringify(params) }` : key)),
      privateRegistryEnabled: true,
      normanCluster:          { importedConfig: { privateRegistryURL: null } },
    };
    const rule = privateRegistryRequired(ctx);

    expect(rule()).toStrictEqual('validation.required:{"key":"cluster.privateRegistry.label"}');
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
});
