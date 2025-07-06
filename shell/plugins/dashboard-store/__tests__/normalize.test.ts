import { handleConflict } from '@shell/plugins/dashboard-store/normalize';

describe('fn: handleConflict', () => {
  let mockStore: any;
  let mockToJSON: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = {
      dispatch: jest.fn((action, payload) => Promise.resolve(payload)),
      getters:  { 'i18n/t': jest.fn((key, params) => `${ key } - ${ JSON.stringify(params) }`) },
    };

    mockToJSON = jest.fn((x) => x);
  });

  it('should resolve conflict and return false if no actual conflicts (integration)', async() => {
    const initialValue = {
      metadata: { resourceVersion: '1' },
      spec:     {
        replicas:   1,
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };
    // User modifies 'replicas'
    const value = {
      metadata: { resourceVersion: '1' },
      spec:     {
        replicas:   2,
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };
    // Server did not modify 'replicas', but changed something else (e.g., added a label)
    const liveValue = {
      metadata: {
        resourceVersion: '2',
        labels:          { env: 'prod' }
      },
      spec: {
        replicas:   1, // Same replicas as initialValue, so no conflict with userChange on replicas
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };

    const result = await handleConflict(initialValue, value, liveValue, mockStore, 'namespace', mockToJSON);

    // resourceVersion should be updated from liveValue
    expect(value.metadata.resourceVersion).toStrictEqual('2');
    // Background changes (labels added) should have been applied to 'value'
    expect((value.metadata as any).labels).toStrictEqual({ env: 'prod' });
    // User's change (replicas) should have remained, as there was no conflict
    expect(value.spec.replicas).toStrictEqual(2);

    expect(result).toStrictEqual(false); // No conflict, save can continue
  });

  it('should return conflict errors if actual conflicts exist (integration)', async() => {
    const initialValue = {
      metadata: { resourceVersion: '1' },
      spec:     {
        replicas:   1,
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };
    // User modifies 'replicas' to 2
    const value = {
      metadata: { resourceVersion: '1' },
      spec:     {
        replicas:   2,
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };
    // Server modified 'replicas' to 3
    const liveValue = {
      metadata: { resourceVersion: '2' },
      spec:     {
        replicas:   3, // Conflict with user's modification
        containers: [{
          name:  'app',
          image: 'image1'
        }]
      }
    };

    const result = await handleConflict(initialValue, value, liveValue, mockStore, 'namespace', mockToJSON);

    // resourceVersion should be updated
    expect(value.metadata.resourceVersion).toStrictEqual('2');
    expect(value.spec.replicas).toStrictEqual(3);

    // We expect an error message due to the conflict on 'spec.replicas'
    expect(result).toStrictEqual([
      'validation.conflict - {"fields":"spec.replicas","fieldCount":1}'
    ]);
    expect(mockStore.getters['i18n/t']).toHaveBeenCalledWith('validation.conflict', {
      fields:     'spec.replicas',
      fieldCount: 1
    });
  });

  it('should handle nested object changes and conflicts', async() => {
    const initialValue = {
      metadata: { resourceVersion: '1' },
      spec:     {
        selector: {
          matchLabels: {
            app: 'nginx',
            env: 'dev'
          }
        }
      }
    };
    // User modifies 'env' to 'prod'
    const value = {
      metadata: { resourceVersion: '1' },
      spec:     {
        selector: {
          matchLabels: {
            app: 'nginx',
            env: 'prod'
          }
        }
      }
    };
    // Live modifies 'app' to 'httpd'
    const liveValue = {
      metadata: { resourceVersion: '2' },
      spec:     {
        selector: {
          matchLabels: {
            app: 'httpd',
            env: 'dev'
          }
        }
      }
    };

    const result = await handleConflict(initialValue, value, liveValue, mockStore, 'namespace', mockToJSON);

    expect(mockStore.dispatch).toHaveBeenCalledTimes(3);

    // Should apply newest resource version
    expect(value.metadata.resourceVersion).toStrictEqual('2');

    // Background change on 'app' should be applied
    expect(value.spec.selector.matchLabels.app).toStrictEqual('httpd');
    // User's change on 'env' should have remained
    expect(value.spec.selector.matchLabels.env).toStrictEqual('prod');

    expect(result).toStrictEqual(false); // No direct conflict on a single field
  });

  it('should detect add/remove conflicts (integration)', async() => {
    const initialValue = {
      metadata: { resourceVersion: '1' },
      spec:     { ports: [{ port: 80 }, { port: 90 }] }
    };
    // Remove port 90 and add 443
    const value = {
      metadata: { resourceVersion: '1' },
      spec:     { ports: [{ port: 80 }, { port: 443 }] }
    };
    // Remove port 80
    const liveValue = {
      metadata: { resourceVersion: '2' },
      spec:     { ports: [{ port: 80 }, { port: 90 }] }
    };

    await handleConflict(initialValue, value, liveValue, mockStore, 'myNamespace', mockToJSON);

    expect(mockStore.dispatch).toHaveBeenCalledTimes(3);
    expect(value.metadata.resourceVersion).toStrictEqual('2');

    expect(value.spec.ports).toStrictEqual([{ port: 80 }, { port: 443 }]);
  });
});
