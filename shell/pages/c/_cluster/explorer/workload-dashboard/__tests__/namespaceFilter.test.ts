import { getWorkloadNamespaceFilterParams } from '@shell/pages/c/_cluster/explorer/workload-dashboard/namespaceFilter';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    { createParamsFromNsFilter: jest.fn() },
}));

const mockCreateParams = stevePaginationUtils.createParamsFromNsFilter as jest.Mock;

const namespaces = [{ id: 'default' }, { id: 'kube-system' }];

function makeStore(overrides: Record<string, any> = {}) {
  const getters: Record<string, any> = {
    namespaceFilters: ['ns://default'],
    'cluster/all':    jest.fn(() => namespaces),
    isAllNamespaces:  false,
    currentCluster:   { isLocal: true },
    'prefs/get':      jest.fn(() => true),
    currentProduct:   { hideSystemResources: true },
    ...overrides,
  };

  return { getters } as any;
}

describe('fn: getWorkloadNamespaceFilterParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the params built from the namespace filter', () => {
    const params = { projectsOrNamespaces: [{ id: 'p1' }], filters: [{ id: 'f1' }] };

    mockCreateParams.mockReturnValue(params);

    expect(getWorkloadNamespaceFilterParams(makeStore())).toStrictEqual(params);
  });

  it('should build the params from the current store state', () => {
    getWorkloadNamespaceFilterParams(makeStore());

    expect(mockCreateParams).toHaveBeenCalledWith({
      allNamespaces:                 namespaces,
      selection:                     ['ns://default'],
      isAllNamespaces:               false,
      isLocalCluster:                true,
      showReservedRancherNamespaces: true,
      productHidesSystemNamespaces:  true,
    });
  });

  it('should fetch all namespaces from the cluster store', () => {
    const store = makeStore();

    getWorkloadNamespaceFilterParams(store);

    expect(store.getters['cluster/all']).toHaveBeenCalledWith(NAMESPACE);
  });

  it('should read the show reserved namespaces preference', () => {
    const store = makeStore();

    getWorkloadNamespaceFilterParams(store);

    expect(store.getters['prefs/get']).toHaveBeenCalledWith(ALL_NAMESPACES);
  });

  it('should pass undefined cluster and product values when there is no current cluster or product', () => {
    getWorkloadNamespaceFilterParams(makeStore({ currentCluster: null, currentProduct: undefined }));

    expect(mockCreateParams).toHaveBeenCalledWith(expect.objectContaining({
      isLocalCluster:               undefined,
      productHidesSystemNamespaces: undefined,
    }));
  });
});
