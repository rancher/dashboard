import { useRegistryConfig } from '@shell/composables/useRegistryConfig';

const mockDispatch = jest.fn();

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: mockDispatch }) }));

const buildValue = (overrides: Record<string, any> = {}): any => ({
  agentConfig: {},
  spec:        { rkeConfig: {} },
  ...overrides,
});

describe('composable: useRegistryConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initRegistry', () => {
    it('prefers the cluster-scoped registry over the global system registry', async() => {
      mockDispatch.mockResolvedValue({ value: 'global.registry.io' });
      const value = buildValue({ agentConfig: { 'system-default-registry': 'cluster.registry.io' } });
      const { initRegistry, registryHost } = useRegistryConfig({ value });

      await initRegistry();

      expect(registryHost.value).toBe('cluster.registry.io');
    });

    it('falls back to the global system registry when no cluster-scoped registry is set', async() => {
      mockDispatch.mockResolvedValue({ value: 'global.registry.io' });
      const value = buildValue();
      const { initRegistry, registryHost, systemRegistry } = useRegistryConfig({ value });

      await initRegistry();

      expect(registryHost.value).toBe('global.registry.io');
      expect(systemRegistry.value).toBe('global.registry.io');
    });

    it('initializes empty registries/configs/mirrors when none exist', async() => {
      mockDispatch.mockResolvedValue({ value: '' });
      const value = buildValue();
      const { initRegistry } = useRegistryConfig({ value });

      await initRegistry();

      expect(value.spec.rkeConfig.registries).toStrictEqual({ configs: {}, mirrors: {} });
    });

    it('picks up an existing auth secret for the resolved registry host and shows the custom registry input', async() => {
      mockDispatch.mockResolvedValue({ value: 'my.registry.io' });
      const value = buildValue({ spec: { rkeConfig: { registries: { configs: { 'my.registry.io': { authConfigSecretName: 'my-secret' } } } } } });
      const { initRegistry, registrySecret, showCustomRegistryInput } = useRegistryConfig({ value });

      await initRegistry();

      expect(registrySecret.value).toBe('my-secret');
      expect(showCustomRegistryInput.value).toBe(true);
    });

    it('shows the advanced registry input when mirrors are configured', async() => {
      mockDispatch.mockResolvedValue({ value: '' });
      const value = buildValue({ spec: { rkeConfig: { registries: { mirrors: { 'docker.io': { endpoint: ['https://mirror.example.com'] } } } } } });
      const { initRegistry, showCustomRegistryAdvancedInput } = useRegistryConfig({ value });

      await initRegistry();

      expect(showCustomRegistryAdvancedInput.value).toBe(true);
    });
  });

  describe('setRegistryConfig', () => {
    it('clears the override when there is no hostname and a system registry is set', async() => {
      mockDispatch.mockResolvedValue({ value: 'global.registry.io' });
      const value = buildValue();
      const composable = useRegistryConfig({ value });

      await composable.initRegistry();
      composable.setRegistryConfig();

      expect(value.agentConfig['system-default-registry']).toBeUndefined();
    });

    it('clears the override when the hostname matches the system registry', () => {
      const value = buildValue();
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'global.registry.io';
      composable.systemRegistry.value = 'global.registry.io';
      composable.setRegistryConfig();

      expect(value.agentConfig['system-default-registry']).toBeUndefined();
    });

    it('sets the override to the hostname when it differs from the system registry', () => {
      const value = buildValue();
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'custom.registry.io';
      composable.systemRegistry.value = 'global.registry.io';
      composable.setRegistryConfig();

      expect(value.agentConfig['system-default-registry']).toBe('custom.registry.io');
    });

    it('sets the override to the hostname when there is no system registry', () => {
      const value = buildValue();
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'custom.registry.io';
      composable.setRegistryConfig();

      expect(value.agentConfig['system-default-registry']).toBe('custom.registry.io');
    });

    it('creates rkeConfig with the basic auth config when none exists', () => {
      const value = buildValue({ spec: {} });
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'custom.registry.io';
      composable.registrySecret.value = 'my-secret';
      composable.setRegistryConfig();

      expect(value.spec.rkeConfig.registries.configs['custom.registry.io']).toStrictEqual({
        authConfigSecretName: 'my-secret', caBundle: null, insecureSkipVerify: false, tlsSecretName: null,
      });
    });

    it('merges the basic auth config alongside existing registry configs', () => {
      const value = buildValue({ spec: { rkeConfig: { registries: { configs: { 'other.registry.io': { authConfigSecretName: 'other-secret' } } } } } });
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'custom.registry.io';
      composable.registrySecret.value = 'my-secret';
      composable.setRegistryConfig();

      const configs = value.spec.rkeConfig.registries.configs;

      expect(Object.keys(configs).sort()).toStrictEqual(['custom.registry.io', 'other.registry.io']);
    });

    it('adds a configs entry alongside existing mirrors when no configs exist yet', () => {
      const value = buildValue({ spec: { rkeConfig: { registries: { mirrors: { 'docker.io': {} } } } } });
      const composable = useRegistryConfig({ value });

      composable.registryHost.value = 'custom.registry.io';
      composable.registrySecret.value = 'my-secret';
      composable.setRegistryConfig();

      expect(value.spec.rkeConfig.registries.mirrors).toStrictEqual({ 'docker.io': {} });
      expect(value.spec.rkeConfig.registries.configs['custom.registry.io']).toBeDefined();
    });
  });

  describe('updateConfigs', () => {
    it('initializes rkeConfig when missing and sets the configs', () => {
      const value = buildValue({ spec: {} });
      const { updateConfigs } = useRegistryConfig({ value });
      const configs = { 'registry.io': {} };

      updateConfigs(configs);

      expect(value.spec.rkeConfig.registries.configs).toBe(configs);
    });

    it('sets the configs on an existing rkeConfig', () => {
      const value = buildValue({ spec: { rkeConfig: { registries: {} } } });
      const { updateConfigs } = useRegistryConfig({ value });
      const configs = { 'registry.io': {} };

      updateConfigs(configs);

      expect(value.spec.rkeConfig.registries.configs).toBe(configs);
    });
  });

  describe('registry input handlers', () => {
    it('updates the registry host', () => {
      const { handleRegistryHostChanged, registryHost } = useRegistryConfig({ value: buildValue() });

      handleRegistryHostChanged('registry.io');

      expect(registryHost.value).toBe('registry.io');
    });

    it('updates the registry secret', () => {
      const { handleRegistrySecretChanged, registrySecret } = useRegistryConfig({ value: buildValue() });

      handleRegistrySecretChanged('my-secret');

      expect(registrySecret.value).toBe('my-secret');
    });

    describe('toggleCustomRegistry', () => {
      it('sets showCustomRegistryInput and clears an existing host/secret', () => {
        const {
          toggleCustomRegistry, showCustomRegistryInput, registryHost, registrySecret
        } = useRegistryConfig({ value: buildValue() });

        registryHost.value = 'registry.io';
        registrySecret.value = 'secret';

        toggleCustomRegistry(true);

        expect(showCustomRegistryInput.value).toBe(true);
        expect(registryHost.value).toBeNull();
        expect(registrySecret.value).toBeNull();
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('re-initializes the registry when there is no existing host', () => {
        mockDispatch.mockResolvedValue({ value: '' });
        const { toggleCustomRegistry } = useRegistryConfig({ value: buildValue() });

        toggleCustomRegistry(true);

        expect(mockDispatch).toHaveBeenCalledWith('management/find', expect.any(Object));
      });
    });
  });
});
