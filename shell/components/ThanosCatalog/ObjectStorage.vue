<script>
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { Banner } from '@components/Banner';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Tolerations from '@shell/components/form/Tolerations';
import { RadioGroup } from '@components/Form/Radio';
import Reservation from '@shell/components/Reservation.vue';
import AwsS3, { answers as s3Answers } from '@shell/components/ThanosStorageProviders/AwsS3';
import AliyunOss, { answers as ossAnswers } from '@shell/components/ThanosStorageProviders/AliyunOss';
import Gcs, { answers as gcsAnswers } from '@shell/components/ThanosStorageProviders/Gcs';
import TencentcloudCos, { answers as cosAnswers } from '@shell/components/ThanosStorageProviders/TencentcloudCos';
import Azure, { answers as azureAnswers } from '@shell/components/ThanosStorageProviders/Azure';
import { random32 } from '@shell/utils/string';

const AWS_S3 = 'AwsS3';
const OBJECT_STORAGE_PROVIDERS = [
  {
    label:     'globalMonitoringPage.store.s3.label',
    component: AWS_S3,
    value:     'S3',
    answers:   s3Answers,
  },
  {
    label:     'globalMonitoringPage.store.azure.label',
    component: 'Azure',
    value:     'AZURE',
    answers:   azureAnswers,
  },
  {
    label:     'globalMonitoringPage.store.gcs.label',
    component: 'Gcs',
    value:     'GCS',
    answers:   gcsAnswers,
  },
  {
    label:     'globalMonitoringPage.store.aliyunoss.label',
    component: 'AliyunOss',
    value:     'ALIYUNOSS',
    answers:   ossAnswers,
  },
  {
    label:     'globalMonitoringPage.store.tencentcloudcos.label',
    component: 'TencentcloudCos',
    value:     'COS',
    answers:   cosAnswers,
  }
];
const THANOS_STORE = 'Thanos Store';
const THANOS_COMPACT = 'Thanos Compact';

