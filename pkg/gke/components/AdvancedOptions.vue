<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapGetters } from 'vuex';

import { _CREATE } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Banner from '@components/Banner/Banner.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

const NONE_OPTION = 'none';

const MONITORING_OPTION = 'monitoring.googleapis.com/kubernetes';

const LOGGING_OPTION = 'logging.googleapis.com/kubernetes';

export default defineComponent({
  name: 'GKEAdvancedOptions',

  emits: ['update:loggingService', 'update:monitoringService', 'update:httpLoadBalancing', 'update:horizontalPodAutoscaling', 'update:enableKubernetesAlpha', 'update:maintenanceWindow', 'update:labels'],

  components: {
    LabeledSelect,
    Checkbox,
    Banner,
    KeyValue
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    loggingService: {
      type:    String,
      default: NONE_OPTION
    },

    monitoringService: {
      type:    String,
      default: NONE_OPTION
    },

    maintenanceWindow: {
      type:    String,
      default: ''
    },

    httpLoadBalancing: {
      type:    Boolean,
      default: false
    },

    horizontalPodAutoscaling: {
      type:    Boolean,
      default: false
    },

    enableKubernetesAlpha: {
      type:    Boolean,
      default: false
    },

    // these are gkeconfig.labels NOT normancluster.labels (handled in another accordion)
    labels: {
      type:    Object as PropType<{[key:string]: string}>,
      default: () => {
        return {};
      }
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    loggingEnabled: {
      get() {
        return !!this.loggingService && this.loggingService !== NONE_OPTION;
      },
      set(neu: boolean) {
        if (neu) {
          this.$emit('update:loggingService', LOGGING_OPTION);
        } else {
          this.$emit('update:loggingService', NONE_OPTION);
        }
      }
    },

    monitoringEnabled: {
      get() {
        return !!this.monitoringService && this.monitoringService !== NONE_OPTION;
      },
      set(neu: boolean) {
        if (neu) {
          this.$emit('update:monitoringService', MONITORING_OPTION);
        } else {
          this.$emit('update:monitoringService', NONE_OPTION);
        }
      }
    },

    maintenanceWindowOpts() {
      return [
        {
          value: '',
          label: this.t('gke.maintenanceWindow.any'),
        },
        {
          value: '00:00',
          label: '12:00AM',
        },
        {
          value: '03:00',
          label: '3:00AM',
        },
        {
          value: '06:00',
          label: '6:00AM',
        },
        {
          value: '09:00',
          label: '9:00AM',
        },
        {
          value: '12:00',
          label: '12:00PM',
        },
        {
          value: '15:00',
          label: '3:00PM',
        },
        {
          value: '19:00',
          label: '7:00PM',
        },
        {
          value: '21:00',
          label: '9:00PM',
        },
      ];
    },

    /**
     * Unclear why this is true on edit, but not create. It may be a bug: consequently, a banner is shown instead of using form validation to make this a strict requirement
     * See https://github.com/rancher/rancher/issues/32148#issuecomment-820010852
     */
    showLoggingMonitoringBanner() {
      if (this.mode === _CREATE) {
        return false;
      }

      return this.monitoringEnabled !== this.loggingEnabled;
    }
  },

});

</script>

<template>
  <div>
    <Banner
      color="info"
      label-key="gke.loggingService.infoBanner"
    />
    <Banner
      v-if="showLoggingMonitoringBanner"
      color="warning"
      label-key="gke.loggingService.warningBanner"
    />
    <div class="row mb-10">
      <div class="feature-checkboxes col span-6">
        <Checkbox
          v-model:value="loggingEnabled"
          :mode="mode"
          label-key="gke.loggingService.label"
        />
        <Checkbox
          v-model:value="monitoringEnabled"
          :mode="mode"
          label-key="gke.monitoringService.label"
        />
        <Checkbox
          :value="httpLoadBalancing"
          :mode="mode"
          label-key="gke.httpLoadBalancing.label"
          @update:value="$emit('update:httpLoadBalancing', $event)"
        />
        <Checkbox
          :value="horizontalPodAutoscaling"
          :mode="mode"
          label-key="gke.horizontalPodAutoscaling.label"
          @update:value="$emit('update:horizontalPodAutoscaling', $event)"
        />
        <Checkbox
          :value="enableKubernetesAlpha"
          :mode="mode"
          label-key="gke.enableKubernetesAlpha.label"
          :disabled="!isNewOrUnprovisioned"
          @update:value="$emit('update:enableKubernetesAlpha', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          :options="maintenanceWindowOpts"
          label-key="gke.maintenanceWindow.label"
          :value="maintenanceWindow"
          @selecting="$emit('update:maintenanceWindow', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Banner
          v-if="enableKubernetesAlpha"
          color="warning"
          label-key="gke.enableKubernetesAlpha.warning"
          icon="icon-warning"
        />
      </div>
    </div>
    <div class="row mt-20 mb-10">
      <div class="col span-12">
        <KeyValue
          :mode="mode"
          :value="labels"
          :as-map="true"
          :title="t('gke.clusterLabels.label')"
          :add-label="t('gke.clusterLabels.add')"
          @update:value="$emit('update:labels', $event)"
        >
          <template #title>
            <h4>
              {{ t('gke.clusterLabels.label') }}
            </h4>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.feature-checkboxes {
  display: flex;
  flex-direction: column;
  &>*{
    margin-bottom: 10px;
  }
}

</style>
