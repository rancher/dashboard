import { ref } from 'vue';
import { useStore } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export interface UseRegistryConfigProps {
  value: any;
}

/**
 * Resolves the cluster/system-default registry host + auth secret to preselect for the Registries
 * tab, and applies the user's registry choice back onto the cluster's rkeConfig.
 */
export function useRegistryConfig(props: UseRegistryConfigProps) {
  const store = useStore();

  const systemRegistry = ref('');
  const registryHost = ref<string | null>(null);
  const showCustomRegistryInput = ref(false);
  const showCustomRegistryAdvancedInput = ref(false);
  const registrySecret = ref<string | null>(null);

  async function initRegistry() {
    // Check for an existing cluster scoped registry
    const clusterRegistry = props.value.agentConfig?.['system-default-registry'] || '';

    // Check for the global registry
    systemRegistry.value = (await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.SYSTEM_DEFAULT_REGISTRY })).value || '';

    // The order of precedence is to use the cluster scoped registry
    // if it exists, then use the global scoped registry as a fallback
    if (clusterRegistry) {
      registryHost.value = clusterRegistry;
    } else {
      registryHost.value = systemRegistry.value;
    }

    let nextRegistrySecret = null;
    let regs = props.value.spec.rkeConfig.registries;

    if (!regs) {
      regs = {};
      props.value.spec.rkeConfig.registries = regs;
    }

    if (!regs.configs) {
      regs.configs = {};
    }

    if (!regs.mirrors) {
      regs.mirrors = {};
    }

    const config = regs.configs[registryHost.value as string];

    if (config) {
      nextRegistrySecret = config.authConfigSecretName;
    }

    registrySecret.value = nextRegistrySecret;

    const hasMirrorsOrAuthConfig = Object.keys(regs.configs).length > 0 || Object.keys(regs.mirrors).length > 0;

    if (registryHost.value || nextRegistrySecret) {
      showCustomRegistryInput.value = true;
    }

    if (hasMirrorsOrAuthConfig) {
      showCustomRegistryAdvancedInput.value = true;
    }
  }

  function setRegistryConfig() {
    const hostname = (registryHost.value || '').trim();

    if (systemRegistry.value) {
      // Empty string overrides the system default to nothing
      props.value.agentConfig['system-default-registry'] = '';
    } else {
      // No need to set anything
      props.value.agentConfig['system-default-registry'] = undefined;
    }
    if (!hostname || hostname === systemRegistry.value) {
      // Undefined removes the key which uses the global setting without hardcoding it into the config
      props.value.agentConfig['system-default-registry'] = undefined;
    } else {
      props.value.agentConfig['system-default-registry'] = hostname;
    }

    if (hostname && registrySecret.value) {
      // For a registry with basic auth, but no mirrors,
      // add a single registry config with the basic auth secret.
      const basicAuthConfig = {
        [hostname]: {
          authConfigSecretName: registrySecret.value,
          caBundle:             null,
          insecureSkipVerify:   false,
          tlsSecretName:        null,
        }
      };

      const rkeConfig = props.value.spec.rkeConfig;

      if (!rkeConfig) {
        props.value.spec.rkeConfig = { registries: { configs: basicAuthConfig } };
      } else if (rkeConfig.registries.configs && Object.keys(rkeConfig.registries.configs).length > 0) {
        // If some existing authentication secrets are already configured
        // for registry mirrors, the basic auth is added to the existing ones.
        const existingConfigs = rkeConfig.registries.configs;

        props.value.spec.rkeConfig.registries.configs = { ...basicAuthConfig, ...existingConfigs };
      } else {
        const existingMirrorAndAuthConfig = props.value.spec.rkeConfig.registries;

        props.value.spec.rkeConfig.registries = {
          ...existingMirrorAndAuthConfig,
          configs: basicAuthConfig
        };
      }
    }
  }

  function updateConfigs(configs: Record<string, any>) {
    // Update authentication configuration
    // for each mirror
    if (!props.value.spec?.rkeConfig) {
      props.value.spec.rkeConfig = { registries: {} };
    }
    props.value.spec.rkeConfig.registries.configs = configs;
  }

  function handleRegistryHostChanged(neu: string | null) {
    registryHost.value = neu;
  }

  function handleRegistrySecretChanged(neu: string | null) {
    registrySecret.value = neu;
  }

  function toggleCustomRegistry(neu: boolean) {
    showCustomRegistryInput.value = neu;
    if (registryHost.value) {
      registryHost.value = null;
      registrySecret.value = null;
    } else {
      initRegistry();
    }
  }

  return {
    systemRegistry,
    registryHost,
    showCustomRegistryInput,
    showCustomRegistryAdvancedInput,
    registrySecret,
    initRegistry,
    setRegistryConfig,
    updateConfigs,
    handleRegistryHostChanged,
    handleRegistrySecretChanged,
    toggleCustomRegistry,
  };
}
