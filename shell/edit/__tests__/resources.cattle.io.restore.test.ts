import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import RestoreComponent from '@shell/edit/resources.cattle.io.restore.vue';
import { _CREATE } from '@shell/config/query-params';

describe('view: restore storage source switching', () => {
  let wrapper: any;

  const mockStore = {
    getters: {
      currentStore:                () => 'cluster',
      'cluster/schemaFor':         jest.fn(),
      'cluster/all':               jest.fn(),
      'cluster/paginationEnabled': jest.fn().mockReturnValue(false),
      'cluster/urlFor':            jest.fn(),
      'i18n/t':                    (val: string) => val,
      'i18n/exists':               jest.fn(),
    },
    dispatch: jest.fn().mockResolvedValue([])
  };

  const createWrapper = (propsOverride = {}) => {
    const defaultProps = {
      value: {
        metadata: { name: '', generateName: 'restore-' },
        spec:     { prune: true, deleteTimeoutSeconds: 10 }
      },
      mode: _CREATE,
      ...propsOverride
    };

    return mount(RestoreComponent, {
      global: {
        mocks: {
          $store:      mockStore,
          $route:      { query: {}, name: 'restore_route' },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false }
        }
      },
      propsData: defaultProps
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.dispatch.mockResolvedValue([]);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should not include S3 storageLocation when creating with useDefault', async() => {
    wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    wrapper.vm.storageSource = 'useDefault';
    await nextTick();

    expect(wrapper.vm.value.spec).toStrictEqual({
      prune:                true,
      deleteTimeoutSeconds: 10
    });
    expect(wrapper.vm.value.spec.storageLocation).toBeUndefined();
    expect(wrapper.vm.s3).toStrictEqual({});
  });

  it('should include S3 storageLocation when creating with An S3-compatible object store', async() => {
    wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    wrapper.vm.storageSource = 'configureS3';
    await nextTick();

    expect(wrapper.vm.value.spec.storageLocation).toBeDefined();
    expect(wrapper.vm.value.spec.storageLocation.s3).toBeDefined();
    expect(wrapper.vm.value.spec.prune).toBe(true);
    expect(wrapper.vm.value.spec.deleteTimeoutSeconds).toBe(10);
  });

  it('should not include S3 storageLocation when switching from S3-compatible object store back to useDefault', async() => {
    wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    wrapper.vm.storageSource = 'configureS3';
    wrapper.vm.s3 = {
      bucketName: 'test-bucket',
      endpoint:   'test-endpoint'
    };
    wrapper.vm.value.spec.storageLocation = { s3: wrapper.vm.s3 };
    await nextTick();

    expect(wrapper.vm.value.spec.storageLocation).toBeDefined();

    wrapper.vm.storageSource = 'useDefault';
    await nextTick();

    expect(wrapper.vm.value.spec.storageLocation).toBeUndefined();
    expect(wrapper.vm.s3).toStrictEqual({});
    expect(wrapper.vm.value.spec.prune).toBe(true);
    expect(wrapper.vm.value.spec.deleteTimeoutSeconds).toBe(10);
  });
});
