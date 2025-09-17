import { validateResource } from '@shell/utils/resource';
import { canViewResource } from '@shell/utils/auth';
import { getResourceFromRoute } from '@shell/utils/router';
import { RouteLocation } from 'vue-router';

// Mock dependencies from other modules
jest.mock('@shell/utils/auth', () => ({ canViewResource: jest.fn() }));

jest.mock('@shell/utils/router', () => ({ getResourceFromRoute: jest.fn() }));

// Typed mocks for better intellisense and type-checking
const mockCanViewResource = canViewResource as jest.Mock;
const mockGetResourceFromRoute = getResourceFromRoute as jest.Mock;

describe('validateResource', () => {
  let mockStore: any;
  let mockTo: RouteLocation;

  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    jest.clearAllMocks();

    // A basic mock for the Vuex store
    mockStore = {
      getters: {
        currentProduct: { name: 'explorer' },
        'i18n/t':       jest.fn((key, args) => `i18n: ${ key } ${ JSON.stringify(args) || '' }`),
      },
      dispatch: jest.fn(),
    };

    // A mock for the route location object
    mockTo = {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'pod',
        id:       'my-pod'
      }
    } as unknown as RouteLocation;
  });

  it('should return false if no product is set in the store', () => {
    mockStore.getters.currentProduct = null;
    mockGetResourceFromRoute.mockReturnValue('pod');

    const result = validateResource(mockStore, mockTo);

    expect(result).toBe(false);
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should return false if no resource is found in the route', () => {
    mockGetResourceFromRoute.mockReturnValue(null);

    const result = validateResource(mockStore, mockTo);

    expect(result).toBe(false);
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should return false if the user is authorized to view the resource', () => {
    mockGetResourceFromRoute.mockReturnValue('pod');
    mockCanViewResource.mockReturnValue(true);

    const result = validateResource(mockStore, mockTo);

    expect(result).toBe(false);
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should throw an error and dispatch loadingError if user cannot view the resource', () => {
    const resource = 'pod';

    mockGetResourceFromRoute.mockReturnValue(resource);
    mockCanViewResource.mockReturnValue(false);

    const errorMessage = `i18n: nav.failWhale.resourceNotFound {"resource":"${ resource }"}`;

    mockStore.getters['i18n/t'].mockReturnValue(errorMessage);

    expect(() => validateResource(mockStore, mockTo)).toThrow(errorMessage);
    expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', expect.any(Error));
    expect(mockStore.getters['i18n/t']).toHaveBeenCalledWith('nav.failWhale.resourceNotFound', { resource }, true);
  });
});
