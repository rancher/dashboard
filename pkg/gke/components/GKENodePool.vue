<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { _CREATE, _VIEW } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import Taints from '@shell/components/form/Taints.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import AuthScopes from './AuthScopes.vue';
import { GKEImageTypes } from '../util/gcp';
import type { GKEMachineTypeOption } from '../types/index.d.ts';

export default defineComponent({
  name: 'GKENodePool',

  components: {
    Checkbox,
    LabeledSelect,
    LabeledInput,
    UnitInput,
    Taints,
    ArrayList,
    KeyValue,
    AuthScopes
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNew: {
      type:    Boolean,
      default: false
    },

    clusterKubernetesVersion: {
      type:    String,
      default: ''
    },

    machineTypeOptions: {
      type:    Array as PropType<GKEMachineTypeOption[]>,
      default: () => []
    },

    serviceAccountOptions: {
      type:    Array as PropType<{label: string, kind?: string, value?: string | null, }[]>,
      default: () => []
    },

    loadingMachineTypes: {
      type:    Boolean,
      default: false
    },

    loadingServiceAccounts: {
      type:    Boolean,
      default: false
    },

    version: {
      type:    String,
      default: ''
    },

    imageType: {
      type:    String,
      default: ''
    },

    machineType: {
      type:    String,
      default: ''
    },

    diskType: {
      type:    String,
      default: ''
    },

    diskSizeGb: {
      type:    Number,
      default: 0
    },

    localSsdCount: {
      type:    Number,
      default: 0
    },

    preemptible: {
      type:    Boolean,
      default: false
    },

    taints: {
      type:    Array,
      default: () => []
    },

    labels: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    tags: {
      type:    Array,
      default: () => []
    },

    name: {
      type:    String,
      default: ''
    },

    initialNodeCount: {
      type:    [String, Number],
      default: ''
    },

    maxPodsConstraint: {
      type:    [String, Number],
      default: ''
    },

    autoscaling: {
      type:    Boolean,
      default: false
    },

    autoRepair: {
      type:    Boolean,
      default: false
    },

    autoUpgrade: {
      type:    Boolean,
      default: false
    },

    minNodeCount: {
      type:    [String, Number],
      default: ''
    },

    maxNodeCount: {
      type:    [String, Number],
      default: ''
    },

    oauthScopes: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    serviceAccount: {
      type:    String,
      default: null
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { upgradeKubernetesVersion: false, initialVersion: this.version };
  },

  watch: {
    upgradeKubernetesVersion(neu) {
      if (neu) {
        this.$emit('update:version', this.clusterKubernetesVersion);
      } else {
        this.$emit('update:version', this.initialVersion);
      }
    },

    clusterKubernetesVersion: {
      handler(neu: string) {
        if (neu && this.mode === _CREATE) {
          this.$emit('update:version', neu);
        }
      },
      immediate: true
    },

    autoscaling(neu: boolean) {
      if (!neu) {
        this.$emit('update:minNodeCount', null);
        this.$emit('update:maxNodeCount', null);
      } else {
        this.$emit('update:minNodeCount', '1');
        this.$emit('update:maxNodeCount', '3');
      }
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/withFallback' }),

    _VIEW() {
      return _VIEW;
    },

    // when initially created nodepools are configured to use the same k8s version as the control plane (clusterKubernetesVersion)
    // on edit, if the cp version is updated, the user is given the option to update each node pool as well
    upgradeAvailable() {
      if (this.mode === _CREATE) {
        return false;
      }

      return this.initialVersion !== this.clusterKubernetesVersion;
    },

    imageTypeOptions() {
      return (GKEImageTypes || []).map((type) => {
        return {
          value: type,
          label: this.t(`gke.imageType.${ type }`, null, type)
        };
      });
    },

    diskTypeOptions() {
      return [
        {
          label: this.t('gke.diskType.standard'),
          value: 'pd-standard',
        },
        {
          label: this.t('gke.diskType.ssd'),
          value: 'pd-ssd',
        }
      ];
    },

    selectedImageType: {
      get() {
        return this.imageTypeOptions.find((opt) => opt.value === this.imageType) || { value: this.imageType, label: this.t(`gke.imageType.${ this.imageType }`, null, this.imageType) };
      },
      set(neu: {label: string, kind?: string, value?: string, disabled?: boolean}) {
        this.$emit('update:imageType', neu.value);
      }
    },

    selectedMachineType: {
      get(): GKEMachineTypeOption | undefined {
        return this.machineTypeOptions.find((opt) => opt?.value === this.machineType);
      },
      set(neu: GKEMachineTypeOption) {
        this.$emit('update:machineType', neu.value);
      }
    },

    selectedDiskType: {
      get() {
        return this.diskTypeOptions.find((opt) => opt.value === this.diskType);
      },
      set(neu: {label:string, value: string}) {
        this.$emit('update:diskType', neu.value);
      }
    },

    selectedServiceAccount: {
      get() {
        return this.serviceAccountOptions.find((opt) => opt.value === this.serviceAccount) || { label: this.serviceAccount, value: this.serviceAccount };
      },
      set(neu: {label: string, value: string}) {
        this.$emit('update:serviceAccount', neu.value);
      }
    }
  },
});

</script>

<template>
  <div>
    <h3>{{ t('gke.groupDetails') }}</h3>
    <hr>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          :mode="mode"
          :modelValue="name"
          label-key="gke.groupName.label"
          :disabled="!isNew"
          :rules="rules.poolName"
          required
          @update:modelValue="$emit('update:name', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :mode="mode"
          :modelValue="initialNodeCount"
          label-key="gke.initialNodeCount.label"
          :rules="rules.initialNodeCount"
          @update:modelValue="$emit('update:initialNodeCount', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :mode="mode"
          :modelValue="maxPodsConstraint"
          label-key="gke.maxPodsConstraint.label"
          @update:modelValue="$emit('update:maxPodsConstraint', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4 checkbox-column">
        <Checkbox
          :mode="mode"
          :modelValue="autoscaling"
          label-key="gke.autoscaling.label"
          @update:modelValue="$emit('update:autoscaling', $event)"
        />
        <Checkbox
          :mode="mode"
          :modelValue="autoRepair"
          label-key="gke.autoRepair.label"
          @update:modelValue="$emit('update:autoRepair', $event)"
        />
        <Checkbox
          :mode="mode"
          :modelValue="autoUpgrade"
          label-key="gke.autoUpgrade.label"
          @update:modelValue="$emit('update:autoUpgrade', $event)"
        />
      </div>
      <template v-if="autoscaling">
        <div class="col span-4">
          <LabeledInput
            :mode="mode"
            type="number"
            :modelValue="minNodeCount"
            label-key="gke.minNodeCount.label"
            @update:modelValue="$emit('update:minNodeCount', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :mode="mode"
            type="number"
            :modelValue="maxNodeCount"
            label-key="gke.maxNodeCount.label"
            @update:modelValue="$emit('update:maxNodeCount', $event)"
          />
        </div>
      </template>
    </div>
    <h3 class="mt-20">
      {{ t('gke.nodeDetails') }}
    </h3>
    <hr>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-if="upgradeAvailable"
          v-model="upgradeKubernetesVersion"
          :mode="mode"
          :label="t('gke.version.upgrade', {clusterKubernetesVersion, version: initialVersion})"
          data-testid="gke-k8s-upgrade-checkbox"
        />
        <div
          v-else
        >
          <LabeledInput
            label-key="gke.version.label"
            :modelValue="version"
            disabled
            data-testid="gke-k8s-display"
          />
        </div>
      </div>
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          :options="serviceAccountOptions"
          :loading="loadingServiceAccounts"
          :modelValue="selectedServiceAccount"
          label-key="gke.serviceAccount.label"
          :disabled="!isNew"
          data-testid="gke-service-account-select"
          @selecting="e=>selectedServiceAccount=e "
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :modelValue="selectedImageType"
          :mode="mode"
          :options="imageTypeOptions"
          label-key="gke.imageType.label"
          @selecting="selectedImageType=$event"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          :options="machineTypeOptions"
          :loading="loadingMachineTypes"
          :modelValue="selectedMachineType"
          label-key="gke.machineType.label"
          :disabled="!isNew"
          @selecting="selectedMachineType = $event"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledSelect
          :mode="mode"
          :options="diskTypeOptions"
          :modelValue="selectedDiskType"
          label-key="gke.diskType.label"
          :disabled="!isNew"
          @selecting="selectedDiskType=$event"
        />
      </div>
      <div class="col span-4">
        <UnitInput
          :mode="mode"
          :modelValue="diskSizeGb"
          label-key="gke.diskSizeGb.label"
          suffix="GB"
          :disabled="!isNew"
          :rules="rules.diskSizeGb"
          @update:modelValue="$emit('update:diskSizeGb', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :mode="mode"
          :modelValue="localSsdCount"
          label-key="gke.localSsdCount.label"
          :disabled="!isNew"
          :rules="rules.ssdCount"
          @update:modelValue="$emit('update:localSsdCount', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          label-key="gke.preemptible.label"
          :mode="mode"
          :modelValue="preemptible"
          :disabled="!isNew"
          @update:modelValue="$emit('update:preemptible', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Taints
          :mode="mode"
          :modelValue="taints"
          :disabled="!isNew"
          :effect-values="{NO_SCHEDULE:'NoSchedule', PREFER_NO_SCHEDULE: 'PreferNoSchedule', NO_EXECUTE: 'NoExecute'}"
          data-testid="gke-taints-comp"
          @update:modelValue="$emit('update:taints', $event)"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <KeyValue
          :mode="mode"
          :modelValue="labels"
          :title="t('gke.nodeLabels.label')"
          :read-allowed="false"
          :as-map="true"
          :title-protip="t('gke.nodeLabels.tooltip')"
          :add-label="t('gke.nodeLabels.add')"
          :disabled="!isNew"
          @update:modelValue="$emit('update:labels', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <ArrayList
          :mode="isNew ? mode : _VIEW"
          :modelValue="tags"
          :title="t('gke.tags.label')"
          :add-label="t('gke.tags.add')"
          @update:modelValue="$emit('update:tags', $event)"
        />
      </div>
    </div>

    <AuthScopes
      :mode="mode"
      :modelValue="oauthScopes"
      :disabled="!isNew"
      @update:modelValue="$emit('update:oauthScopes', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.checkbox-column{
  display: flex;
  flex-direction: column;
  &>*{
    margin-bottom: 5px;
  }
}
</style>
