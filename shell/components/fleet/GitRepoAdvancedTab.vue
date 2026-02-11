<script setup>
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import UnitInput from '@shell/components/form/UnitInput';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';

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
  workspace: {
    type:     String,
    required: true
  },
  tlsMode: {
    type:     String,
    required: true
  },
  tlsOptions: {
    type:     Array,
    required: true
  },
  caBundle: {
    type:    String,
    default: null
  },
  isTls: {
    type:     Boolean,
    required: true
  },
  displayHelmRepoUrlRegex: {
    type:     Boolean,
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
  showPollingIntervalWarning: {
    type:     Boolean,
    required: true
  },
  specifyOption: {
    type:     String,
    required: true
  },
  registerBeforeHook: {
    type:     Function,
    required: true
  }
});

const emit = defineEmits([
  'update:tls-mode',
  'update:ca-bundle',
  'update:auth',
  'update:cached-auth',
  'update:correct-drift',
  'update:polling-enabled',
  'update:polling-interval'
]);

const store = useStore();
const { t } = useI18n(store);

const updateTlsMode = (event) => {
  emit('update:tls-mode', event);
};

const updateCaBundle = (value) => {
  emit('update:ca-bundle', value);
};

const updateAuth = (val, key) => {
  emit('update:auth', { value: val, key });
};

const updateCachedAuthVal = (val, key) => {
  emit('update:cached-auth', { value: val, key });
};

const updateCorrectDrift = (value) => {
  emit('update:correct-drift', value);
};

const enablePolling = (value) => {
  emit('update:polling-enabled', value);
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
      label-key="fleet.gitRepo.add.steps.advanced.info"
      data-testid="gitrepo-advanced-info"
    />

    <h2>{{ t('fleet.gitRepo.auth.title') }}</h2>
    <SelectOrCreateAuthSecret
      data-testid="gitrepo-git-auth"
      :value="value.spec.clientSecretName"
      :register-before-hook="registerBeforeHook"
      :namespace="value.metadata.namespace"
      :delegate-create-to-parent="true"
      in-store="management"
      :pre-select="tempCachedValues.clientSecretName"
      :mode="mode"
      generate-name="gitrepo-auth-"
      label-key="fleet.gitRepo.auth.git"
      :cache-secrets="true"
      :show-ssh-known-hosts="true"
      @update:value="updateAuth($event, 'clientSecretName')"
      @inputauthval="updateCachedAuthVal($event, 'clientSecretName')"
    />
    <SelectOrCreateAuthSecret
      data-testid="gitrepo-helm-auth"
      :value="value.spec.helmSecretName"
      :register-before-hook="registerBeforeHook"
      :namespace="value.metadata.namespace"
      :delegate-create-to-parent="true"
      in-store="management"
      :mode="mode"
      generate-name="helmrepo-auth-"
      label-key="fleet.gitRepo.auth.helm"
      :pre-select="tempCachedValues.helmSecretName"
      :cache-secrets="true"
      :show-ssh-known-hosts="true"
      @update:value="updateAuth($event, 'helmSecretName')"
      @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
    />

    <div
      v-if="displayHelmRepoUrlRegex"
      class="row mt-20"
    >
      <div
        class="col span-6"
        data-testid="gitrepo-helm-repo-url-regex"
      >
        <LabeledInput
          v-model:value="value.spec.helmRepoURLRegex"
          :mode="mode"
          label-key="fleet.gitRepo.helmRepoURLRegex"
        />
      </div>
    </div>

    <template v-if="isTls">
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledSelect
            :label="t('fleet.gitRepo.tls.label')"
            :mode="mode"
            :value="tlsMode"
            :options="tlsOptions"
            @update:value="updateTlsMode($event)"
          />
        </div>
        <div
          v-if="tlsMode === specifyOption"
          class="col span-6"
        >
          <LabeledInput
            :value="caBundle"
            :mode="mode"
            type="multiline"
            label-key="fleet.gitRepo.caBundle.label"
            placeholder-key="fleet.gitRepo.caBundle.placeholder"
            @update:value="updateCaBundle"
          />
        </div>
      </div>
    </template>
    <div class="spacer" />

    <h2>
      {{ t('fleet.gitRepo.ociStorageSecret.title') }}
    </h2>
    <div class="row mt-20">
      <div class="col span-6">
        <FleetOCIStorageSecret
          :secret="value.spec.ociRegistrySecret"
          :workspace="workspace"
          :mode="mode"
          @update:value="value.spec.ociRegistrySecret=$event"
        />
      </div>
    </div>
    <div class="spacer" />

    <h2>
      {{ t('fleet.gitRepo.resources.label') }}
    </h2>
    <div class="resource-handling">
      <Checkbox
        :value="correctDriftEnabled"
        :tooltip="t('fleet.gitRepo.resources.correctDriftTooltip')"
        data-testid="gitRepo-correctDrift-checkbox"
        class="check"
        type="checkbox"
        label-key="fleet.gitRepo.resources.correctDrift"
        :mode="mode"
        @update:value="updateCorrectDrift"
      />
      <Checkbox
        v-model:value="value.spec.keepResources"
        :tooltip="t('fleet.gitRepo.resources.keepResourcesTooltip')"
        data-testid="gitRepo-keepResources-checkbox"
        class="check"
        type="checkbox"
        label-key="fleet.gitRepo.resources.keepResources"
        :mode="mode"
      />
    </div>

    <div class="spacer" />
    <h2>
      {{ t('fleet.gitRepo.polling.label') }}
    </h2>
    <div class="row polling">
      <div class="col span-6">
        <Checkbox
          :value="value.isPollingEnabled"
          data-testid="gitRepo-enablePolling-checkbox"
          class="check"
          type="checkbox"
          label-key="fleet.gitRepo.polling.enable"
          :mode="mode"
          @update:value="enablePolling"
        />
      </div>
      <template v-if="value.isPollingEnabled">
        <div class="col">
          <Banner
            v-if="showPollingIntervalWarning"
            color="warning"
            label-key="fleet.gitRepo.polling.pollingInterval.minimumValueWarning"
            data-testid="gitRepo-pollingInterval-minimumValueWarning"
          />
          <Banner
            v-if="value.isWebhookConfigured"
            color="warning"
            label-key="fleet.gitRepo.polling.pollingInterval.webhookWarning"
            data-testid="gitRepo-pollingInterval-webhookWarning"
          />
        </div>
        <div class="col span-6">
          <UnitInput
            :value="pollingInterval"
            data-testid="gitRepo-pollingInterval-input"
            min="1"
            :suffix="t('suffix.seconds', { count: pollingInterval })"
            :label="t('fleet.gitRepo.polling.pollingInterval.label')"
            :mode="mode"
            tooltip-key="fleet.gitRepo.polling.pollingInterval.tooltip"
            @update:value="updatePollingInterval"
            @blur.capture="updatePollingInterval(pollingInterval)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .spacer {
    padding: 30px 0 0 0;
  }
  :deep() .select-or-create-auth-secret {
    .row {
      margin-top: 10px !important;
    }
  }
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
