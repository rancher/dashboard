import { useStateColor } from '@shell/composables/useStateColor';
import type { StateSummaryEntry } from '@shell/composables/useStateColor';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      },
    }),
    dispatch: mockDispatch,
  }),
}));

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    { createParamsForPagination: jest.fn(() => 'page=1&pagesize=1') },
}));

jest.mock('@shell/plugins/steve/projectAndNamespaceFiltering.utils', () => ({
  __esModule: true,
  default:    { createParam: jest.fn(() => '') },
}));

describe('composable: useStateColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  });

  describe('toStateColor', () => {
    it.each([
      ['running', 'success'],
      ['active', 'success'],
      ['completed', 'success'],
      ['error', 'error'],
      ['failed', 'error'],
      ['stopped', 'error'],
      ['warning', 'warning'],
      ['initializing', 'warning'],
      ['pending', 'info'],
      ['waiting', 'info'],
      ['creating', 'info'],
    ])('should return %s color for known state "%s"', (state, expectedColor) => {
      const { toStateColor } = useStateColor();

      expect(toStateColor(state)).toStrictEqual(expectedColor);
    });

    it('should return "disabled" for state with "darker" color', () => {
      const { toStateColor } = useStateColor();

      expect(toStateColor('off')).toStrictEqual('disabled');
    });

    it('should return "info" for unknown states', () => {
      const { toStateColor } = useStateColor();

      expect(toStateColor('unknown-state')).toStrictEqual('info');
    });

    it('should be case-insensitive', () => {
      const { toStateColor } = useStateColor();

      expect(toStateColor('Running')).toStrictEqual(toStateColor('running'));
      expect(toStateColor('ERROR')).toStrictEqual(toStateColor('error'));
    });

    it('should handle empty string', () => {
      const { toStateColor } = useStateColor();

      expect(toStateColor('')).toStrictEqual('info');
    });

    it('should cache results across calls', () => {
      const { toStateColor } = useStateColor();

      const first = toStateColor('running');
      const second = toStateColor('running');

      expect(first).toStrictEqual(second);
      expect(first).toStrictEqual('success');
    });
  });

  describe('resolveStateColors', () => {
    const schema = { links: { collection: '/k8s/clusters/local/v1/pods' } };

    beforeEach(() => {
      mockGetters['cluster/schemaFor'] = () => schema;
      mockGetters['cluster/urlFor'] = () => schema.links.collection;
    });

    it('should not make requests when all states are already known', async() => {
      const { resolveStateColors } = useStateColor();

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { running: { total: 5, namespace: { default: 5 } } } }],
      }];

      await resolveStateColors(entries);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should fetch a resource to resolve unknown state colors', async() => {
      const { resolveStateColors } = useStateColor();

      mockDispatch.mockResolvedValueOnce({
        data: [{
          metadata: {
            state: {
              name: 'customState', error: true, transitioning: false
            }
          }
        }],
      });

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { customState: { total: 3, namespace: { default: 3 } } } }],
      }];

      await resolveStateColors(entries);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/request', { url: `${ schema.links.collection }?page=1&pagesize=1` });
    });

    it('should resolve error states from resource metadata', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch.mockResolvedValueOnce({
        data: [{
          metadata: {
            state: {
              name: 'init:Error', error: true, transitioning: false
            }
          }
        }],
      });

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { 'init:Error': { total: 1, namespace: { default: 1 } } } }],
      }];

      await resolveStateColors(entries);

      expect(toStateColor('init:Error')).toStrictEqual('error');
    });

    it('should resolve transitioning states as info', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch.mockResolvedValueOnce({
        data: [{
          metadata: {
            state: {
              name: 'init:0/1', error: false, transitioning: true
            }
          }
        }],
      });

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { 'init:0/1': { total: 2, namespace: { default: 2 } } } }],
      }];

      await resolveStateColors(entries);

      expect(toStateColor('init:0/1')).toStrictEqual('info');
    });

    it('should skip entries with null summary', async() => {
      const { resolveStateColors } = useStateColor();

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: null,
      }];

      await resolveStateColors(entries);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should skip summary properties that are not metadata.state.name', async() => {
      const { resolveStateColors } = useStateColor();

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.namespace', counts: { default: { total: 5, namespace: { default: 5 } } } }],
      }];

      await resolveStateColors(entries);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully and fall back to default color', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch.mockRejectedValueOnce(new Error('network error'));

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { networkFailState: { total: 1, namespace: { default: 1 } } } }],
      }];

      await resolveStateColors(entries);

      expect(toStateColor('networkFailState')).toStrictEqual('info');
    });

    it('should handle response with no resource data', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch.mockResolvedValueOnce({ data: [] });

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { emptyResult: { total: 1, namespace: { default: 1 } } } }],
      }];

      await resolveStateColors(entries);

      expect(toStateColor('emptyResult')).toStrictEqual('info');
    });

    it('should handle resource without metadata.state', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch.mockResolvedValueOnce({ data: [{ metadata: {} }] });

      const entries: StateSummaryEntry[] = [{
        type:    'pod',
        summary: [{ property: 'metadata.state.name', counts: { noStateField: { total: 1, namespace: { default: 1 } } } }],
      }];

      await resolveStateColors(entries);

      expect(toStateColor('noStateField')).toStrictEqual('info');
    });

    it('should use schema.links.collection for the request URL', async() => {
      const { resolveStateColors } = useStateColor();
      const customSchema = { links: { collection: '/k8s/clusters/c-m-abc123/v1/apps.deployments' } };

      mockGetters['cluster/schemaFor'] = () => customSchema;
      mockGetters['cluster/urlFor'] = () => customSchema.links.collection;
      mockDispatch.mockResolvedValueOnce({ data: [] });

      const entries: StateSummaryEntry[] = [{
        type:    'apps.deployments',
        summary: [{ property: 'metadata.state.name', counts: { urlTestState: { total: 1, namespace: { default: 1 } } } }],
      }];

      await resolveStateColors(entries);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/request', { url: `${ customSchema.links.collection }?page=1&pagesize=1` });
    });

    it('should resolve multiple unknown states across entries', async() => {
      const { toStateColor, resolveStateColors } = useStateColor();

      mockDispatch
        .mockResolvedValueOnce({
          data: [{
            metadata: {
              state: {
                name: 'stateA', error: true, transitioning: false
              }
            }
          }],
        })
        .mockResolvedValueOnce({
          data: [{
            metadata: {
              state: {
                name: 'stateB', error: false, transitioning: false
              }
            }
          }],
        });

      const entries: StateSummaryEntry[] = [
        {
          type:    'pod',
          summary: [{ property: 'metadata.state.name', counts: { stateA: { total: 1, namespace: { default: 1 } } } }],
        },
        {
          type:    'apps.deployments',
          summary: [{ property: 'metadata.state.name', counts: { stateB: { total: 2, namespace: { default: 2 } } } }],
        },
      ];

      await resolveStateColors(entries);

      expect(toStateColor('stateA')).toStrictEqual('error');
      expect(toStateColor('stateB')).toStrictEqual('warning');
    });
  });
});
