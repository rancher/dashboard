import { getHostedProviders, isHostedProvider, getCAPIProviders, isCAPIProvider } from '../provider';
import { ClusterProvisionerContext, IClusterProvisioner } from '@shell/core/types';

const DEFAULT_CONTEXT = {
  dispatch: {},
  getters:  {},
  axios:    {},
  t:        (args: any) => args.join(' '),
};

const MOCK_PROVIDERS: IClusterProvisioner[] = [
  { id: 'AKS', group: 'hosted' } as IClusterProvisioner,
  { id: 'EKS', group: 'hosted' } as IClusterProvisioner,
  { id: 'GKE', group: 'hosted' } as IClusterProvisioner,
  { id: 'alibaba', group: 'hosted' } as IClusterProvisioner,
  { id: 'capa', group: 'capi' } as IClusterProvisioner,
  { id: 'capv', group: 'capi' } as IClusterProvisioner,
  { id: 'other', group: 'other' } as IClusterProvisioner,
];

describe('utils/provider', () => {
  describe('getHostedProviders', () => {
    it('should return an empty array when context.$extension is undefined', () => {
      const context = { ...DEFAULT_CONTEXT } as ClusterProvisionerContext;
      const result = getHostedProviders(context);

      expect(result).toStrictEqual([]);
    });

    it('should return hosted providers when context.$extension is defined', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as unknown as ClusterProvisionerContext;

      const result = getHostedProviders(context);

      expect(result).toStrictEqual([
        { id: 'AKS', group: 'hosted' },
        { id: 'EKS', group: 'hosted' },
        { id: 'GKE', group: 'hosted' },
        { id: 'alibaba', group: 'hosted' },
      ]);
      expect(context.$extension.getProviders).toHaveBeenCalledWith(context);
    });

    it('should return capi providers when context.$extension is defined', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as unknown as ClusterProvisionerContext;

      const result = getCAPIProviders(context);

      expect(result).toStrictEqual([
        { id: 'capa', group: 'capi' },
        { id: 'capv', group: 'capi' },
      ]);

      expect(context.$extension.getProviders).toHaveBeenCalledWith(context);
    });

    it('should return an empty array if getProviders returns null', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(null) }
      } as unknown as ClusterProvisionerContext;

      const result = getHostedProviders(context);

      expect(result).toStrictEqual([]);
    });

    it('should return an empty array if getProviders returns undefined', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(undefined) }
      } as unknown as ClusterProvisionerContext;

      const result = getHostedProviders(context);

      expect(result).toStrictEqual([]);
    });
  });

  describe('isHostedProvider', () => {
    it('should return false if provisioner is not provided', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as ClusterProvisionerContext;

      expect(isHostedProvider(context, '')).toBe(false);
      expect(isHostedProvider(context, undefined as any)).toBe(false);
      expect(isHostedProvider(context, null as any)).toBe(false);
    });

    it('should return true only if provisioner is in the list of hosted providers', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as ClusterProvisionerContext;

      expect(isHostedProvider(context, 'AKS')).toBe(true);
      expect(isHostedProvider(context, 'eks')).toBe(true);
      expect(isCAPIProvider(context, 'capa')).toBe(false);
      expect(isHostedProvider(context, 'different')).toBe(false); // case-insensitive check
      expect(isHostedProvider(context, 'other')).toBe(false); // case-insensitive check
    });

    it('should return false if there are no hosted providers', () => {
      const context = { ...DEFAULT_CONTEXT, $extension: { getProviders: jest.fn().mockReturnValue([]) } } as ClusterProvisionerContext;

      expect(isHostedProvider(context, 'prov1')).toBe(false);
    });
  });
  describe('isCAPIProvider', () => {
    it('should return false if provisioner is not provided', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as ClusterProvisionerContext;

      expect(isCAPIProvider(context, '')).toBe(false);
      expect(isCAPIProvider(context, undefined as any)).toBe(false);
      expect(isCAPIProvider(context, null as any)).toBe(false);
    });

    it('should return true only if provisioner is in the list of CAPI providers', () => {
      const context = {
        ...DEFAULT_CONTEXT,
        $extension: { getProviders: jest.fn().mockReturnValue(MOCK_PROVIDERS) }
      } as ClusterProvisionerContext;

      expect(isCAPIProvider(context, 'capa')).toBe(true);
      expect(isCAPIProvider(context, 'capv')).toBe(true);
      expect(isCAPIProvider(context, 'eks')).toBe(false);
      expect(isCAPIProvider(context, 'different')).toBe(false); // case-insensitive check
      expect(isCAPIProvider(context, 'other')).toBe(false); // case-insensitive check
    });

    it('should return false if there are no hosted providers', () => {
      const context = { ...DEFAULT_CONTEXT, $extension: { getProviders: jest.fn().mockReturnValue([]) } } as ClusterProvisionerContext;

      expect(isHostedProvider(context, 'prov1')).toBe(false);
    });
  });
});
