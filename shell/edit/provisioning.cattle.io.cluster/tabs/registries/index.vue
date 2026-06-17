<script>
import { Banner } from '@components/Banner';
import PrivateRegistry from '@shell/components/form/PrivateRegistry.vue';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import RegistryConfigs from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs';
import RegistryMirrors from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors';

export default {
  emits:      ['custom-registry-changed', 'registry-host-changed', 'registry-secret-changed', 'input', 'update-configs-changed', 'registry-validation-changed'],
  components: {
    Banner,
    PrivateRegistry,
    AdvancedSection,
    RegistryConfigs,
    RegistryMirrors
  },

  props: {
    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    showCustomRegistryInput: {
      type:     Boolean,
      required: true,
    },

    registryHost: {
      type:     String,
      required: false,
      default:  null
    },

    registrySecret: {
      type:     String,
      required: false,
      default:  null
    },

    showCustomRegistryAdvancedInput: {
      type:     Boolean,
      required: true,
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <h3>{{ t('cluster.privateRegistry.label') }}</h3>
    </div>
    <PrivateRegistry
      :value="registryHost"
      :enabled="showCustomRegistryInput"
      :mode="mode"
      :pull-secret="registrySecret"
      :register-before-hook="registerBeforeHook"
      @update:value="$emit('registry-host-changed', $event)"
      @update:enabled="$emit('custom-registry-changed', $event)"
      @update:pull-secret="$emit('registry-secret-changed', $event)"
    />
    <div
      class="row"
    >
      <AdvancedSection
        class="col span-12 advanced"
        :is-open-by-default="showCustomRegistryAdvancedInput"
        :mode="mode"
        data-testid="registries-advanced-section"
      >
        <Banner
          :closable="false"
          class="cluster-tools-tip"
          color="info"
          :label-key="value.isK3s ? 'cluster.privateRegistry.docsLinkK3s' : 'cluster.privateRegistry.docsLinkRke2'"
        />
        <RegistryMirrors
          :value="value"
          class="mt-20"
          :mode="mode"
          @update:value="$emit('input', $event)"
        />
        <RegistryConfigs
          :value="value"
          class="mt-20"
          :mode="mode"
          :cluster-register-before-hook="registerBeforeHook"
          @update:value="$emit('input', $event)"
          @updateConfigs="$emit('update-configs-changed', $event)"
          @validation-changed="$emit('registry-validation-changed', $event)"
        />
      </AdvancedSection>
    </div>
  </div>
</template>
