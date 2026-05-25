<script>
import { clone, set } from '@shell/utils/object';
import semver from 'semver';
import jsyaml from 'js-yaml';
import { isPrerelease } from '@shell/utils/version';
import { saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { _CREATE, _EDIT, SUB_TYPE } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import {
  AUTH_TYPE, CATALOG as CATALOG_TYPES, CONFIG_MAP, FLEET, FLEET_APPCO_AUTH_GENERATE_NAME, AUTH_GENERATE_NAME, NORMAN, SECRET
} from '@shell/config/types';
import { CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import { isRancherPrime } from '@shell/config/version';
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
import HelmOpAppCoConfigTab from '@shell/components/fleet/HelmOpAppCoConfigTab.vue';

const MINIMUM_POLLING_INTERVAL = 15;

const VALUES_STATE = {
  YAML: 'YAML',
  DIFF: 'DIFF'
};

const SUSE_APP_COLLECTION_REPO_URL = 'oci://dp.apps.rancher.io/charts';

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
    HelmOpAppCoConfigTab,
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    // Fetch Secrets and ConfigMaps to mask the loading phase in FleetValuesFrom.vue
    checkSchemasForFindAllHash({
      allSecrets: {
        inStoreType: CATALOG._MANAGEMENT,
        type:        SECRET
      },

      allConfigMaps: {
        inStoreType: CATALOG._MANAGEMENT,
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
      pollingInterval:  toSeconds(this.value.spec.pollingInterval) || this.value.spec.pollingInterval,
      sourceTypeInit:   this.value.sourceType,
      sourceType:       this.$route.query[SUB_TYPE] === FLEET.SUSE_APP_COLLECTION || (this.value.spec?.helm?.repo || '').startsWith(SUSE_APP_COLLECTION_REPO_URL) ? SOURCE_TYPE.OCI : (this.value.sourceType || SOURCE_TYPE.REPO),
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

      // SUSE App Collection chart data — keyed by repoName to avoid re-fetching
      appCoChartsCache:      {},
      // Dropdown options for chart names (label/value pairs)
      appCoChartOptions:     [],
      // Dropdown options for the selected chart's versions (label/value pairs)
      appCoVersionOptions:   [],
      // Raw chart index entries from the ClusterRepo, keyed by chart name
      appCoChartEntries:     {},
      // True while fetching the chart index from the ClusterRepo
      appCoChartsLoading:    false,
      // True when the chart index fetch failed (triggers the connection error empty state)
      appCoChartsFetchError: false,
      // Current ClusterRepo state while polling (stateDisplay + stateBackground for BadgeState)
      // Previous repo name for detecting auth secret changes
      oldAppCoRepoName:      '',
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

    if (this.isSuseAppCollection) {
      const repo = this.value.spec?.helm?.repo || '';

      if (!repo) {
        set(this.value, 'spec.helm.repo', SUSE_APP_COLLECTION_REPO_URL);
      } else if (repo.startsWith(SUSE_APP_COLLECTION_REPO_URL) && repo.length > SUSE_APP_COLLECTION_REPO_URL.length) {
        const chart = repo.slice(SUSE_APP_COLLECTION_REPO_URL.length).replace(/^\//, '');

        set(this.value, 'spec.helm.repo', SUSE_APP_COLLECTION_REPO_URL);
        set(this.value, 'spec.helm.chart', chart);
      }

      if (this.realMode === _CREATE) {
        const queryChart = this.$route.query.chart;
        const querySecret = this.$route.query.secret;
        const queryVersion = this.$route.query.version;

        if (queryChart) {
          set(this.value, 'spec.helm.chart', queryChart);
        }

        if (queryVersion) {
          set(this.value, 'spec.helm.version', queryVersion);
        }

        if (querySecret) {
          const ns = this.value.metadata.namespace;

          this.updateAuth(`${ ns }/${ querySecret }`, 'helmSecretName');
          this.addAppCoImagePullSecretToSpec(`${ querySecret }-image-pull-secret`);

          const repoName = querySecret.replace('auth', 'repo');

          this.fetchAppCoCharts(repoName);
        }
      }
    }
  },

  computed: {
    ...mapGetters(['workspace']),

    steps() {
      if (this.isSuseAppCollection) {
        return [];
      }

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

    isSuseAppCollection() {
      if (!isRancherPrime()) {
        return false;
      }

      return this.$route.query[SUB_TYPE] === FLEET.SUSE_APP_COLLECTION ||
        (this.value.spec?.helm?.repo || '').startsWith(SUSE_APP_COLLECTION_REPO_URL);
    },

    appCoRepoName() {
      if (!this.isSuseAppCollection) {
        return '';
      }

      const raw = this.value.spec?.helmSecretName || '';
      const authName = raw.includes('/') ? raw.split('/')[1] : raw;

      return authName ? authName.replace('auth', 'repo') : '';
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

    appCoViewTabs() {
      return [
        {
          name:   'chartConfig',
          label:  this.t('fleet.helmOp.appCoView.chartConfig'),
          weight: 3
        },
        {
          name:   'targetDetails',
          label:  this.t('fleet.helmOp.appCoView.targetDetails'),
          weight: 2
        },
        {
          name:   'advanced',
          label:  this.t('fleet.helmOp.appCoView.advanced'),
          weight: 1
        },
      ];
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
    refreshAppCoAdvancedYaml() {
      this.$refs.appCoAdvancedRef?.refreshYamlEditor?.();
    },

    resetAppCoChartSelection() {
      set(this.value, 'spec.helm.chart', '');
      set(this.value, 'spec.helm.version', '');
      set(this.value, 'spec.helm.values', {});
      this.chartValues = '';
    },

    resetAppCoChartData({ error = false } = {}) {
      this.appCoChartOptions = [];
      this.appCoVersionOptions = [];
      this.appCoChartEntries = {};
      this.appCoChartsFetchError = error;
    },

    onSourceTypeSelect(type) {
      if (this.isSuseAppCollection) {
        return;
      }
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
      this.pollingInterval = value;
    },

    validatePollingInterval() {
      const value = this.pollingInterval;

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

    async updateAuth(val, key) {
      const spec = this.value.spec;

      if ( val ) {
        spec[key] = val;
      } else {
        delete spec[key];
      }

      if (this.isSuseAppCollection) {
        const newRepoName = this.appCoRepoName;

        if (!newRepoName) {
          if (this.oldAppCoRepoName) {
            this.resetAppCoChartSelection();
            this.resetAppCoChartData();
            this.oldAppCoRepoName = '';
          }

          return;
        }

        if (newRepoName === this.oldAppCoRepoName) {
          return;
        }

        if (this.oldAppCoRepoName) {
          this.resetAppCoChartSelection();
          this.resetAppCoChartData();
        }

        this.oldAppCoRepoName = newRepoName;
        await this.fetchAppCoCharts(newRepoName);
      }
    },

    async doCreateSecrets() {
      if (this.tempCachedValues.clientSecretName) {
        await this.doCreate('clientSecretName', this.tempCachedValues.clientSecretName);
      }

      if (!this.isSuseAppCollection && this.tempCachedValues.helmSecretName) {
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
            generateName: AUTH_GENERATE_NAME,
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

    /**
     * Adds the image-pull-secret to downstreamResources (Secret kind) and
     * to spec.helm.values.global.imagePullSecrets.
     */
    addAppCoImagePullSecretToSpec(imagePullSecretName) {
      // Replace downstream resources: remove stale fleet-appco-auth-* image-pull-secrets, add the current one
      const existingSecrets = (this.value.spec.downstreamResources || []).filter((r) => r.kind === 'Secret');
      const nonAppcoSecrets = existingSecrets.filter((r) => !r.name.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));

      this.updateDownstreamResources('Secret', [
        ...nonAppcoSecrets.map((r) => r.name),
        imagePullSecretName,
      ]);

      // Replace spec.helm.values.global.imagePullSecrets: remove stale fleet-appco-auth-* entries, add the current one
      const currentValues = this.value.spec.helm.values || {};

      const newValues = {
        ...currentValues,
        global: {
          ...(currentValues.global || {}),
          imagePullSecrets: [imagePullSecretName],
        },
      };

      set(this.value, 'spec.helm.values', newValues);
      this.chartValuesInit = saferDump(clone(newValues));
      this.chartValues = saferDump(clone(newValues));
    },

    updateYamlForm() {
      if (this.$refs.yaml) {
        this.$refs.yaml.updateValue(this.chartValues);
      }
    },

    updateChartValues(value) {
      this.chartValues = value;

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

      // For OCI sources with a chart name, merge repo + chart into a single repo field
      // e.g. oci://dp.apps.rancher.io/charts + my-app => oci://dp.apps.rancher.io/charts/my-app (SUSE App Collection)
      if (this.sourceType === SOURCE_TYPE.OCI && this.value.spec?.helm?.chart) {
        const repo = (this.value.spec.helm.repo || '').replace(/\/$/, '');
        const chart = this.value.spec.helm.chart;

        set(this.value, 'spec.helm.repo', `${ repo }/${ chart }`);
        delete this.value.spec.helm.chart;
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
        },
        ...(this.isSuseAppCollection ? [{
          path:  'spec.helm.chart',
          rules: ['required'],
        }] : []),
        {
          path:  'spec.helm.version',
          rules: this.isSuseAppCollection ? ['required', 'semanticVersion'] : ['semanticVersion'],
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

    async fetchAppCoCharts(repoName) {
      if (!repoName) {
        this.resetAppCoChartData();

        return;
      }

      // Return cached data if available
      if (this.appCoChartsCache[repoName]) {
        const cached = this.appCoChartsCache[repoName];

        this.appCoChartEntries = cached.entries;
        this.appCoChartOptions = cached.chartOptions;
        this.appCoChartsFetchError = false;

        // Re-populate version options if a chart is already selected (e.g. edit mode)
        const currentChart = this.value.spec?.helm?.chart;

        if (currentChart && cached.entries[currentChart]) {
          const versions = cached.entries[currentChart];

          this.appCoVersionOptions = [
            ...versions
              .filter((entry) => !isPrerelease(entry.version))
              .map((entry) => entry.version)
              .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
              .map((v) => ({
                label: v,
                value: v
              }))
          ];
        }

        return;
      }

      this.appCoChartsFetchError = false;

      try {
        this.appCoChartsLoading = true;

        const repo = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/find`, {
          type: CATALOG_TYPES.CLUSTER_REPO,
          id:   repoName,
          opt:  { force: true },
        });

        if (!repo) {
          this.resetAppCoChartData({ error: true });

          return;
        }

        const index = await repo.followLink('index');
        const entries = index?.entries || {};

        const chartOptions = Object.keys(entries).sort().map((name) => ({
          label: name,
          value: name
        }));

        this.appCoChartsCache[repoName] = { entries, chartOptions };
        this.appCoChartEntries = entries;
        this.appCoChartOptions = chartOptions;

        const currentChart = this.value.spec?.helm?.chart;

        if (currentChart && entries[currentChart]) {
          const versions = entries[currentChart];

          this.appCoVersionOptions = [
            ...versions
              .filter((entry) => !isPrerelease(entry.version))
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
        this.resetAppCoChartData({ error: true });
      } finally {
        this.appCoChartsLoading = false;
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
    ref="cruResource"
    :done-route="doneRouteList"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :steps="!isView ? steps : undefined"
    :finish-mode="'finish'"
    class="wizard"
    data-testid="helmop-cru-resource"
    @cancel="done"
    @error="e=>errors = e"
    @finish="save"
  >
    <template
      v-if="!isSuseAppCollection"
      #basics
    >
      <HelmOpMetadataTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        data-testid="helmop-metadata-tab"
        @update:value="$emit('input', $event)"
      />
    </template>

    <template
      v-if="!isSuseAppCollection"
      #chart
    >
      <HelmOpChartTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :source-type="sourceType"
        :source-type-options="sourceTypeOptions"
        :is-suse-app-collection="isSuseAppCollection"
        :app-co-chart-options="appCoChartOptions"
        :app-co-version-options="appCoVersionOptions"
        :app-co-chart-entries="appCoChartEntries"
        :app-co-charts-loading="appCoChartsLoading"
        :fv-get-and-report-path-rules="fvGetAndReportPathRules"
        data-testid="helmop-chart-tab"
        @update:source-type="onSourceTypeSelect"
        @update:app-co-version-options="appCoVersionOptions = $event"
      />
    </template>

    <template
      v-if="!isSuseAppCollection"
      #values
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
        data-testid="helmop-values-tab"
        @update:yaml-form="updateYamlForm"
        @update:chart-values="updateChartValues"
        @update:diff-mode="diffMode = $event"
      />
    </template>

    <template
      v-if="!isSuseAppCollection"
      #target
    >
      <HelmOpTargetTab
        :value="value"
        :mode="mode"
        :real-mode="realMode"
        :is-view="isView"
        :targets-created="targetsCreated"
        data-testid="helmop-target-tab"
        @update:targets="updateTargets"
        @targets-created="targetsCreated=$event"
      />
    </template>

    <template
      v-if="!isSuseAppCollection"
      #advanced
    >
      <HelmOpAdvancedTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :source-type="sourceType"
        :is-suse-app-collection="isSuseAppCollection"
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
        data-testid="helmop-advanced-tab"
        @update:auth="updateAuth($event.value, $event.key)"
        @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
        @update:correct-drift="correctDriftEnabled = $event"
        @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
        @toggle-polling="togglePolling"
        @update:polling-interval="updatePollingInterval"
        @update:validate-polling-interval="validatePollingInterval"
      />
    </template>

    <template
      v-if="isView || isSuseAppCollection"
      #single
    >
      <!-- Non-AppCo view -->
      <div v-if="!isSuseAppCollection">
        <NameNsDescription
          :value="value"
          :namespaced="false"
          :mode="mode"
          data-testid="helmop-view-name-ns-description"
          @update:value="$emit('input', $event)"
        />

        <Tabbed
          v-if="isView"
          :side-tabs="true"
          :use-hash="true"
        >
          <Tab
            v-if="steps[1]"
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
              :is-suse-app-collection="isSuseAppCollection"
              :app-co-chart-options="appCoChartOptions"
              :app-co-version-options="appCoVersionOptions"
              :app-co-chart-entries="appCoChartEntries"
              :app-co-charts-loading="appCoChartsLoading"
              :fv-get-and-report-path-rules="fvGetAndReportPathRules"
              data-testid="helmop-view-chart-tab"
              @update:source-type="onSourceTypeSelect"
              @update:app-co-version-options="appCoVersionOptions = $event"
            />
          </Tab>
          <Tab
            v-if="steps[2]"
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
              data-testid="helmop-view-values-tab"
              @update:yaml-form="updateYamlForm"
              @update:chart-values="updateChartValues"
              @update:diff-mode="diffMode = $event"
            />
          </Tab>
          <Tab
            v-if="steps[3]"
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
              data-testid="helmop-view-target-tab"
              @update:targets="updateTargets"
              @targets-created="targetsCreated=$event"
            />
          </Tab>
          <Tab
            v-if="steps[4]"
            :name="steps[4].name"
            :label="steps[4].label"
            :weight="1"
          >
            <HelmOpAdvancedTab
              :value="value"
              :mode="mode"
              :is-view="isView"
              :source-type="sourceType"
              :is-suse-app-collection="isSuseAppCollection"
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
              data-testid="helmop-view-advanced-tab"
              @update:auth="updateAuth($event.value, $event.key)"
              @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
              @update:correct-drift="correctDriftEnabled = $event"
              @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
              @toggle-polling="togglePolling"
              @update:polling-interval="updatePollingInterval"
              @update:validate-polling-interval="validatePollingInterval"
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
              data-testid="helmop-view-metadata-tab"
              @update:value="$emit('input', $event)"
            />
          </Tab>
        </Tabbed>
      </div>

      <!-- AppCo view -->
      <Tabbed
        v-else-if="isSuseAppCollection && isView"
        :side-tabs="true"
        :use-hash="true"
        data-testid="helmop-appco-view-tabbed"
      >
        <Tab
          :name="appCoViewTabs[0].name"
          :label="appCoViewTabs[0].label"
          :weight="appCoViewTabs[0].weight"
          :show-header="false"
        >
          <HelmOpAppCoConfigTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :app-co-chart-entries="appCoChartEntries"
            :app-co-charts-loading="appCoChartsLoading"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            :targets-created="targetsCreated"
            :source-type="sourceType"
            :is-suse-app-collection="isSuseAppCollection"
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
            :hide-target="true"
            :hide-advanced="true"
            :hide-chart-config="false"
            data-testid="helmop-appco-view-chart-config"
            @update:value="$emit('input', $event)"
            @update:yaml-form="updateYamlForm"
            @update:chart-values="updateChartValues"
            @update:diff-mode="diffMode = $event"
            @update:targets="updateTargets"
            @targets-created="targetsCreated=$event"
            @update:auth="updateAuth($event.value, $event.key)"
            @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
            @update:correct-drift="correctDriftEnabled = $event"
            @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
            @toggle-polling="togglePolling"
            @update:polling-interval="updatePollingInterval"
            @update:validate-polling-interval="validatePollingInterval"
          />
        </Tab>

        <Tab
          :name="appCoViewTabs[1].name"
          :label="appCoViewTabs[1].label"
          :weight="appCoViewTabs[1].weight"
          :show-header="false"
        >
          <HelmOpAppCoConfigTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :app-co-chart-entries="appCoChartEntries"
            :app-co-charts-loading="appCoChartsLoading"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            :targets-created="targetsCreated"
            :source-type="sourceType"
            :is-suse-app-collection="isSuseAppCollection"
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
            :hide-chart-config="true"
            :hide-advanced="true"
            data-testid="helmop-appco-view-target-details"
            @update:value="$emit('input', $event)"
            @update:yaml-form="updateYamlForm"
            @update:chart-values="updateChartValues"
            @update:diff-mode="diffMode = $event"
            @update:targets="updateTargets"
            @targets-created="targetsCreated=$event"
            @update:auth="updateAuth($event.value, $event.key)"
            @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
            @update:correct-drift="correctDriftEnabled = $event"
            @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
            @toggle-polling="togglePolling"
            @update:polling-interval="updatePollingInterval"
            @update:validate-polling-interval="validatePollingInterval"
          />
        </Tab>

        <Tab
          :name="appCoViewTabs[2].name"
          :label="appCoViewTabs[2].label"
          :weight="appCoViewTabs[2].weight"
          @active="refreshAppCoAdvancedYaml"
        >
          <HelmOpAppCoConfigTab
            ref="appCoAdvancedRef"
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :app-co-chart-entries="appCoChartEntries"
            :app-co-charts-loading="appCoChartsLoading"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            :targets-created="targetsCreated"
            :source-type="sourceType"
            :is-suse-app-collection="isSuseAppCollection"
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
            :hide-chart-config="true"
            :hide-target="true"
            data-testid="helmop-appco-view-advanced"
            @update:value="$emit('input', $event)"
            @update:yaml-form="updateYamlForm"
            @update:chart-values="updateChartValues"
            @update:diff-mode="diffMode = $event"
            @update:targets="updateTargets"
            @targets-created="targetsCreated=$event"
            @update:auth="updateAuth($event.value, $event.key)"
            @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
            @update:correct-drift="correctDriftEnabled = $event"
            @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
            @toggle-polling="togglePolling"
            @update:polling-interval="updatePollingInterval"
            @update:validate-polling-interval="validatePollingInterval"
          />
        </Tab>
      </Tabbed>
      <div
        v-else-if="isSuseAppCollection && (isEdit || isCreate)"
        data-testid="helmop-appco-edit"
      >
        <HelmOpAppCoConfigTab
          :value="value"
          :mode="mode"
          :real-mode="realMode"
          :app-co-chart-entries="appCoChartEntries"
          :app-co-charts-loading="appCoChartsLoading"
          :chart-values="chartValues"
          :chart-values-init="chartValuesInit"
          :yaml-form="yamlForm"
          :yaml-form-options="yamlFormOptions"
          :yaml-diff-mode-options="yamlDiffModeOptions"
          :is-yaml-diff="isYamlDiff"
          :editor-mode="editorMode"
          :diff-mode="diffMode"
          :is-real-mode-edit="isRealModeEdit"
          :targets-created="targetsCreated"
          :source-type="sourceType"
          :is-suse-app-collection="isSuseAppCollection"
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
          data-testid="helmop-appco-edit-config-tab"
          @update:value="$emit('input', $event)"
          @update:yaml-form="updateYamlForm"
          @update:chart-values="updateChartValues"
          @update:diff-mode="diffMode = $event"
          @update:targets="updateTargets"
          @targets-created="targetsCreated=$event"
          @update:auth="updateAuth($event.value, $event.key)"
          @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
          @update:correct-drift="correctDriftEnabled = $event"
          @update:downstream-resources="updateDownstreamResources($event.kind, $event.list)"
          @toggle-polling="togglePolling"
          @update:polling-interval="updatePollingInterval"
          @update:validate-polling-interval="validatePollingInterval"
        />
      </div>
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
