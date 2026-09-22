import { usePodSecurityAdmissionTemplates } from '@shell/composables/usePodSecurityAdmissionTemplates';
import { MANAGEMENT } from '@shell/config/types';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      }
    }),
    dispatch: mockDispatch,
  }),
}));

describe('composable: usePodSecurityAdmissionTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  });

  it('fetches all PSAs when management/canList allows listing PSA', async() => {
    const psas = [{ id: 'psa-1' }, { id: 'psa-2' }];

    mockDispatch.mockResolvedValue(psas);
    mockGetters['management/canList'] = jest.fn(() => true);

    const { allPSAs, fetchAllPSAs } = usePodSecurityAdmissionTemplates();

    await fetchAllPSAs();

    expect(mockGetters['management/canList']).toHaveBeenCalledWith(MANAGEMENT.PSA);
    expect(mockDispatch).toHaveBeenCalledWith('management/findAll', { type: MANAGEMENT.PSA });
    expect(allPSAs.value).toStrictEqual(psas);
  });

  it('does not fetch PSAs when management/canList disallows listing PSA', async() => {
    mockDispatch.mockResolvedValue([{ id: 'psa-1' }]);
    mockGetters['management/canList'] = jest.fn(() => false);

    const { allPSAs, fetchAllPSAs } = usePodSecurityAdmissionTemplates();

    await fetchAllPSAs();

    expect(mockDispatch).not.toHaveBeenCalledWith('management/findAll', expect.anything());
    expect(allPSAs.value).toStrictEqual([]);
  });

  it('records an error without throwing when the PSA request fails', async() => {
    mockDispatch.mockRejectedValue(new Error('PSA request failed'));
    mockGetters['management/canList'] = jest.fn(() => true);

    const { allPSAs, fetchAllPSAs, psaErrors } = usePodSecurityAdmissionTemplates();

    await expect(fetchAllPSAs()).resolves.toBeUndefined();

    expect(psaErrors.value).toStrictEqual(['PSA request failed']);
    expect(allPSAs.value).toStrictEqual([]);
  });

  it('clears prior errors at the start of each fetch', async() => {
    mockGetters['management/canList'] = jest.fn(() => true);

    const { fetchAllPSAs, psaErrors } = usePodSecurityAdmissionTemplates();

    mockDispatch.mockRejectedValueOnce(new Error('PSA request failed'));
    await fetchAllPSAs();
    expect(psaErrors.value).toStrictEqual(['PSA request failed']);

    mockDispatch.mockResolvedValueOnce([{ id: 'psa-1' }]);
    await fetchAllPSAs();
    expect(psaErrors.value).toStrictEqual([]);
  });
});
