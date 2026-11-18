import { createOperationCR, isOperationInProgress } from '@shell/utils/operation-cr';

describe('util: operation-cr', () => {
  it('should dispatch create and save the operation resource', async() => {
    const save = jest.fn().mockResolvedValue({ id: 'op-1' });
    const dispatch = jest.fn().mockResolvedValue({ save });
    const spec = {
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-1',
      }
    };

    const out = await createOperationCR(dispatch, 'operation.test', spec, 'c-m-1', 'cluster-name');

    expect(dispatch).toHaveBeenCalledWith('management/create', {
      type:     'operation.test',
      metadata: {
        namespace:    'c-m-1',
        generateName: 'cluster-name-'
      },
      spec: {
        ...spec,
        ttl: 60,
      },
    }, { root: true });
    expect(save).toHaveBeenCalledWith();
    expect(out).toStrictEqual({ id: 'op-1' });
  });

  it('should not show the generated name growl by default', async() => {
    const notifyGeneratedName = jest.fn();
    const save = jest.fn().mockResolvedValue({ id: 'op-1', notifyGeneratedName });
    const dispatch = jest.fn().mockResolvedValue({ save });

    await createOperationCR(dispatch, 'operation.test', {}, 'c-m-1', 'cluster-name');

    expect(notifyGeneratedName).toHaveBeenCalledTimes(0);
  });

  it('should show the generated name growl when asked to', async() => {
    const notifyGeneratedName = jest.fn();
    const save = jest.fn().mockResolvedValue({ id: 'op-1', notifyGeneratedName });
    const dispatch = jest.fn().mockResolvedValue({ save });

    await createOperationCR(dispatch, 'operation.test', {}, 'c-m-1', 'cluster-name', { notifyGeneratedName: true });

    expect(notifyGeneratedName).toHaveBeenCalledWith();
  });

  it('should surface create failures', async() => {
    const dispatch = jest.fn().mockRejectedValue(new Error('forbidden'));

    await expect(createOperationCR(dispatch, 'operation.test', {}, 'c-m-1', 'cluster-name')).rejects.toThrow('forbidden');
  });
});

describe('util: isOperationInProgress', () => {
  it.each([
    ['Succeeded', false],
    ['Failed', false],
    ['Canceled', false],
    ['Pending', true],
    ['InProgress', true],
    ['', true],
  ])('should treat phase %p as in progress: %p', (phase, expected) => {
    expect(isOperationInProgress({ status: { phase } })).toBe(expected);
  });

  it.each([
    ['no status', {}],
    ['a null status', { status: null }],
    ['no operation', undefined],
  ])('should treat %s as in progress', (_, operation) => {
    expect(isOperationInProgress(operation)).toBe(true);
  });
});
