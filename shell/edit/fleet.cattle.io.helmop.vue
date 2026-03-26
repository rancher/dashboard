<script>
import { clone, set } from '@shell/utils/object';
import semver from 'semver';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { _CREATE, _EDIT, SUB_TYPE } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import {
  AUTH_TYPE, CATALOG as CATALOG_TYPES, CONFIG_MAP, FLEET, FLEET_APPCO_AUTH_GENERATE_NAME, AUTH_GENERATE_NAME, NORMAN, SECRET
} from '@shell/config/types';
import { CATALOG, DESCRIPTION, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
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
import HelmOpAppCoAuthTab from '@shell/components/fleet/HelmOpAppCoAuthTab.vue';

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
    HelmOpAppCoAuthTab,
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
      sourceType:       this.$route.query[SUB_TYPE] === FLEET.SUSE_APP_COLLECTION || (this.value.spec?.helm?.repo || '').startsWith(SUSE_APP_COLLECTION_REPO_URL) ? SOURCE_TYPE.OCI : (this.value.sourceType || SOURCE_TYPE.REPO),
      helmSpecInit:     clone(this.value.spec.helm),
      yamlForm:         VALUES_STATE.YAML,
      chartValues,
      chartValuesInit:  chartValues,
      correctDriftEnabled,
      tempCachedValues: {},
      authCreateErrors: [],
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

    if (this.isSuseAppCollection) {
      const repo = this.value.spec?.helm?.repo || '';

      if (!repo) {
        // Create flow: pre-fill the locked base URL
        set(this.value, 'spec.helm.repo', SUSE_APP_COLLECTION_REPO_URL);
      } else if (repo.startsWith(SUSE_APP_COLLECTION_REPO_URL) && repo.length > SUSE_APP_COLLECTION_REPO_URL.length) {
        // Edit flow: split "oci://dp.apps.rancher.io/charts/my-app" back into repo + chart
        const chart = repo.slice(SUSE_APP_COLLECTION_REPO_URL.length).replace(/^\//, '');

        set(this.value, 'spec.helm.repo', SUSE_APP_COLLECTION_REPO_URL);
        set(this.value, 'spec.helm.chart', chart);
      }
    }
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
        ...( this.isSuseAppCollection ? [{
          name:           'auth',
          title:          this.t('fleet.helmOp.add.steps.auth.title'),
          label:          this.t('fleet.helmOp.add.steps.auth.label'),
          subtext:        this.t('fleet.helmOp.add.steps.auth.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.auth.description',
          ready:          this.isView || !!this.value.spec?.helmSecretName,
          weight:         1
        }] : []),
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

      // If the auth is created on suseAppCollection
      // It add the globalValues and the downstreamSecret
      if (this.isSuseAppCollection) {
        await this.updateGlobalValuesAndDownstreamSecrets();
      }

      this.updateCachedAuthVal(val, key);
    },

    async onCreateAuth(credentials) {
      this.authCreateErrors = [];
      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3].includes(credentials.selected) ) {
        return;
      }
      try {
        await this.doCreate('helmSecretName', credentials);
        await this.updateGlobalValuesAndDownstreamSecrets();
      } catch (e) {
        const msg = e?.message || String(e);

        this.authCreateErrors = [msg];
        throw e;
      }
    },

    async updateGlobalValuesAndDownstreamSecrets() {
      if (!this.value.spec.helmSecretName) {
        return;
      }
      if (this.isSuseAppCollection) {
        const rawSelected = this.value.spec.helmSecretName || '';
        const authSecretName = rawSelected.includes('/') ? rawSelected.split('/')[1] : rawSelected;

        await Promise.all([
          this.ensureAppCoImagePullSecret(authSecretName),
          this.ensureAppCoClusterRepo(authSecretName),
        ]);
      }
    },

    async doCreateSecrets() {
      if (this.tempCachedValues.clientSecretName) {
        await this.doCreate('clientSecretName', this.tempCachedValues.clientSecretName);
      }

      // For SUSE App Collection, helmSecretName is created eagerly in onCreateAuth (on Next click);
      // ensureAppCoImagePullSecret and ensureAppCoClusterRepo are also called there.
      // Skip all of that here to avoid duplicates.
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
            generateName: this.isSuseAppCollection ? FLEET_APPCO_AUTH_GENERATE_NAME : AUTH_GENERATE_NAME,
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
     * Edit flow: the auth secret already exists. Checks if the image-pull-secret exists;
     * creates it if missing, then ensures it is wired into downstreamResources and helm values.
     */
    async ensureAppCoImagePullSecret(authSecretName) {
      const namespace = this.value.metadata.namespace;
      const imagePullSecretName = `${ authSecretName }-image-pull-secret`;

      let imagePullSecret = this.$store.getters[`${ CATALOG._MANAGEMENT }/byId`](SECRET, `${ namespace }/${ imagePullSecretName }`);

      if (!imagePullSecret) {
        try {
          imagePullSecret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: SECRET, id: `${ namespace }/${ imagePullSecretName }` });
        } catch (e) {
          // Does not exist yet — fetch the auth secret so we can recreate credentials
          let authSecret;

          try {
            authSecret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: SECRET, id: `${ namespace }/${ authSecretName }` });
          } catch (_) {
            // Cannot access auth secret; skip image-pull-secret creation
            return;
          }

          const registryHost = new URL(SUSE_APP_COLLECTION_REPO_URL.replace('oci://', 'https://')).host;
          const username = authSecret.decodedData?.username || '';
          const password = authSecret.decodedData?.password || '';
          const config = { auths: { [registryHost]: { username, password } } };

          const newSecret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
            type:     SECRET,
            _type:    SECRET_TYPES.DOCKER_JSON,
            metadata: {
              name:   imagePullSecretName,
              namespace,
              labels: { [FLEET_LABELS.MANAGED]: 'true' }
            }
          });

          newSecret.setData('.dockerconfigjson', JSON.stringify(config));
          await newSecret.save();
        }
      }

      this.addAppCoImagePullSecretToSpec(imagePullSecretName);
    },

    /**
     * Creates a ClusterRepo named `fleet-{authSecretName}` for the SUSE App Collection
     * pointing to the locked OCI URL and referencing the given auth secret.
     * If the repo already exists the save will fail (409) and the error propagates.
     */
    async ensureAppCoClusterRepo(authSecretName) {
      const repoName = authSecretName.replace('auth', 'repo');
      let repo = this.$store.getters[`${ CATALOG._MANAGEMENT }/byId`](CATALOG_TYPES.CLUSTER_REPO, repoName);

      if (!repo) {
        try {
          repo = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: CATALOG_TYPES.CLUSTER_REPO, id: repoName });
        } catch (e) {
          try {
            repo = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
              type:     CATALOG_TYPES.CLUSTER_REPO,
              metadata: {
                name:        repoName,
                annotations: {
                  [DESCRIPTION]:                 this.t('catalog.repo.target.suseAppCollection.description'),
                  [CATALOG.SUSE_APP_COLLECTION]: 'true',
                },
              },
              spec: {
                url:          SUSE_APP_COLLECTION_REPO_URL,
                clientSecret: {
                  namespace: this.value.metadata.namespace,
                  name:      authSecretName,
                },
              },
            });

            await repo.save();
          } catch (e) {
            if (e.status === 409) {
              // Repo already exists — likely from a previous attempt to save the HelmOp. Ignore.
              return;
            }

            throw e;
          }
        }
      }
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
        }, {
          path:  'spec.helm.chart',
          rules: ['required'],
        }, {
          path:  'spec.helm.version',
          rules: this.isSuseAppCollection ? ['required'] : ['semanticVersion'],
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
    :steps="!isView ? steps : undefined"
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

    <template
      v-if="isSuseAppCollection"
      #auth
    >
      <HelmOpAppCoAuthTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :temp-cached-values="tempCachedValues"
        :create-errors="authCreateErrors"
        :on-create-auth="onCreateAuth"
        :register-before-hook="registerBeforeHook"
        @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
        @update:auth="updateAuth($event.value, $event.key)"
      />
    </template>

    <template #chart>
      <HelmOpChartTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :source-type="sourceType"
        :source-type-options="sourceTypeOptions"
        :is-suse-app-collection="isSuseAppCollection"
        :app-co-repo-name="appCoRepoName"
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
      v-if="isView && steps.length >= 5"
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
            :app-co-repo-name="appCoRepoName"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
            @update:source-type="onSourceTypeSelect"
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
