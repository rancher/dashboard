<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { set } from '@shell/utils/object';
import { isPrerelease } from '@shell/utils/version';
import { ZERO_TIME } from '@shell/config/types';
import { FLEET_APPCO_AUTH_GENERATE_NAME } from '@shell/utils/fleet-appco';
import dayjs from 'dayjs';
import LazyImage from '@shell/components/LazyImage';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import Labels from '@shell/components/form/Labels';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { RcSection } from '@components/RcSection';
import HelmOpAppCoResourcesSection from '@shell/components/fleet/HelmOpAppCoResourcesSection.vue';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';
import HelmOpValuesTab from '@shell/components/fleet/HelmOpValuesTab.vue';
import HelmOpTargetTab from '@shell/components/fleet/HelmOpTargetTab.vue';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import AppCoVersionSelect from '@shell/components/fleet/AppCoVersionSelect.vue';
import { _VIEW, _CREATE, _EDIT } from '@shell/config/query-params';

interface ChartEntry {
  version: string;
  created?: string;
  icon?: string;
}

const props = withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  realMode: string;
  appCoChartEntries?: Record<string, ChartEntry[]>;
  appCoChartsLoading?: boolean;
  chartValues?: string;
  chartValuesInit?: string;
  yamlForm?: string;
  yamlFormOptions?: any[];
  yamlDiffModeOptions?: any[];
  isYamlDiff?: boolean;
  editorMode?: string;
  diffMode?: string;
  isRealModeEdit?: boolean;
  targetsCreated?: string;
  correctDriftEnabled?: boolean;
  downstreamSecretsList?: string[];
  downstreamConfigMapsList?: string[];
  registerBeforeHook:(...args: any[]) => void;
  hideTarget?: boolean;
  hideAdvanced?: boolean;
  hideChartConfig?: boolean;
}>(), {
  appCoChartEntries:        () => ({} as Record<string, ChartEntry[]>),
  appCoChartsLoading:       false,
  chartValues:              '',
  chartValuesInit:          '',
  yamlForm:                 '',
  yamlFormOptions:          () => [],
  yamlDiffModeOptions:      () => [],
  isYamlDiff:               false,
  editorMode:               '',
  diffMode:                 '',
  isRealModeEdit:           false,
  targetsCreated:           '',
  correctDriftEnabled:      false,
  downstreamSecretsList:    () => [],
  downstreamConfigMapsList: () => [],
  hideTarget:               false,
  hideAdvanced:             false,
  hideChartConfig:          false,
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:value', value: any): void;
  (e: 'update:targets', value: any): void;
  (e: 'targets-created', value: string): void;
  (e: 'update:yaml-form'): void;
  (e: 'update:chart-values', value: string): void;
  (e: 'update:diff-mode', value: string): void;
  (e: 'update:auth', value: { value: any; key: string }): void;
  (e: 'update:cached-auth', value: { value: any; key: string }): void;
  (e: 'update:correct-drift', value: boolean): void;
  (e: 'update:downstream-resources', value: { kind: string; list: string[] }): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const selectedChartName = computed(() => props.value.spec?.helm?.chart || '');

const selectedChartVersions = computed(() => {
  const chart = selectedChartName.value;

  if (!chart || !props.appCoChartEntries[chart]) {
    return [];
  }

  return props.appCoChartEntries[chart];
});

const versionOptions = computed(() => {
  return selectedChartVersions.value
    .filter((entry) => !isPrerelease(entry.version))
    .map((entry) => {
      const isZeroTime = !entry.created || entry.created === ZERO_TIME;

      return {
        label: entry.version,
        value: entry.version,
        date:  isZeroTime ? '' : dayjs(entry.created).format('MMM D, YYYY'),
      };
    })
    .sort((a, b) => b.value.localeCompare(a.value, undefined, { numeric: true, sensitivity: 'base' }));
});

const selectedVersion = computed(() => props.value.spec?.helm?.version || '');

const selectedChartEntry = computed(() => {
  const chart = selectedChartName.value;
  const version = selectedVersion.value;

  if (!chart || !props.appCoChartEntries[chart]) {
    return null;
  }

  return props.appCoChartEntries[chart].find((e) => e.version === version) || props.appCoChartEntries[chart][0] || null;
});

const chartIcon = computed(() => {
  const chart = selectedChartName.value;
  const entries = props.appCoChartEntries[chart];

  // Icon is chart-level, not version-specific — use the first (latest) entry which always carries it
  return entries?.[0]?.icon || '';
});

const chartSubHeaderItems = computed(() => {
  const items = [];
  const entry = selectedChartEntry.value;

  if (!entry) {
    return items;
  }

  if (entry.version) {
    items.push({
      icon:        'icon-version-alt',
      iconTooltip: { key: 'tableHeaders.version' },
      label:       entry.version,
    });
  }

  if (entry.created && entry.created !== ZERO_TIME) {
    items.push({
      icon:        'icon-refresh-alt',
      iconTooltip: { key: 'tableHeaders.lastUpdated' },
      label:       dayjs(entry.created).format('MMM D, YYYY'),
    });
  }

  return items;
});

const onVersionSelect = (val: string) => {
  set(props.value, 'spec.helm.version', val);
};

const appCoLockedSecrets = computed(() => {
  return props.downstreamSecretsList.filter((name) => name.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));
});

