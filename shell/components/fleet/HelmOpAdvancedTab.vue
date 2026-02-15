<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import UnitInput from '@shell/components/form/UnitInput';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';
import { SOURCE_TYPE } from '@shell/config/product/fleet';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  sourceType: {
    type:     String,
    required: true
  },
  tempCachedValues: {
    type:     Object,
    required: true
  },
  correctDriftEnabled: {
    type:     Boolean,
    required: true
  },
  pollingInterval: {
    type:     Number,
    required: false,
    default:  undefined
  },
  isPollingEnabled: {
    type:     Boolean,
    required: true
  },
  showPollingIntervalMinValueWarning: {
    type:     Boolean,
    required: true
  },
  enablePollingTooltip: {
    type:    String,
    default: null
  },
  isNullOrStaticVersion: {
    type:     Boolean,
    required: true
  },
  downstreamSecretsList: {
    type:     Array,
    required: true
  },
  downstreamConfigMapsList: {
    type:     Array,
    required: true
  },
  registerBeforeHook: {
    type:     Function,
    required: true
  }
});

const emit = defineEmits([
  'update:auth',
  'update:cached-auth',
  'update:correct-drift',
  'update:downstream-resources',
  'toggle-polling',
  'update:polling-interval'
]);

const store = useStore();
const { t } = useI18n(store);

const updateAuth = (value, key) => {
  emit('update:auth', { value, key });
};

const updateCachedAuthVal = (value, key) => {
  emit('update:cached-auth', { value, key });
};

const updateCorrectDrift = (value) => {
  emit('update:correct-drift', value);
};

const updateDownstreamResources = (kind, list) => {
  emit('update:downstream-resources', { kind, list });
};

const togglePolling = (value) => {
  emit('toggle-polling', value);
};

const updatePollingInterval = (value) => {
  emit('update:polling-interval', value);
};
</script>

<template>
  <div>
    <Banner
      v-if="!isView"
      color="info"
      label-key="fleet.helmOp.add.steps.advanced.info"
      data-testid="helmOp-advanced-info"
    />

    <h2>{{ t('fleet.helmOp.auth.title') }}</h2>

    <SelectOrCreateAuthSecret
      :value="value.spec.helmSecretName"
      :register-before-hook="registerBeforeHook"
      :namespace="value.metadata.namespace"
      :delegate-create-to-parent="true"
      in-store="management"
      :mode="mode"
      generate-name="helmrepo-auth-"
      label-key="fleet.helmOp.auth.helm"
      :pre-select="tempCachedValues.helmSecretName"
      :cache-secrets="true"
      :show-ssh-known-hosts="true"
      @update:value="updateAuth($event, 'helmSecretName')"
      @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
    />

    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <Checkbox
          v-model:value="value.spec.insecureSkipTLSVerify"
          type="checkbox"
          label-key="fleet.helmOp.tls.insecure"
          :mode="mode"
        />
      </div>
    </div>

    <h2>{{ t('fleet.helmOp.resources.label') }}</h2>

    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <FleetSecretSelector
          :value="downstreamSecretsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          @update:value="updateDownstreamResources('Secret', $event)"
        />
      </div>
    </div>
    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <FleetConfigMapSelector
          :value="downstreamConfigMapsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          @update:value="updateDownstreamResources('ConfigMap', $event)"
        />
      </div>
    </div>
    <div class="resource-handling mb-30">
      <Checkbox
        :value="correctDriftEnabled"
        :tooltip="t('fleet.helmOp.resources.correctDriftTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.correctDrift"
        :mode="mode"
        @update:value="updateCorrectDrift"
      />
      <Checkbox
        v-model:value="value.spec.keepResources"
        :tooltip="t('fleet.helmOp.resources.keepResourcesTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.keepResources"
        :mode="mode"
      />
    </div>

    <template v-if="sourceType === SOURCE_TYPE.REPO">
      <h2>{{ t('fleet.helmOp.polling.label') }}</h2>
      <div class="row polling">
        <div class="col span-6">
          <Checkbox
            :value="isPollingEnabled"
            type="checkbox"
            label-key="fleet.helmOp.polling.enable"
            data-testid="helmOp-enablePolling-checkbox"
            :tooltip="enablePollingTooltip"
            :mode="mode"
            :disabled="isNullOrStaticVersion"
            @update:value="togglePolling"
          />
        </div>
        <template v-if="isPollingEnabled">
          <div class="col">
            <Banner
              v-if="showPollingIntervalMinValueWarning"
              color="warning"
              label-key="fleet.helmOp.polling.pollingInterval.minimumValueWarning"
              data-testid="helmOp-pollingInterval-minimumValueWarning"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              :value="pollingInterval"
              min="1"
              data-testid="helmOp-pollingInterval-input"
              :suffix="t('suffix.seconds', { count: pollingInterval })"
              :label="t('fleet.helmOp.polling.pollingInterval.label')"
              :mode="mode"
              tooltip-key="fleet.helmOp.polling.pollingInterval.tooltip"
              @blur.capture="updatePollingInterval(pollingInterval)"
              @update:value="updatePollingInterval"
            />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.resource-handling {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.polling {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
