import PaginationWrapper from '@shell/utils/pagination-wrapper';
import paginationUtils from '@shell/utils/pagination-utils';
import backOff from '@shell/utils/back-off';
import { STEVE_RESPONSE_CODE } from '@shell/types/rancher/steve.api';

jest.mock('@shell/utils/pagination-utils');
jest.mock('@shell/utils/back-off');

describe('paginationWrapper', () => {
  let store: any;
  let args: any;

  beforeEach(() => {
    store = {
      getters:    {},
      dispatch:   jest.fn(),
      $extension: {}
    };
    args = {
      $store:     store,
      id:         'test-id',
      enabledFor: {
        store:    'management',
        resource: {
          id:      'cluster',
          context: 'side-bar'
        }
      },
      onChange: jest.fn(),
    };

    (paginationUtils.isEnabled as jest.Mock).mockReturnValue(true);
    (backOff.getBackOff as jest.Mock).mockReturnValue(undefined);
    (backOff.recurse as jest.Mock).mockImplementation(async({ delayedFn }) => {
      return await delayedFn();
    });
    (backOff.reset as jest.Mock).mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const wrapper = new PaginationWrapper(args);

    expect(wrapper.isEnabled).toBe(true);
    expect(paginationUtils.isEnabled).toHaveBeenCalledWith({ rootGetters: store.getters, $extension: store.$extension }, args.enabledFor);
  });

  it('request should throw if not enabled', async() => {
    (paginationUtils.isEnabled as jest.Mock).mockReturnValue(false);
    const wrapper = new PaginationWrapper(args);

    await expect(wrapper.request({ pagination: {} as any })).rejects.toThrow('not supported');
  });

  it('request should handle HA scenario 1,2 case 1: active revision newer than target', async() => {
    (backOff.getBackOff as jest.Mock).mockReturnValue({ metadata: { revision: '10' } });
    const wrapper = new PaginationWrapper(args);

    await expect(wrapper.request({ pagination: {} as any, revision: '5' })).rejects.toThrow('Ignoring current request');
  });

  it('request should handle HA scenario 1,2 case 2: cached revision newer than target', async() => {
    const wrapper = new PaginationWrapper(args);

    // Mock internal state if possible or simulate a previous request
    // Since cachedRevision is private, we can simulate it by making a request first

    store.dispatch.mockResolvedValue({ pagination: { result: { revision: '10' } }, data: [] });
    await wrapper.request({ pagination: {} as any, revision: '10' }); // Sets cachedRevision to 10

    await expect(wrapper.request({ pagination: {} as any, revision: '5' })).resolves.toBeDefined(); // Should return cached result
    // Note: The implementation warns but returns cachedResult if available.
  });

  it('request should handle HA scenario 1,2 case 3: target revision newer than current', async() => {
    (backOff.getBackOff as jest.Mock).mockReturnValue({ metadata: { revision: '5' } });
    const wrapper = new PaginationWrapper(args);

    store.dispatch.mockResolvedValue({ pagination: { result: { revision: '10' } }, data: [] });
    await wrapper.request({ pagination: {} as any, revision: '10' });

    expect(backOff.reset).toHaveBeenCalledWith('test-id');
  });

  it('request should call backOff.recurse and dispatch findPage', async() => {
    const wrapper = new PaginationWrapper(args);
    const pagination = { page: 1 } as any;

    store.dispatch.mockResolvedValue({ pagination: { result: { revision: '1' } }, data: [] });

    await wrapper.request({ pagination });

    expect(backOff.recurse).toHaveBeenCalledWith(expect.objectContaining({
      id:       'test-id',
      metadata: { revision: undefined }
    }));
    expect(store.dispatch).toHaveBeenCalledWith('management/findPage', expect.objectContaining({
      opt:  expect.objectContaining({ pagination }),
      type: 'cluster'
    }));
  });

  it('request should setup watch on first call if onChange provided', async() => {
    const wrapper = new PaginationWrapper(args);

    store.dispatch.mockResolvedValue({ pagination: { result: { revision: '1' } }, data: [] });

    await wrapper.request({ pagination: {} as any });

    expect(store.dispatch).toHaveBeenCalledWith('management/watchEvent', expect.objectContaining({
      id:     'test-id',
      params: expect.objectContaining({ type: 'cluster' })
    }));
  });

  it('request should classify data if requested', async() => {
    args.formatResponse = { classify: true };
    const wrapper = new PaginationWrapper(args);
    const rawData = [{ id: '1' }];
    const classifiedData = [{ id: '1', _classified: true }];

    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/findPage') {
        return { pagination: { result: { revision: '1' } }, data: rawData };
      }
      if (action === 'management/createMany') {
        return classifiedData;
      }
    });

    const res = await wrapper.request({ pagination: {} as any });

    expect(res.data).toStrictEqual(classifiedData);
    expect(store.dispatch).toHaveBeenCalledWith('management/createMany', rawData);
  });

  it('onDestroy should unwatch', async() => {
    const wrapper = new PaginationWrapper(args);

    store.dispatch.mockResolvedValue({ pagination: { result: { revision: '1' } }, data: [] });

    await wrapper.request({ pagination: {} as any }); // Setup watch
    await wrapper.onDestroy();

    expect(store.dispatch).toHaveBeenCalledWith('management/unwatchEvent', expect.objectContaining({ id: 'test-id' }));
  });

  describe('backOff configuration', () => {
    it('continueOnError should return true for UNKNOWN_REVISION', async() => {
      const wrapper = new PaginationWrapper(args);

      store.dispatch.mockResolvedValue({ pagination: { result: { revision: '1' } }, data: [] });

      await wrapper.request({ pagination: {} as any });

      const recurseCall = (backOff.recurse as jest.Mock).mock.calls[0][0];
      const continueOnError = recurseCall.continueOnError;

      expect(await continueOnError({ status: 200 })).toBe(false);
      expect(await continueOnError({ status: 400, code: STEVE_RESPONSE_CODE.UNKNOWN_REVISION })).toBe(true);
      expect(await continueOnError({ status: 500 })).toBe(false);
    });
  });
});