const isStandaloneAdvanced = computed(() => props.hideChartConfig && props.hideTarget && !props.hideAdvanced);
const isStandaloneTarget = computed(() => props.hideChartConfig && !props.hideTarget && props.hideAdvanced);

const advancedWrapperProps = computed(() => {
  if (isStandaloneAdvanced.value) {
    return {};
  }

  return {
    title:      t('fleet.helmOp.appCoConfig.advanced'),
    mode:       'with-header',
    type:       'primary',
    expandable: true,
    expanded:   false,
  };
});

const isView = computed(() => props.mode === _VIEW);
const isCreate = computed(() => props.mode === _CREATE);
const isEdit = computed(() => props.mode === _EDIT);

const valuesTabRef = ref<{ refreshYaml?:() => void } | null>(null);
const valuesExpanded = ref(true);

watch(valuesExpanded, (expanded) => {
  if (expanded) {
    refreshYamlEditor();
  }
});

const refreshYamlEditor = () => {
  nextTick(() => {
    valuesTabRef.value?.refreshYaml?.();
  });
};

defineExpose({ refreshYamlEditor });

</script>

<template>
  <div class="appco-config-tab">
    <div
      v-if="!hideChartConfig"
      class="appco-main-section"
    >
      <!-- Chart header -->
      <div
        v-if="selectedChartName"
        class="chart-header"
        data-testid="appco-config-chart-header"
      >
        <div class="chart-header-icon">
          <LazyImage
            v-if="chartIcon"
            :src="chartIcon"
            class="chart-icon"
            :alt="selectedChartName"
          />
          <div
            v-else
            class="chart-icon-placeholder"
          >
            <i
              class="icon icon-helm"
              aria-hidden="true"
            />
          </div>
        </div>
        <div class="chart-header-info">
          <h3 class="chart-header-title">
            {{ selectedChartName }}
          </h3>
          <AppChartCardSubHeader
            :items="chartSubHeaderItems"
            :remove-margin-bottom="true"
          />
        </div>
      </div>

      <!-- Chart version VIEW -->
      <div
        v-if="isView"
        class="appco-main-content"
      >
        <!-- Auth -->
        <SelectOrCreateAuthSecret
          :vertical="true"
          :value="value.spec.helmSecretName"
          :namespace="value.metadata.namespace"
          :limit-to-namespace="true"
          :delegate-create-to-parent="true"
          :register-before-hook="registerBeforeHook"
          in-store="management"
          :mode="mode"
          :generate-name="FLEET_APPCO_AUTH_GENERATE_NAME"
          label-key="fleet.helmOp.auth.appco"
          :fixed-http-basic-auth="true"
          :filter-basic-auth="FLEET_APPCO_AUTH_GENERATE_NAME"
          :allow-none="false"
          :cache-secrets="true"
          data-testid="appco-config-auth"
          @update:value="emit('update:auth', { value: $event, key: 'helmSecretName' })"
          @inputauthval="emit('update:cached-auth', { value: $event, key: 'helmSecretName' })"
        />
        <!-- Name and Description -->
        <NameNsDescription
          :value="value"
          :horizontal="true"
          :namespaced="false"
          :mode="mode"
          :name-label="'fleet.helmOp.appCoConfig.name'"
          :no-bottom-margin="true"
          data-testid="appco-config-name-ns-description"
          @update:value="emit('update:value', $event)"
        />
        <div class="col span-4">
          <AppCoVersionSelect
            :value="selectedVersion"
            :options="versionOptions"
            :loading="appCoChartsLoading"
            :mode="mode"
            data-testid="appco-config-version"
            @update:value="onVersionSelect"
          />
        </div>
      </div>
      <!-- Chart version CREATE -->
      <div
        v-else-if="isCreate"
        class="appco-main-content"
      >
        <NameNsDescription
          :value="value"
          :namespaced="false"
          :mode="mode"
          :name-label="'fleet.helmOp.appCoConfig.name'"
          :no-bottom-margin="true"
          data-testid="appco-config-name-ns-description"
          @update:value="emit('update:value', $event)"
        />
      </div>

      <!-- Chart version EDIT -->
      <div
        v-else-if="isEdit"
        class="appco-main-content"
      >
        <!-- Auth -->
        <SelectOrCreateAuthSecret
          :value="value.spec.helmSecretName"
          :namespace="value.metadata.namespace"
          :limit-to-namespace="true"
          :delegate-create-to-parent="true"
          :register-before-hook="registerBeforeHook"
          in-store="management"
          :mode="_VIEW"
          :generate-name="FLEET_APPCO_AUTH_GENERATE_NAME"
          label-key="fleet.helmOp.auth.appco"
          :fixed-http-basic-auth="true"
          :filter-basic-auth="FLEET_APPCO_AUTH_GENERATE_NAME"
          :allow-none="false"
          :cache-secrets="true"
          data-testid="appco-config-auth"
          @update:value="emit('update:auth', { value: $event, key: 'helmSecretName' })"
          @inputauthval="emit('update:cached-auth', { value: $event, key: 'helmSecretName' })"
        />
        <div class="col span-3">
          <AppCoVersionSelect
            :value="selectedVersion"
            :options="versionOptions"
            :loading="appCoChartsLoading"
            :mode="mode"
            data-testid="appco-config-version"
            @update:value="onVersionSelect"
          />
        </div>
        <!-- Name and Description -->
        <NameNsDescription
          :value="value"
          :namespaced="false"
          :mode="mode"
          :name-label="'fleet.helmOp.appCoConfig.name'"
          data-testid="appco-config-name-ns-description"
          @update:value="emit('update:value', $event)"
        />
      </div>
    </div>
    <!-- Deploy To (standalone Target tab) -->
    <HelmOpTargetTab
      v-if="!hideTarget && isStandaloneTarget"
      :value="value"
      :mode="mode"
      :real-mode="realMode"
      :targets-created="targetsCreated"
      :hide-additional-options="true"
      :compact="true"
      data-testid="appco-config-target"
      @update:targets="emit('update:targets', $event)"
      @targets-created="emit('targets-created', $event)"
    />

    <!-- Deploy To -->
    <RcSection
      v-if="!hideTarget && !isStandaloneTarget"
      :title="t('fleet.helmOp.target.title')"
      mode="with-header"
      type="primary"
      :expandable="false"
      data-testid="appco-config-rcsection-target"
    >
      <HelmOpTargetTab
        :value="value"
        :mode="mode"
        :real-mode="realMode"
        :targets-created="targetsCreated"
        :hide-additional-options="true"
        :compact="true"
        data-testid="appco-config-target"
        @update:targets="emit('update:targets', $event)"
        @targets-created="emit('targets-created', $event)"
      />
    </RcSection>

    <!-- Advanced section -->
    <component
      :is="isStandaloneAdvanced ? 'div' : RcSection"
      v-if="!hideAdvanced"
      v-bind="advancedWrapperProps"
      data-testid="appco-config-advanced"
    >
      <div class="content-group">
        <div
          v-if="isView"
          class="row"
        >
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.releaseName"
              :mode="mode"
              :label-key="'fleet.helmOp.source.release.fullLabel'"
              :placeholder="t('fleet.helmOp.source.release.placeholder', null, true)"
              data-testid="appco-config-release-name"
            />
          </div>
        </div>
        <RcSection
          :title="t('fleet.helmOp.resources.label')"
          mode="with-header"
          type="secondary"
          :background="isStandaloneAdvanced ? 'secondary' : undefined"
          expandable
          :expanded="true"
          data-testid="appco-config-resources"
        >
          <HelmOpAppCoResourcesSection
            :value="value"
            :mode="mode"
            :correct-drift-enabled="correctDriftEnabled"
            :downstream-secrets-list="downstreamSecretsList"
            :downstream-config-maps-list="downstreamConfigMapsList"
            :locked-secrets="appCoLockedSecrets"
            :compact="true"
            data-testid="appco-config-resources-section"
            @update:correct-drift="emit('update:correct-drift', $event)"
            @update:downstream-resources="emit('update:downstream-resources', $event)"
          />
        </RcSection>
        <RcSection
          :title="t('fleet.helmOp.target.clusterDeploymentSettings')"
          mode="with-header"
          type="secondary"
          :background="isStandaloneAdvanced ? 'secondary' : undefined"
          expandable
          :expanded="true"
          data-testid="appco-config-target-options"
        >
          <HelmOpTargetOptionsSection
            :value="value"
            :mode="mode"
            :compact="true"
            data-testid="appco-config-target-options-section"
          />
        </RcSection>
        <RcSection
          :title="t('generic.labelsAndAnnotations', {}, true)"
          mode="with-header"
          type="secondary"
          :background="isStandaloneAdvanced ? 'secondary' : undefined"
          expandable
          :expanded="true"
          data-testid="appco-config-labels"
        >
          <Labels
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
            :add-icon="'icon-plus'"
            :use-rc-button="true"
            :compact="true"
            data-testid="appco-config-labels-section"
          />
        </RcSection>
        <RcSection
          v-model:expanded="valuesExpanded"
          :title="t('fleet.helmOp.values.title')"
          mode="with-header"
          type="secondary"
          :background="isStandaloneAdvanced ? 'secondary' : undefined"
          expandable
          data-testid="appco-config-values"
        >
          <HelmOpValuesTab
            ref="valuesTabRef"
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            :hide-title="true"
            :hide-banner="isStandaloneAdvanced"
            :is-suse-app-collection="true"
            :bg-border="true"
            :compact="true"
            data-testid="appco-config-values-tab"
            @update:yaml-form="emit('update:yaml-form')"
            @update:chart-values="emit('update:chart-values', $event)"
            @update:diff-mode="emit('update:diff-mode', $event)"
          />
        </RcSection>
      </div>
    </component>
  </div>
</template>

<style lang="scss" scoped>
.appco-config-tab {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.content-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.appco-main-section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.appco-main-content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: var(--gap-lg);
  height: 50px;
}

.chart-header-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background: var(--rc-image-bg);
  border-radius: var(--border-radius);
  color: var(--rc-image-color);
  width: 50px;
  height: 50px;
  justify-content: center;

  .chart-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .chart-icon-placeholder {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--body-bg);
    border-radius: var(--border-radius);
    border: 1px solid var(--border);

    .icon {
      font-size: 28px;
    }
  }
}

.chart-header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-header-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  margin-bottom: 0;
}
</style>
