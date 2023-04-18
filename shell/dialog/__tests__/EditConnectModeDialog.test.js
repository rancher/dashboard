import { shallowMount } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import EditConnectModeDialog from '@shell/dialog/EditConnectModeDialog.vue';

describe('component: EditConnectModeDialog', () => {
  it('should clear old error message after verifying the connection', async() => {
    const wrapper = shallowMount(EditConnectModeDialog, {
      propsData: {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.resolve({})),
          getters:  { 'i18n/t': jest.fn() }
        }
      }
    });

    await wrapper.setData({ errors: ['error'] });
    expect(wrapper.findComponent(Banner).props('label')).toStrictEqual('error');

    await wrapper.setData({ mode: { apiEndpoints: ['test'] } });
    const done = jest.fn();

    await wrapper.vm.validate(done);
    expect(done).toHaveBeenCalledWith(true);
    expect(wrapper.vm.$data.errors).toStrictEqual([]);
  });
  it('should show error message after verifying the connection failed', async() => {
    const wrapper = shallowMount(EditConnectModeDialog, {
      propsData: {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.reject(new Error('error'))),
          getters:  { 'i18n/t': jest.fn() }
        }
      }
    });

    await wrapper.setData({ mode: { apiEndpoints: ['test'] } });
    const done = jest.fn();

    await wrapper.vm.validate(done);
    expect(done).toHaveBeenCalledWith(false);
    expect(wrapper.findComponent(Banner).props('label')).toStrictEqual('error');
  });

  it('should return cluster connect mode', async() => {
    const updateStatusMapMock = jest.fn();
    const resp = {
      apiEndpoints: [
        'https://172.31.26.189:6443',
        'https://172.31.26.189:5443'
      ],
      baseType:       'connectionConfig',
      clusterID:      'c-w2wsg',
      directAccess:   'false',
      endpointStatus: [
        {
          apiEndpoint: 'https://172.31.26.189:6443',
          status:      true
        },
        {
          apiEndpoint: 'https://172.31.26.189:5443',
          error:       'endpoint checker for cluster c-w2wsg, failed to do ping request to endpoint https://172.31.26.189:5443: Get "https://172.31.26.189:5443/livez": dial tcp 172.31.26.189:5443: connect: connection refused',
          status:      false
        }
      ],
      timeout: 60000000000,
      type:    'connectionConfig'
    };
    const localThis = {
      $store: {
        dispatch() {
          return Promise.resolve(resp);
        }
      },
      updateStatusMap:    updateStatusMapMock,
      connectModeLoading: false,
      mode:               {},
      errors:             []
    };

    await EditConnectModeDialog.fetch.call(localThis);

    expect(localThis.mode).toStrictEqual(resp);
    expect(localThis.errors).toStrictEqual([]);
    expect(updateStatusMapMock).toHaveBeenCalledWith(resp.apiEndpoints, resp.endpointStatus);
  });

  it('should save error message if view connect config error', async() => {
    const updateStatusMapMock = jest.fn();
    const errorMessage = 'error message';
    const localThis = {
      $store: {
        dispatch() {
          return Promise.reject(errorMessage);
        }
      },
      updateStatusMap:    updateStatusMapMock,
      connectModeLoading: false,
      mode:               {},
      errors:             []
    };

    await EditConnectModeDialog.fetch.call(localThis);
    expect(updateStatusMapMock).not.toHaveBeenCalled();
    expect(localThis.errors).toStrictEqual([errorMessage]);
  });

  it('should save cluster connect mode', async() => {
    const requestMock = jest.fn();
    const doneMock = jest.fn();
    const localThis = {
      $store:  { dispatch: requestMock },
      loading: false,
      errors:  [],
      cluster: { id: 'test' },
      mode:    {}
    };

    await EditConnectModeDialog.methods.save.call(localThis, doneMock);

    expect(requestMock.mock.calls).toHaveLength(2);
    expect(requestMock.mock.calls[0][1]).toStrictEqual({
      url:    `/v3/clusters/${ localThis.cluster.id }?action=editConnectionConfig`,
      data:   {},
      method: 'post'
    });
    expect(requestMock.mock.calls[1][1]).toStrictEqual({
      url:    `/mcm/restart/${ localThis.cluster.id }`,
      method: 'get'
    });
    expect(doneMock).toHaveBeenCalledWith(true);
  });
  it('should save error message if save cluster connect mode error', async() => {
    const errorMessage = 'error message';
    const requestMock = jest.fn(() => Promise.reject(errorMessage));
    const doneMock = jest.fn();
    const localThis = {
      $store:  { dispatch: requestMock },
      loading: false,
      errors:  [],
      cluster: { id: 'test' },
      mode:    {}
    };

    await EditConnectModeDialog.methods.save.call(localThis, doneMock);

    expect(requestMock.mock.calls).toHaveLength(1);
    expect(localThis.errors).toStrictEqual([errorMessage]);
    expect(localThis.loading).toStrictEqual(false);
    expect(doneMock).toHaveBeenCalledWith(false);
  });

  it('should validate connect mode with errors', async() => {
    const resp = {
      apiEndpoints: [
        'https://172.31.26.189:6443',
        'https://172.31.26.189:5443'
      ],
      baseType:       'connectionConfig',
      clusterID:      'c-w2wsg',
      directAccess:   'false',
      endpointStatus: [
        {
          apiEndpoint: 'https://172.31.26.189:6443',
          status:      true
        },
        {
          apiEndpoint: 'https://172.31.26.189:5443',
          error:       'endpoint checker for cluster c-w2wsg, failed to do ping request to endpoint https://172.31.26.189:5443: Get "https://172.31.26.189:5443/livez": dial tcp 172.31.26.189:5443: connect: connection refused',
          status:      false
        }
      ],
      timeout: 60000000000,
      type:    'connectionConfig'
    };
    const requestMock = jest.fn(() => Promise.resolve(resp));
    const doneMock = jest.fn();
    const updateStatusMapMock = jest.fn();
    const localThis = {
      mode:            { apiEndpoints: ['https://172.31.26.189:6443'] },
      errors:          [],
      loading:         false,
      testSuccess:     false,
      $store:          { dispatch: requestMock },
      cluster:         { id: 'test' },
      updateStatusMap: updateStatusMapMock
    };

    await EditConnectModeDialog.methods.validate.call(localThis, doneMock);

    expect(requestMock).toHaveBeenCalledWith('rancher/request', {
      url:    `/v3/clusters/test?action=validateConnectionConfig`,
      method: 'post',
      data:   localThis.mode,
    });
    expect(localThis.errors).toStrictEqual([resp.endpointStatus[1].error]);
    expect(localThis.testSuccess).toBe(false);
    expect(doneMock).toHaveBeenCalledWith(false);
  });

  it('should validate connect mode without errors', async() => {
    const resp = {
      apiEndpoints: [
        'https://172.31.26.189:6443',
        'https://172.31.26.189:5443'
      ],
      baseType:       'connectionConfig',
      clusterID:      'c-w2wsg',
      directAccess:   'false',
      endpointStatus: [
        {
          apiEndpoint: 'https://172.31.26.189:6443',
          status:      true
        },
      ],
      timeout: 60000000000,
      type:    'connectionConfig'
    };
    const requestMock = jest.fn(() => Promise.resolve(resp));
    const doneMock = jest.fn();
    const updateStatusMapMock = jest.fn();
    const localThis = {
      mode:            { apiEndpoints: ['https://172.31.26.189:6443'] },
      errors:          [],
      loading:         false,
      testSuccess:     false,
      $store:          { dispatch: requestMock },
      cluster:         { id: 'test' },
      updateStatusMap: updateStatusMapMock
    };

    await EditConnectModeDialog.methods.validate.call(localThis, doneMock);

    expect(requestMock).toHaveBeenCalledWith('rancher/request', {
      url:    `/v3/clusters/test?action=validateConnectionConfig`,
      method: 'post',
      data:   localThis.mode,
    });
    expect(localThis.errors).toHaveLength(0);
    expect(localThis.testSuccess).toBe(true);
    expect(doneMock).toHaveBeenCalledWith(true);
  });

  it('should show errors if apiEndpoints is empty', async() => {
    const doneMock = jest.fn();
    const tMock = jest.fn();
    const localThis = {
      mode:        { apiEndpoints: [] },
      errors:      [],
      loading:     false,
      testSuccess: false,
      t:           tMock,
    };

    await EditConnectModeDialog.methods.validate.call(localThis, doneMock);

    expect(tMock).toHaveBeenCalledWith('clusterConnectMode.apiEndpoint.required');
    expect(localThis.errors).toHaveLength(1);
    expect(localThis.testSuccess).toBe(false);
  });
});
