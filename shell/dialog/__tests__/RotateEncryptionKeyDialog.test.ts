import { shallowMount } from '@vue/test-utils';
import RotateEncryptionKeyDialog from '@shell/dialog/RotateEncryptionKeyDialog.vue';
import { OPERATION } from '@shell/config/types';
import { createOperationCR } from '@shell/utils/operation-cr';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));

describe('component: RotateEncryptionKeyDialog', () => {
  const t = (key: string) => key;

  const createWrapper = (cluster: any, dispatch = jest.fn()) => {
    return shallowMount(RotateEncryptionKeyDialog, {
      propsData: { cluster },
      global:    {
        mocks: {
          t,
          $store: {
            dispatch,
            getters: {
              isRancher:   true,
              'prefs/get': jest.fn((key: string) => (key.includes('date') ? 'YYYY-MM-DD' : 'HH:mm:ss')),
            }
          },
        },
        directives: { 'clean-html': true }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create operation CR for imported day 2 ops clusters', async() => {
    (createOperationCR as jest.Mock).mockResolvedValue(undefined);

    const cluster = {
      isImportedWithDayTwoOps: true,
      mgmt:                    { id: 'c-m-1' },
      save:                    jest.fn(),
      spec:                    { rkeConfig: {} }
    };
    const dispatch = jest.fn();
    const buttonDone = jest.fn();
    const wrapper = createWrapper(cluster, dispatch);

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).toHaveBeenCalledWith(dispatch, OPERATION.ENCRYPTION_KEY_ROTATE, {
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-1',
      }
    }, 'c-m-1', 'c-m-1');
    expect(cluster.save).not.toHaveBeenCalled();
    expect(buttonDone).toHaveBeenCalledWith(true);
  });

  it('should update generation and save for non-day-2 clusters', async() => {
    const save = jest.fn().mockResolvedValue(undefined);
    const cluster = {
      isImportedWithDayTwoOps: false,
      mgmt:                    { id: 'c-m-1' },
      save,
      spec:                    { rkeConfig: { rotateEncryptionKeys: { generation: 4 } } }
    };
    const buttonDone = jest.fn();
    const wrapper = createWrapper(cluster);

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).not.toHaveBeenCalled();
    expect(cluster.spec.rkeConfig.rotateEncryptionKeys.generation).toBe(5);
    expect(save).toHaveBeenCalledWith();
    expect(buttonDone).toHaveBeenCalledWith(true);
  });
});
