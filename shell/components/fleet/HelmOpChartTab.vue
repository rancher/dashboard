<script setup>
import { ref, watchEffect } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import { CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { CATALOG } from '@shell/config/labels-annotations';

const props = defineProps({
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
  sourceTypeOptions: {
    type:     Array,
    required: true
  },
  isSuseAppCollection: {
    type:    Boolean,
    default: false
  },
  appCoRepoName: {
    type:    String,
    default: ''
  },
  fvGetAndReportPathRules: {
    type:     Function,
    required: true
  }
});

const emit = defineEmits(['update:source-type']);

const store = useStore();
const { t } = useI18n(store);

const chartOptions = ref([]);
const versionOptions = ref([]);
const chartEntries = ref({});
const chartsLoading = ref(false);

const onSourceTypeSelect = (type) => {
  emit('update:source-type', type);
};

const onChartSelect = (val) => {
  props.value.spec.helm.chart = val;

  // Update available versions based on selected chart
  const versions = chartEntries.value[val];

  if (versions && versions.length) {
    versionOptions.value = [
      ...versions
        .map((entry) => entry.version)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
        .map((v) => ({
          label: v,
          value: v
        }))
    ];
  } else {
    versionOptions.value = [];
  }

  // Reset version when chart changes
  props.value.spec.helm.version = '';
};

const onVersionSelect = (val) => {
  props.value.spec.helm.version = val;
};

async function fetchAppCoCharts(repoName) {
  if (!repoName) {
    chartOptions.value = [];
    chartEntries.value = {};
    versionOptions.value = [];

    return;
  }

  chartsLoading.value = true;

  try {
    let repo = store.getters[`${ CATALOG._MANAGEMENT }/byId`](CATALOG_TYPES.CLUSTER_REPO, repoName);

    if (!repo) {
      try {
        repo = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, {
          type: CATALOG_TYPES.CLUSTER_REPO,
          id:   repoName,
        });
      } catch (e) {
        chartOptions.value = [];
        chartEntries.value = {};
        versionOptions.value = [];

        return;
      }
    }

    const index = await repo.followLink('index');
    const entries = index?.entries || {};

    chartEntries.value = entries;

    chartOptions.value = Object.keys(entries).sort().map((name) => ({
      label: name,
      value: name
    }));

    // If a chart is already selected (e.g. edit mode), populate its versions
    const currentChart = props.value.spec?.helm?.chart;

    if (currentChart && entries[currentChart]) {
      const versions = entries[currentChart];

      versionOptions.value = [
        ...versions
          .map((entry) => entry.version)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
          .map((v) => ({
            label: v,
            value: v
          }))
      ];
    }
  } catch (e) {
    console.error('Failed to fetch AppCo chart list:', e); // eslint-disable-line no-console
    chartOptions.value = [];
    chartEntries.value = {};
    versionOptions.value = [];
  } finally {
    chartsLoading.value = false;
  }
}

watchEffect(() => {
  if (props.isSuseAppCollection && props.appCoRepoName) {
    fetchAppCoCharts(props.appCoRepoName);
  }
});

</script>

<template>
  <div>
    <h2>{{ t('fleet.helmOp.source.release.title') }}</h2>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.helm.releaseName"
          :mode="mode"
          :label-key="`fleet.helmOp.source.release.label`"
          :placeholder="t(`fleet.helmOp.source.release.placeholder`, null, true)"
        />
      </div>
    </div>

    <h2>{{ t('fleet.helmOp.source.title') }}</h2>

    <div
      v-if="!isView"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledSelect
          :value="sourceType"
          :options="sourceTypeOptions"
          option-key="value"
          :mode="mode"
          :selectable="option => !option.disabled"
          :label="t('fleet.helmOp.source.selectLabel')"
          :disabled="isSuseAppCollection"
          @update:value="onSourceTypeSelect"
        />
      </div>
    </div>

    <template v-if="sourceType === SOURCE_TYPE.TARBALL">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.chart"
            :mode="mode"
            label-key="fleet.helmOp.source.tarball.label"
            :placeholder="t('fleet.helmOp.source.tarball.placeholder', null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.chart')"
            :required="true"
          />
        </div>
      </div>
    </template>

    <template v-if="sourceType === SOURCE_TYPE.REPO">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.repo"
            :mode="mode"
            :label-key="`fleet.helmOp.source.${ sourceType }.repo.label`"
            :placeholder="t(`fleet.helmOp.source.${ sourceType }.repo.placeholder`, null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.repo')"
            :required="true"
          />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.chart"
            :mode="mode"
            :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
            :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.chart')"
            :required="true"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="value.spec.helm.version"
            :mode="mode"
            label-key="fleet.helmOp.source.version.label"
            :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
            :rules="fvGetAndReportPathRules('spec.helm.version')"
          />
        </div>
      </div>
    </template>

    <template v-if="sourceType === SOURCE_TYPE.OCI">
      <div class="row mb-20">
        <div class="col span-6">
          <div class="row mb-20">
            <LabeledInput
              v-model:value="value.spec.helm.repo"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.repo')"
              :required="true"
              :disabled="isSuseAppCollection"
            />
            <!-- repo is pre-filled with oci://dp.apps.rancher.io/charts by the parent when isSuseAppCollection -->
          </div>
          <div class="row mb-20">
            <LabeledSelect
              v-if="isSuseAppCollection"
              :value="value.spec.helm.chart"
              :options="chartOptions"
              :loading="chartsLoading"
              :mode="mode"
              :label="t('fleet.helmOp.source.oci.chartName.label')"
              :placeholder="t('fleet.helmOp.source.oci.chartName.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.chart')"
              :required="true"
              :searchable="true"
              :taggable="true"
              option-key="value"
              @update:value="onChartSelect"
            />
            <LabeledInput
              v-else
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              :label="t('fleet.helmOp.source.oci.chartName.label')"
              :placeholder="t('fleet.helmOp.source.oci.chartName.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.chart')"
              :required="true"
            />
          </div>
        </div>
        <div class="col span-4 helm-version">
          <div class="row mb-20">
            <LabeledSelect
              v-if="isSuseAppCollection"
              :value="value.spec.helm.version"
              :options="versionOptions"
              :loading="chartsLoading"
              :mode="mode"
              :label="t('fleet.helmOp.source.version.label')"
              :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.version')"
              :required="true"
              :searchable="true"
              :taggable="true"
              option-key="value"
              @update:value="onVersionSelect"
            />
            <LabeledInput
              v-else
              v-model:value="value.spec.helm.version"
              :mode="mode"
              label-key="fleet.helmOp.source.version.label"
              :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.version')"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.helm-version {
  align-self: end;
}
</style>