export default {
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    },
    optionLabel: {
      type:    String,
      default: 'label',
    },
  },

  components: {
    Banner,
    RadioGroup,
    LabeledSelect,
    LabeledInput,
    AwsS3,
    AliyunOss,
    Gcs,
    TencentcloudCos,
    Azure,
    KeyValue,
    Tolerations,
    Reservation,
  },

  data() {
    return {
      objectStorageEnabled:   false,
      thanosStore:            THANOS_STORE,
      thanosCompact:          THANOS_COMPACT,
      objectStorageComponent: AwsS3,
      objectStorageProviders: OBJECT_STORAGE_PROVIDERS,
      compactTolerations:     [],
      storeTolerations:       [],
    };
  },

  watch: {
    objectStorageEnabled(neu) {
      if (neu) {
        !this.value.thanos.objectConfig.config && this.$set(this.value.thanos.objectConfig, 'config', {});
        !this.value.thanos.objectConfig?.type && this.$set(this.value.thanos.objectConfig, 'type', 'S3');
      } else {
        this.$set(this.value.thanos, 'objectConfig', {});
      }

      this.$set(this.value.thanos.compact, 'enabled', neu);
      this.$set(this.value.thanos.store, 'enabled', neu);
      this.$emit('updateWarning');
    },
    'value.thanos.objectConfig.type'(neu) {
      this.value?.thanos?.objectConfig?.config && this.$set(this.value.thanos.objectConfig, 'config', {});
      this.setObjectStorageComponent(neu);
    },
  },

  methods: {
    validate() {
      if (this.$refs.objectStorageComponent) {
        this.$refs.objectStorageComponent.validate();
      }
    },
    initValue() {
      if (this.value.thanos?.objectConfig?.type) {
        this.$set(this, 'objectStorageEnabled', true);
      }

      this.setObjectStorageComponent(this.value.thanos?.objectConfig?.type);
    },
    setObjectStorageComponent(pervider) {
      if (pervider) {
        const os = this.objectStorageProviders.find(os => os.value === pervider);

        if (os) {
          this.$set(this, 'objectStorageComponent', os.component);

          return;
        }
      }
      this.$set(this, 'objectStorageComponent', AwsS3);
    },
    updateCompactTolerations(inputVal) {
      this.$set(this.value.thanos.compact, 'tolerations', inputVal.map((item) => {
        delete item.vKey;

        return item;
      }));
    },
    updateStoreTolerations(inputVal) {
      this.$set(this.value.thanos.store, 'tolerations', inputVal.map((item) => {
        delete item.vKey;

        return item;
      }));
    },
    initTolerations() {
      this.$set(this, 'compactTolerations', this.value.thanos.compact.tolerations.map((item) => {
        item.vKey = random32();

        return item;
      }));
      this.$set(this, 'storeTolerations', this.value.thanos.store.tolerations.map((item) => {
        item.vKey = random32();

        return item;
      }));
    },
  },

  created() {
    this.initValue();
    this.initTolerations();
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="objectStorageEnabled"
      :closable="true"
      class="cluster-tools-tip"
      color="warning"
      :label="t('globalMonitoringPage.objectStorageWarning')"
      @close="hideClusterToolsTip = true"
    />

    <h3>{{ t('globalMonitoringPage.store.enabled.label') }}</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="objectStorageEnabled"
          name="objectStorageEnabled"
          :mode="mode"
          :labels="[t('generic.yes'), t('generic.no')]"
          :options="[true, false]"
        />
      </div>
    </div>

    <template v-if="objectStorageEnabled">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.thanos.objectConfig.type"
            :mode="mode"
            required
            :label="t('globalMonitoringPage.store.enabled.label')"
            :options="objectStorageProviders"
            :option-label="optionLabel"
            :localized-label="true"
          />
        </div>
      </div>
      <component
        :is="objectStorageComponent"
        ref="objectStorageComponent"
        :value="value"
        class="mb-20"
        :mode="mode"
      />

      <hr class="mt-40 mb-20">
      <Reservation
        :value="value"
        :component="thanosStore"
        class="mb-20"
        resources-key="thanos.store.resources"
        @updateWarning="$emit('updateWarning')"
      />

      <h3>{{ t('globalMonitoringPage.nodeSelector.helpText', {component: thanosStore}) }}</h3>
      <div class="row mb-20">
        <KeyValue
          v-model="value.thanos.store.nodeSelector"
          :mode="mode"
          :read-allowed="false"
          :protip="true"
          :add-label="t('globalMonitoringPage.nodeSelector.addSelectorLabel')"
        />
      </div>
      <div class="mb-20">
        <h3 class="mb-20">
          <t
            k="formScheduling.toleration.workloadTitle"
            :workload="thanosStore"
          />
        </h3>
        <div class="row">
          <Tolerations
            :value="storeTolerations"
            :mode="mode"
            @input="updateStoreTolerations"
          />
        </div>
      </div>

      <hr class="mt-40 mb-20">
      <Reservation
        :value="value"
        :component="thanosCompact"
        class="mb-20"
        resources-key="thanos.compact.resources"
        @updateWarning="$emit('updateWarning')"
      />

      <h3>{{ t('globalMonitoringPage.nodeSelector.helpText', {component: thanosCompact}) }}</h3>
      <div class="row mb-20">
        <KeyValue
          v-model="value.thanos.compact.nodeSelector"
          :mode="mode"
          :read-allowed="false"
          :protip="true"
          :add-label="t('globalMonitoringPage.nodeSelector.addSelectorLabel')"
        />
      </div>
      <div class="mb-20">
        <h3 class="mb-20">
          <t
            k="formScheduling.toleration.workloadTitle"
            :workload="thanosCompact"
          />
        </h3>
        <div class="row">
          <Tolerations
            :value="compactTolerations"
            :mode="mode"
            @input="updateCompactTolerations"
          />
        </div>
      </div>
    </template>
  </div>
</template>
