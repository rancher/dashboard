<script>
import { clone, set } from '@shell/utils/object';
import semver from 'semver';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { AUTH_TYPE, CONFIG_MAP, NORMAN, SECRET } from '@shell/config/types';
import { CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import FormValidation from '@shell/mixins/form-validation';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { mapPref, DIFF } from '@shell/store/prefs';
import { SECRET_TYPES } from '@shell/config/secret';
import { toSeconds } from '@shell/utils/duration';
import { EDITOR_MODES } from '@shell/components/YamlEditor';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import HelmOpMetadataTab from '@shell/components/fleet/HelmOpMetadataTab.vue';
import HelmOpChartTab from '@shell/components/fleet/HelmOpChartTab.vue';
import HelmOpValuesTab from '@shell/components/fleet/HelmOpValuesTab.vue';
import HelmOpTargetTab from '@shell/components/fleet/HelmOpTargetTab.vue';
import HelmOpAdvancedTab from '@shell/components/fleet/HelmOpAdvancedTab.vue';

const MINIMUM_POLLING_INTERVAL = 15;

const VALUES_STATE = {
  YAML: 'YAML',
  DIFF: 'DIFF'
};

export default {
  name: 'CruHelmOp',

  inheritAttrs: false,

  emits: ['input'],

  components: {
    CruResource,
    Loading,
    NameNsDescription,
    Tabbed,
    Tab,
    HelmOpMetadataTab,
    HelmOpChartTab,
    HelmOpValuesTab,
    HelmOpTargetTab,
    HelmOpAdvancedTab,
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    // Fetch Secrets and ConfigMaps to mask the loading phase in FleetValuesFrom.vue
    checkSchemasForFindAllHash({
      allSecrets: {
        inStoreType: 'management',
        type:        SECRET
      },

      allConfigMaps: {
        inStoreType: 'management',
        type:        CONFIG_MAP
      }
    }, this.$store);
    this.currentUser = await this.value.getCurrentUser();
  },

  data() {
    const correctDriftEnabled = this.value.spec?.correctDrift?.enabled || false;

    const chartValues = saferDump(clone(this.value.spec.helm.values));

    return {
      VALUES_STATE,
      SOURCE_TYPE,
      allWorkspaces:    [],
      pollingInterval:  toSeconds(this.value.spec.pollingInterval) || this.value.spec.pollingInterval,
      sourceTypeInit:   this.value.sourceType,
      sourceType:       this.value.sourceType || SOURCE_TYPE.REPO,
      helmSpecInit:     clone(this.value.spec.helm),
      yamlForm:         VALUES_STATE.YAML,
      chartValues,
      chartValuesInit:  chartValues,
      correctDriftEnabled,
      tempCachedValues: {},
      doneRouteList:    'c-cluster-fleet-application',
      isRealModeEdit:   this.realMode === _EDIT,
      targetsCreated:   '',
      fvFormRuleSets:   [],
    };
  },

  created() {
    this.registerBeforeHook(this.doCreateSecrets, `registerAuthSecrets${ new Date().getTime() }`, 99);
    this.registerBeforeHook(this.updateBeforeSave);

    if (this.realMode === _EDIT && this.workspace !== this.value.namespace) {
      this.$store.commit('updateWorkspace', { value: this.value.namespace, getters: this.$store.getters });
    }
  },

  mounted() {
    this.value.applyDefaults();
    this.updateValidationRules(this.sourceType);
  },

  computed: {
    ...mapGetters(['workspace']),

    steps() {
      return [
        {
          name:           'basics',
          title:          this.t('fleet.helmOp.add.steps.metadata.title'),
          label:          this.t('fleet.helmOp.add.steps.metadata.label'),
          subtext:        this.t('fleet.helmOp.add.steps.metadata.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.metadata.description',
          ready:          this.isView || !!this.value.metadata.name,
          weight:         1
        },
        {
          name:           'chart',
          title:          this.t('fleet.helmOp.add.steps.chart.title'),
          label:          this.t('fleet.helmOp.add.steps.chart.label'),
          subtext:        this.t('fleet.helmOp.add.steps.chart.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.chart.description',
          ready:          this.isView || !!this.fvFormIsValid,
          weight:         1
        },
        {
          name:           'values',
          title:          this.t('fleet.helmOp.add.steps.values.title'),
          label:          this.t('fleet.helmOp.add.steps.values.label'),
          subtext:        this.t('fleet.helmOp.add.steps.values.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.values.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'target',
          title:          this.t('fleet.helmOp.add.steps.targetInfo.title'),
          label:          this.t('fleet.helmOp.add.steps.targetInfo.label'),
          subtext:        this.t('fleet.helmOp.add.steps.targetInfo.subtext'),
          descriptionKey: 'fleet.helmOp.steps.add.targetInfo.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'advanced',
          title:          this.t('fleet.helmOp.add.steps.advanced.title'),
          label:          this.t('fleet.helmOp.add.steps.advanced.label'),
          subtext:        this.t('fleet.helmOp.add.steps.advanced.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.advanced.description',
          ready:          true,
          weight:         1,
        },
      ];
    },

    sourceTypeOptions() {
      return Object.values(SOURCE_TYPE).map((value) => ({
        value,
        label: this.t(`fleet.helmOp.source.types.${ value }`)
      }));
    },

    yamlFormOptions() {
      return [{
        labelKey: 'fleet.helmOp.values.yaml.options.edit',
        value:    VALUES_STATE.YAML,
      }, {
        labelKey: 'fleet.helmOp.values.yaml.options.diff',
        value:    VALUES_STATE.DIFF,
        disabled: this.chartValuesInit === this.chartValues,
      }];
    },

    diffMode: mapPref(DIFF),

    yamlDiffModeOptions() {
      return [{
        labelKey: 'resourceYaml.buttons.unified',
        value:    'unified',
      }, {
        labelKey: 'resourceYaml.buttons.split',
        value:    'split',
      }];
    },

    isYamlDiff() {
      return this.yamlForm === VALUES_STATE.DIFF;
    },

    editorMode() {
      if (this.isYamlDiff) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },

    isNullOrStaticVersion() {
      return !this.value.spec.helm.version || semver.valid(this.value.spec.helm.version) !== null;
    },

    isPollingEnabled() {
      return !this.isNullOrStaticVersion && !!this.value.spec.pollingInterval;
    },

    showPollingIntervalMinValueWarning() {
      return !this.isView && this.isPollingEnabled && this.pollingInterval < MINIMUM_POLLING_INTERVAL;
    },

    enablePollingTooltip() {
      if (this.isNullOrStaticVersion) {
        return this.t('fleet.helmOp.polling.pollingInterval.versionTooltip', { version: this.value.spec.helm.version || '' }, true);
      }

      return null;
    },

    downstreamSecretsList() {
      return (this.value.spec.downstreamResources || []).filter((r) => r.kind === 'Secret').map((r) => r.name);
    },

    downstreamConfigMapsList() {
      return (this.value.spec.downstreamResources || []).filter((r) => r.kind === 'ConfigMap').map((r) => r.name);
    },
  },

  watch: {
    workspace(neu) {
      if (this.isCreate) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  methods: {
    onSourceTypeSelect(type) {
      this.sourceType = type;
      delete this.value.spec.helm.repo;
      delete this.value.spec.helm.chart;
      delete this.value.spec.helm.version;

      if (this.realMode !== _CREATE && this.sourceTypeInit === type) {
        const { repo, chart, version } = this.helmSpecInit;

        set(this.value, 'spec.helm.repo', repo);
        set(this.value, 'spec.helm.chart', chart);
        set(this.value, 'spec.helm.version', version);
      }

      this.updateValidationRules(type);
    },

    updateTargets(value) {
      this.value.spec.targets = value;
    },

    togglePolling(value) {
      if (value) {
        this.pollingInterval = this.pollingInterval ?? MINIMUM_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.value.spec.pollingInterval ?? this.durationSeconds(MINIMUM_POLLING_INTERVAL);
      } else {
        delete this.value.spec.pollingInterval;
      }
    },

    updatePollingInterval(value) {
      if (value) {
        this.value.spec.pollingInterval = this.durationSeconds(value);
      } else {
        this.pollingInterval = MINIMUM_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.durationSeconds(MINIMUM_POLLING_INTERVAL);
      }
    },

    updateCachedAuthVal(val, key) {
      this.tempCachedValues[key] = typeof val === 'string' ? { selected: val } : { ...val };
    },

    updateAuth(val, key) {
      const spec = this.value.spec;

      if ( val ) {
        spec[key] = val;
      } else {
        delete spec[key];
      }

      this.updateCachedAuthVal(val, key);
    },

    async doCreateSecrets() {
      if (this.tempCachedValues.clientSecretName) {
        await this.doCreate('clientSecretName', this.tempCachedValues.clientSecretName);
      }

      if (this.tempCachedValues.helmSecretName) {
        await this.doCreate('helmSecretName', this.tempCachedValues.helmSecretName);
      }
    },

    async doCreate(name, credentials) {
      const {
        selected,
        publicKey,
        privateKey,
        sshKnownHosts
      } = credentials;

      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3].includes(selected) ) {
        return;
      }

      let secret;

      if ( selected === AUTH_TYPE._S3 ) {
        secret = await this.$store.dispatch(`rancher/create`, {
          type:               NORMAN.CLOUD_CREDENTIAL,
          s3credentialConfig: {
            accessKey: publicKey,
            secretKey: privateKey,
          },
        });
      } else {
        secret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
          type:     SECRET,
          metadata: {
            namespace:    this.value.metadata.namespace,
            generateName: 'auth-',
            labels:       { [FLEET_LABELS.MANAGED]: 'true' }
          }
        });

        let type, publicField, privateField;

        switch ( selected ) {
        case AUTH_TYPE._SSH:
          type = SECRET_TYPES.SSH;
          publicField = 'ssh-publickey';
          privateField = 'ssh-privatekey';
          break;
        case AUTH_TYPE._BASIC:
          type = SECRET_TYPES.BASIC;
          publicField = 'username';
          privateField = 'password';
          break;
        default:
          throw new Error('Unknown type');
        }

        secret._type = type;
        secret.data = {
          [publicField]:  base64Encode(publicKey),
          [privateField]: base64Encode(privateKey),
        };

        // Add ssh known hosts
        if (selected === AUTH_TYPE._SSH && sshKnownHosts) {
          secret.data.known_hosts = base64Encode(sshKnownHosts);
        }
      }

      await secret.save();

      await this.$nextTick(() => {
        this.updateAuth(secret.metadata.name, name);
      });

      return secret;
    },

    updateYamlForm() {
      if (this.$refs.yaml) {
        this.$refs.yaml.updateValue(this.chartValues);
      }
    },

    updateChartValues(value) {
      try {
        const chartValues = jsyaml.load(value);

        this.value.spec.helm.values = chartValues;
      } catch (err) {
      }
    },

    updateBeforeSave() {
      this.value.spec['correctDrift'] = { enabled: this.correctDriftEnabled };

      if (this.mode === _CREATE) {
        this.value.metadata.labels[FLEET_LABELS.CREATED_BY_USER_ID] = this.currentUser.id;
      }
    },

    durationSeconds(value) {
      return `${ value }s`;
    },

    updateValidationRules(sourceType) {
      switch (sourceType) {
      case SOURCE_TYPE.REPO:
        this.fvFormRuleSets = [{
          path:  'spec.helm.repo',
          rules: ['urlRepository'],
        }, {
          path:  'spec.helm.chart',
          rules: ['required'],
        }, {
          path:  'spec.helm.version',
          rules: ['semanticVersion'],
        }];
        break;
      case SOURCE_TYPE.OCI:
        this.fvFormRuleSets = [{
          path:  'spec.helm.repo',
          rules: ['ociRegistry'],
        }, {
          path:  'spec.helm.version',
          rules: ['semanticVersion'],
        }];
        break;
      case SOURCE_TYPE.TARBALL:
        this.fvFormRuleSets = [{
          path:  'spec.helm.chart',
          rules: ['urlRepository'],
        }];
        break;
      }
    },

    updateDownstreamResources(kind, list) {
      switch (kind) {
      case 'Secret':
        this.value.spec.downstreamResources = [
          ...(this.value.spec.downstreamResources || []).filter((r) => r.kind !== 'Secret'),
          ...(list || []).map((name) => ({ name, kind: 'Secret' })),
        ];
        break;
      case 'ConfigMap':
        this.value.spec.downstreamResources = [
          ...(this.value.spec.downstreamResources || []).filter((r) => r.kind !== 'ConfigMap'),
          ...(list || []).map((name) => ({ name, kind: 'ConfigMap' })),
        ];
        break;
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :done-route="doneRouteList"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :steps="steps"
    :finish-mode="'finish'"
    class="wizard"
    @cancel="done"
    @error="e=>errors = e"
    @finish="save"
  >
    <template #basics>
      <HelmOpMetadataTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        @update:value="$emit('input', $event)"
      />
    </template>

    <template #chart>
      <HelmOpChartTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :source-type="sourceType"
        :source-type-options="sourceTypeOptions"
        :fv-get-and-report-path-rules="fvGetAndReportPathRules"
        @update:source-type="onSourceTypeSelect"
      />
    </template>

    <template #values>
      <HelmOpValuesTab
        :value="value"
        :mode="mode"
        :real-mode="realMode"
        :is-view="isView"
        :chart-values="chartValues"
        :chart-values-init="chartValuesInit"
        :yaml-form="yamlForm"
        :yaml-form-options="yamlFormOptions"
        :yaml-diff-mode-options="yamlDiffModeOptions"
        :is-yaml-diff="isYamlDiff"
        :editor-mode="editorMode"
        :diff-mode="diffMode"
        :is-real-mode-edit="isRealModeEdit"
        @update:yaml-form="updateYamlForm"
        @update:chart-values="updateChartValues"
        @update:diff-mode="diffMode = $event"
      />
    </template>

    <template #target>
      <HelmOpTargetTab
        :value="value"
        :mode="mode"
        :real-mode="realMode"
        :is-view="isView"
        :targets-created="targetsCreated"
        @update:targets="updateTargets"
        @targets-created="targetsCreated=$event"
      />
    </template>

    <template #advanced>
      <HelmOpAdvancedTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :source-type="sourceType"
        :temp-cached-values="tempCachedValues"
        :correct-drift-enabled="correctDriftEnabled"
        :polling-interval="pollingInterval"
        :is-polling-enabled="isPollingEnabled"
        :show-polling-interval-min-value-warning="showPollingIntervalMinValueWarning"
        :enable-polling-tooltip="enablePollingTooltip"
        :is-null-or-static-version="isNullOrStaticVersion"
        :downstream-secrets-list="downstreamSecretsList"
        :downstream-config-maps-list="downstreamConfigMapsList"
        :register-before-hook="registerBeforeHook"
        @update:auth="updateAuth($event.value, $event.key)"
        @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
        @update:correct-drift="correctDriftEnabled = $event"
        @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
        @toggle-polling="togglePolling"
        @update:polling-interval="updatePollingInterval"
      />
    </template>

    <template
      v-if="isView"
      #single
    >
      <NameNsDescription
        :value="value"
        :namespaced="false"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />

      <Tabbed
        v-if="isView"
        :side-tabs="true"
        :use-hash="true"
      >
        <Tab
          :name="steps[1].name"
          :label="steps[1].label"
          :weight="4"
        >
          <HelmOpChartTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            :source-type="sourceType"
            :source-type-options="sourceTypeOptions"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
            @update:source-type="onSourceTypeSelect"
          />
        </Tab>
        <Tab
          :name="steps[2].name"
          :label="steps[2].label"
          :weight="3"
        >
          <HelmOpValuesTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :is-view="isView"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            @update:yaml-form="updateYamlForm"
            @update:chart-values="updateChartValues"
            @update:diff-mode="diffMode = $event"
          />
        </Tab>
        <Tab
          :name="steps[3].name"
          :label="steps[3].label"
          :weight="2"
        >
          <HelmOpTargetTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :is-view="isView"
            :targets-created="targetsCreated"
            @update:targets="updateTargets"
            @targets-created="targetsCreated=$event"
          />
        </Tab>
        <Tab
          :name="steps[4].name"
          :label="steps[4].label"
          :weight="1"
        >
          <HelmOpAdvancedTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            :source-type="sourceType"
            :temp-cached-values="tempCachedValues"
            :correct-drift-enabled="correctDriftEnabled"
            :polling-interval="pollingInterval"
            :is-polling-enabled="isPollingEnabled"
            :show-polling-interval-min-value-warning="showPollingIntervalMinValueWarning"
            :enable-polling-tooltip="enablePollingTooltip"
            :is-null-or-static-version="isNullOrStaticVersion"
            :downstream-secrets-list="downstreamSecretsList"
            :downstream-config-maps-list="downstreamConfigMapsList"
            :register-before-hook="registerBeforeHook"
            @update:auth="updateAuth($event.value, $event.key)"
            @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
            @update:correct-drift="correctDriftEnabled = $event"
            @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
            @toggle-polling="togglePolling"
            @update:polling-interval="updatePollingInterval"
          />
        </Tab>
        <Tab
          name="labels"
          label-key="generic.labelsAndAnnotations"
          :weight="5"
        >
          <HelmOpMetadataTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            @update:value="$emit('input', $event)"
          />
        </Tab>
      </Tabbed>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .yaml-form-controls {
    display: flex;
    margin-bottom: 15px;
  }
  :deep() .yaml-editor {
    .root {
      height: auto !important;
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
