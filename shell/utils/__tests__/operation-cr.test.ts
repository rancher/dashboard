import { createOperationCR } from '@shell/utils/operation-cr';

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

  it('should surface create failures', async() => {
    const dispatch = jest.fn().mockRejectedValue(new Error('forbidden'));

    await expect(createOperationCR(dispatch, 'operation.test', {}, 'c-m-1', 'cluster-name')).rejects.toThrow('forbidden');
  });
});
