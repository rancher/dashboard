<script>
import Loading from '@shell/components/Loading.vue';
import jsyaml from 'js-yaml';
import { mapGetters } from 'vuex';
import { mapPref, DIFF } from '@shell/store/prefs';
import { Banner } from '@components/Banner';
import { MANAGEMENT, CATALOG, NORMAN, POD } from '@shell/config/types';
import { NAMESPACE } from '@shell/config/query-params';
import ThanosCatalog from '@shell/components/ThanosCatalog';
import ButtonGroup from '@shell/components/ButtonGroup';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import AsyncButton from '@shell/components/AsyncButton';
import IconMessage from '@shell/components/IconMessage';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { CATALOG as CATALOG_ANNOTATIONS, PROJECT } from '@shell/config/labels-annotations';
import { diff, get, set } from '@shell/utils/object';
import { SETTING, getGlobalMonitoringV2Setting, DEFAULT_GMV2_SETTING } from '@shell/config/settings';
import { delay, mergeWith, isArray, throttle } from 'lodash';
import { formatSi, parseSi } from '@shell/utils/units';
import { base64Encode } from '@shell/utils/crypto';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { monitoringStatus } from '@shell/utils/global-monitoring';
import { setSetting } from '@shell/utils/settings';

const GLOBAL_MONITORING_TOKEN = 'Global Monitoring Token';
const APP_NAME = 'global-monitoring';
const APP_NAMESPACE = 'cattle-global-monitoring';
const THANOS_SIDECAR_TLS = 'thanos-sidecar-tls';
const OBJSTORE_CONFIG_GLOBAL_MONITORING = 'objstore-config-global-monitoring';
const CATTLE_MONITORING_SYSTEM_NAMESPACE = 'cattle-monitoring-system';
const GLOBAL_PROMETHEUS_POD_NAME = 'prometheus-rancher-monitoring-prometheus-0';
const MONITORING_STORE = ['grafana.resources.core', 'thanos.compact.resources', 'thanos.query.resources', 'thanos.store.resources'];
const MONITORING_STORE_WITHOUT_OBJSTORAGE = ['grafana.resources.core', 'thanos.query.resources'];

const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
  DIFF: 'DIFF'
};

export default {
  name:       'GlobalMonitoring',
  components: {
    Loading,
    Banner,
    ThanosCatalog,
    ButtonGroup,
    YamlEditor,
    AsyncButton,
    IconMessage,
  },

  mixins: [
    ChildHook,
  ],

  async fetch() {
    await this.$store.dispatch('catalog/load', { inStore: this.inStore });
    try {
      if (!!this.chart) {
        if (!this.version?.version) {
          this.updateVersion();
        }

        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    this.chart.repoType,
          repoName:    this.chart.repoName,
          chartName:   this.chart.chartName,
          versionName: this.version.version || '',
        });
      }
    } catch (e) {
      console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
    }
    await this.initFormValue();
    this.initApiToken();

    this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    }).then((res) => {
      this.defaultRegistrySetting = res;
    });
  },

  data() {
    const defaultCmdOpts = {
      cleanupOnFail: false,
      crds:          true,
      hooks:         true,
      force:         false,
      resetValues:   false,
      openApi:       true,
      wait:          true,
      timeout:       600,
      historyMax:    5,
    };

    return {
      chartVersion:       '',
      errors:             [],
      warnings:           [],
      currentCluster:     {},
      version:            {},
      monitoringSettings: {},
      disabledV1Done:     false,

      formYamlOption:      VALUES_STATE.FORM,
      showDiff:            false,
      valuesYaml:          '',
      originalYamlValues:  null,
      showValuesComponent: true,
      confirmDisable:      false,
      customCmdOpts:       { ...defaultCmdOpts },
      value:               {},
      versionInfo:         {},
      defaultCmdOpts:      {
        cleanupOnFail: false,
        crds:          true,
        hooks:         true,
        force:         false,
        resetValues:   false,
        openApi:       true,
        wait:          true,
        timeout:       600,
        historyMax:    5,
      },
      useDefaultToken: true,
    };
  },
  watch: {
    formYamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        // Return to form, reset everything back to starting point
        this.showValuesComponent = true;
        this.showDiff = false;
        break;
      case VALUES_STATE.YAML:
        // Show the YAML preview
        if (old === VALUES_STATE.FORM) {
          this.valuesYaml = jsyaml.dump(this.value || {});
        }

        this.showValuesComponent = false;
        this.showDiff = false;
        break;
      case VALUES_STATE.DIFF:
        // Show the YAML diff
        if (old === VALUES_STATE.FORM) {
          this.valuesYaml = jsyaml.dump(this.value || {});
        }

        this.showValuesComponent = false;
        this.updateValue(this.valuesYaml);
        this.showDiff = true;

        break;
      }
    },
    'value.metadata.namespace'(neu, old) {
      if (neu) {
        const ns = this.$store.getters[`${ this.inStore }/byId`](NAMESPACE, this.value.metadata.namespace);

        const project = ns?.metadata.annotations?.[PROJECT];

        if (project) {
          this.project = project.replace(':', '/');
        }
      }
    },
  },
  computed: {
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),
    ...monitoringStatus(this),

    inStore() {
      const currentCluster = this.currentCluster;

      if (currentCluster && currentCluster.id !== 'local') {
        return 'cluster';
      } else {
        return 'management';
      }
    },

    formYamlOptions() {
      const options = [];

      options.push({
        labelKey: 'catalog.install.section.chartOptions',
        value:    VALUES_STATE.FORM,
      }, {
        labelKey: 'catalog.install.section.valuesYaml',
        value:    VALUES_STATE.YAML,
      }, {
        labelKey: 'catalog.install.section.diff',
        value:    VALUES_STATE.DIFF,
        disabled: this.formYamlOption === VALUES_STATE.FORM ? this.originalYamlValues === jsyaml.dump(this.value || {}) : this.originalYamlValues === this.valuesYaml,
      });

      return options;
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

    editorMode() {
      if ( this.showDiff ) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },

    chart() {
      return this.allCharts.find((chart) => {
        return chart.chartName === 'rancher-thanos';
      });
    },

    repo() {
      return this.$store.getters['catalog/repo']({
        repoType: this.chart.repoType,
        repoName: this.chart.repoName,
      });
    },

    hasQuestions() {
      return this.versionInfo && !!this.versionInfo.questions;
    },

    showingYaml() {
      return this.formYamlOption === VALUES_STATE.YAML || !this.hasQuestions;
    },

    cmdOptions() {
      return this.defaultCmdOpts;
    },

    objectStorageEnabled() {
      return this.value?.thanos?.compact?.enabled && this.value?.thanos?.store?.enabled;
    },

    storeLimitOptions() {
      if (this.objectStorageEnabled) {
        return MONITORING_STORE;
      } else {
        return MONITORING_STORE_WITHOUT_OBJSTORAGE;
      }
    },

    needCpu() {
      let need = 0;

      this.storeLimitOptions.forEach((item) => {
        need = need + parseSi(get(this.value, `${ item }.limits.cpu`)) + parseSi(get(this.value, `${ item }.requests.cpu`));
      });

      return need;
    },

    needMemory() {
      let need = 0;

      this.storeLimitOptions.forEach((item) => {
        need = need + parseSi(get(this.value, `${ item }.limits.memory`) || '0') + parseSi(get(this.value, `${ item }.requests.memory`) || '0');
      });

      return need;
    },
  },
  methods: {
    get,
    updateValue(value) {
      if (this.$refs.yaml) {
        this.$refs.yaml.updateValue(value);
      }
    },
    cancel() {
      this.$emit('cancel');
    },

    addGlobalValuesTo(values) {
      let global = values.global;

      if ( !global ) {
        global = {};
        set(values, 'global', global);
      }

      let cattle = global.cattle;

      if ( !cattle ) {
        cattle = {};
        set(values.global, 'cattle', cattle);
      }

      const cluster = this.currentCluster;
      const defaultRegistry = this.defaultRegistrySetting?.value || '';
      const serverUrl = this.serverUrlSetting?.value || '';
      const isWindows = cluster?.providerOs === 'windows';
      const pathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      setIfNotSet(cattle, 'clusterId', cluster?.id);
      setIfNotSet(cattle, 'clusterName', cluster?.nameDisplay);
      setIfNotSet(cattle, 'systemDefaultRegistry', defaultRegistry);
      setIfNotSet(global, 'systemDefaultRegistry', defaultRegistry);
      setIfNotSet(cattle, 'url', serverUrl);
      setIfNotSet(cattle, 'rkePathPrefix', pathPrefix);
      setIfNotSet(cattle, 'rkeWindowsPathPrefix', windowsPathPrefix);

      if ( isWindows ) {
        setIfNotSet(cattle, 'windows.enabled', true);
      }

      return values;

      function setIfNotSet(obj, key, val) {
        if ( typeof get(obj, key) === 'undefined' ) {
          set(obj, key, val);
        }
      }
    },

    applyYamlToValues() {
      try {
        this.value = jsyaml.load(this.valuesYaml);
      } catch (err) {
        return { errors: exceptionToErrorsArray(err) };
      }

      return { errors: [] };
    },

    actionInput(isUpgrade) {
      const fromChart = jsyaml.load(this.originalYamlValues) || {};

      const errors = [];

      if ( this.showingYaml ) {
        const { errors: yamlErrors } = this.applyYamlToValues();

        errors.push(...yamlErrors);
      }

      // Only save the values that differ from the chart's standard values.yaml
      const values = diff(fromChart, this.value);

      // Add our special blend of 11 herbs and global values
      this.addGlobalValuesTo(values);

      const form = JSON.parse(JSON.stringify(this.value));
      const migratedAnnotations = this.migratedApp ? { [CATALOG_ANNOTATIONS.MIGRATED]: 'true' } : {};
      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version?.version,
        releaseName: form.metadata.name,
        annotations: {
          ...migratedAnnotations,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.chart.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.chart.repoName
        },
        values,
      };

      const out = {
        charts:    [chart],
        noHooks:   this.cmdOptions.hooks === false,
        timeout:   this.cmdOptions.timeout > 0 ? `${ this.cmdOptions.timeout }s` : null,
        wait:      this.cmdOptions.wait === true,
        namespace: form.metadata.namespace,
        projectId: this.project,
      };

      if ( isUpgrade ) {
        out.force = this.cmdOptions.force === true;
        out.historyMax = this.cmdOptions.historyMax;
        out.cleanupOnFail = this.cmdOptions.cleanupOnFail;
      } else {
        out.disableOpenAPIValidation = this.cmdOptions.openApi === false;
        out.skipCRDs = this.cmdOptions.crds === false;
      }

      return { errors, input: out };
    },

    updateVersion(inputValue) {
      if (!inputValue && this.chart?.versions?.length) {
        this.version = this.chart.versions[0];
      } else {
        this.version = this.chart.versions.find(v => v.version === inputValue) || {};
      }
    },

    done(settings) {
      setSetting(this.$store, SETTING.GLOBAL_MONITORING_V2, JSON.stringify(settings));
      setSetting(this.$store, SETTING.GLOBAL_MONITORING_CLUSTER_ID, settings.clusterId);
      this.monitoringStatus = true;
      if (this.value.thanos.tls.enabled) {
        this.updateDownStreamClusterSecret();
      }
      if (settings.useDefaultToken) {
        this.value.ui.apiToken = '';
      }
    },
    async save(btnCb) {
      this.validate();

      const errors = this.errors.concat(this.value.errors || []);

      this.$set(this, 'errors', errors);
      delete this.value.errors;

      try {
        const isUpgrade = this.monitoringStatus.installed;
        const settings = this.getSetting();

        await this.applyHooks(BEFORE_SAVE_HOOKS);

        await this.setApiToken();

        const { errors, input } = this.actionInput(isUpgrade);

        this.errors = this.errors.concat(errors);

        if ( this.errors?.length ) {
          btnCb(false);

          return;
        }

        const res = await this.repo.doAction((isUpgrade ? 'upgrade' : 'install'), input);
        const operationId = `${ res.operationNamespace }/${ res.operationName }`;

        // Non-admins without a cluster won't be able to fetch operations immediately
        await this.repo.waitForOperation(operationId);

        // Dynamically use store decided when loading catalog (covers standard user case when there's not cluster)
        this.operation = await this.$store.dispatch(`${ this.inStore }/find`, {
          type: CATALOG.OPERATION,
          id:   operationId
        });

        try {
          await this.operation.waitForLink('logs');
          this.operation.openLogs();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
          // The wait times out eventually, move on...
        }

        await this.applyHooks(AFTER_SAVE_HOOKS);

        btnCb(true);
        this.done(settings);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
    },

    promptDisableMonitoring() {
      set(this, 'confirmDisable', true);
      delay(() => {
        set(this, 'confirmDisable', false);
      }, 10000);
    },

    async disableMonitoring() {
      try {
        const app = await this.$store.dispatch(`${ this.inStore }/find`, {
          type: CATALOG.APP,
          id:   `${ this.value.metadata.namespace }/${ this.value.metadata.name }`,
        });

        const res = await app.doAction('uninstall', {});
        const operationId = `${ res.operationNamespace }/${ res.operationName }`;

        // Non-admins without a cluster won't be able to fetch operations immediately
        await this.repo.waitForOperation(operationId);

        // Dynamically use store decided when loading catalog (covers standard user case when there's not cluster)
        this.operation = await this.$store.dispatch(`${ this.inStore }/find`, {
          type: CATALOG.OPERATION,
          id:   operationId
        });

        await this.operation.waitForLink('logs');
        this.operation.openLogs();
      } catch (error) {
        // The wait times out eventually, move on...
      }
      this.removeHistoryApiToken();

      const settings = {
        ...DEFAULT_GMV2_SETTING,
        clusterId: this.currentCluster.id,
        enabled:   'false'
      };

      setSetting(this.$store, SETTING.GLOBAL_MONITORING_V2, JSON.stringify(settings));
      this.$set(this, 'monitoringSettings', settings);
      this.monitoringStatus = false;
    },

    getSetting() {
      const obj = this.monitoringSettings;
      const useDefaultToken = this.getUseDefaultToken();

      obj.useDefaultToken = useDefaultToken.toString();
      obj.clusterId = this.value.global.clusterId;
      obj.enabled = 'true';

      return obj;
    },

    getUseDefaultToken() {
      if (this.showValuesComponent) {
        const useDefaultToken = this.$refs.thanosCatalog.useDefaultToken;

        return useDefaultToken;
      } else if (this.value?.ui?.apiToken) {
        const apiToken = this.value.ui.apiToken;

        return !apiToken;
      } else {
        return this.useDefaultToken;
      }
    },

    updateSecretThanosSidecarTls(prefix) {
      const { ca, cert, key } = this.value?.thanos?.tls || {};

      this.$store.dispatch('management/request', { url: `${ prefix }/v1/secrets/${ CATTLE_MONITORING_SYSTEM_NAMESPACE }/${ THANOS_SIDECAR_TLS }` }).then((res) => {
        this.$store.dispatch('management/request', {
          method: 'PUT',
          data:   {
            ...res,
            data: {
              'tls.ca':   ca,
              'tls.cert': cert,
              'tls.key':  key,
            },
          },
          url: `${ prefix }/v1/secrets/${ CATTLE_MONITORING_SYSTEM_NAMESPACE }/${ THANOS_SIDECAR_TLS }`
        });
      }).catch((error) => {
        if (error.status === 404) {
          this.$store.dispatch('management/request', {
            url:    `${ prefix }/v1/secrets`,
            method: 'POST',
            data:   {
              _type:    TYPES.OPAQUE,
              type:     TYPES.OPAQUE,
              metadata: {
                name:      THANOS_SIDECAR_TLS,
                namespace: CATTLE_MONITORING_SYSTEM_NAMESPACE,
              },
              data: {
                'tls.ca':   ca,
                'tls.cert': cert,
                'tls.key':  key,
              },
            },
          });
        }
      });
    },

    updateSecretObjstoreConfigGlobalMonitoring(prefix) {
      if (!this.objectStorageEnabled) {
        return;
      }

      this.$store.dispatch('management/request', { url: `${ prefix }/v1/secrets/${ CATTLE_MONITORING_SYSTEM_NAMESPACE }/${ OBJSTORE_CONFIG_GLOBAL_MONITORING }` }).then((res) => {
        this.$store.dispatch('management/request', {
          method: 'PUT',
          data:   {
            ...res,
            data: { 'config.yaml': base64Encode(jsyaml.dump(this.value?.thanos?.objectConfig || '')) },
          },
          url: `${ prefix }/v1/secrets/${ CATTLE_MONITORING_SYSTEM_NAMESPACE }/${ OBJSTORE_CONFIG_GLOBAL_MONITORING }`
        });
      }).catch((error) => {
        if (error.status === 404) {
          this.$store.dispatch('management/request', {
            url:    `${ prefix }/v1/secrets`,
            method: 'POST',
            data:   {
              type:     TYPES.OPAQUE,
              metadata: {
                name:      OBJSTORE_CONFIG_GLOBAL_MONITORING,
                namespace: CATTLE_MONITORING_SYSTEM_NAMESPACE,
              },
              data: { 'config.yaml': base64Encode(jsyaml.dump(this.value?.thanos?.objectConfig || '')) },
            },
          });
        }
      });
    },
    updateDownStreamClusterSecret() {
      if (!this.value?.thanos?.tls?.enabled ) {
        return;
      }
      this.monitoringSettings.enabledClusters.forEach((c) => {
        const prefix = c.id === 'local' ? '' : `/k8s/clusters/${ c.id }`;

        this.$store.dispatch('management/request', { url: `${ prefix }/v1/namespaces/${ CATTLE_MONITORING_SYSTEM_NAMESPACE }` }).then(() => {
          this.updateSecretThanosSidecarTls(prefix);
          this.updateSecretObjstoreConfigGlobalMonitoring(prefix);
        }).catch((errNs) => {
          if (errNs.status === 404) {
            this.$store.dispatch('management/request', {
              url:    `${ prefix }/v1/namespaces`,
              method: 'POST',
              data:   {
                type:     MANAGEMENT.NAMESPACE,
                metadata: { name: CATTLE_MONITORING_SYSTEM_NAMESPACE },
              },
            }).then((res) => {
              this.updateSecretThanosSidecarTls(prefix);
              this.updateSecretObjstoreConfigGlobalMonitoring(prefix);
            });
          }
        });
      });

      delay(() => {
        this.removePod();
      }, 2000);
    },

    async removeHistoryApiToken() {
      const promises = [];
      let tokens = await this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN });

      tokens = tokens.filter(t => t.description === GLOBAL_MONITORING_TOKEN) || [];

      if (tokens && tokens.length) {
        tokens.forEach((token) => {
          promises.push(this.$store.dispatch('rancher/request', {
            url:    token.linkFor('remove'),
            method: 'DELETE',
          }));
        });
      }

      return await Promise.all(promises);
    },

    async removePod() {
      try {
        const pod = await this.$store.dispatch('cluster/find', {
          type: POD,
          id:   `${ CATTLE_MONITORING_SYSTEM_NAMESPACE }/${ GLOBAL_PROMETHEUS_POD_NAME }`
        });

        pod.remove();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },

    async setApiToken() {
      const useDefaultToken = this.getUseDefaultToken();

      if (!useDefaultToken) {
        return;
      }

      await this.removeHistoryApiToken();

      const token = await this.$store.dispatch('rancher/request', {
        url:    '/v3/tokens',
        method: 'POST',
        data:   {
          description: GLOBAL_MONITORING_TOKEN,
          metadata:    {},
          ttl:         0,
          type:        'token',
        },
      });

      this.$set(this.value.ui, 'apiToken', token.token);
    },

    async initFormValue() {
      let app = {};

      try {
        app = await this.$store.dispatch(`${ this.inStore }/find`, {
          type: CATALOG.APP,
          id:   `${ APP_NAMESPACE }/${ APP_NAME }`
        });

        this.chartVersion = get(app, 'spec.chart.metadata.version') || '';
      } catch (error) {}

      const value = await this.$store.dispatch(`${ this.inStore }/create`, {
        type:     'chartInstallAction',
        metadata: {
          namespace: APP_NAMESPACE,
          name:      APP_NAME,
        },
        ...(JSON.parse(JSON.stringify(this.versionInfo?.values || {}))),
      });

      this.originalYamlValues = this.valuesYaml = jsyaml.dump(value || {});

      this.value = (mergeWith(value, app?.spec?.values || {}, (objValue, srcValue) => {
        if (isArray(objValue)) {
          return objValue.concat(srcValue);
        }
      }));

      if (!this?.value?.global?.clusterId) {
        set(this, 'value.global.clusterId', this.currentCluster?.id || 'local');
      }

      this.initServerUrl();
    },
    initServerUrl() {
      this.serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL) || {};

      this.value.ui && this.serverUrlSetting.value && this.$set(this.value.ui, 'serverUrl', this.serverUrlSetting.value);
    },
    initApiToken() {
      const useDefaultToken = this.monitoringSettings?.useDefaultToken === 'true';

      this.useDefaultToken = useDefaultToken;

      if (useDefaultToken) {
        this.$set(this.value.ui, 'apiToken', '');
      }
    },
    initGlobalMonitoringRoute() {
      const monitoringSettings = getGlobalMonitoringV2Setting(this.$store.getters);
      const installedClusterId = monitoringSettings.clusterId;
      const currentClusterId = this.monitoringStatus.installed ? installedClusterId : this.getRouteParamsClusterId();
      const currentCluster = this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, currentClusterId);

      this.currentCluster = currentCluster;
      this.monitoringSettings = monitoringSettings;

      if (currentCluster?.metadata?.state?.name !== 'active') {
        this.$set(this, 'warnings', [this.t('globalMonitoringPage.globalMonitoringClusterUnavailable', { clusterName: currentCluster?.nameDisplay || currentClusterId } )]);

        return;
      }

      if (this.monitoringStatus.installed && this.$route.params.cluster !== installedClusterId) {
        delay(() => {
          this.$router.replace({
            name:   this.$route.name,
            params: {
              ...this.$route.params,
              cluster: currentClusterId
            }
          });
        }, 1000);
      }
    },

    disableGlobalMonitoringV1(buttonCb) {
      this.$store.dispatch(`${ this.inStore }/promptModal`, {
        component: 'GenericPrompt',
        resources: {
          applyMode:   'disable',
          applyAction: async(buttonDone) => {
            const projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });

            const projectId = projects.find(p => p.spec.displayName === 'System')?.id;
            const monitoringId = `${ projectId.split('/')[1] }:global-monitoring`;

            this.$store.dispatch('rancher/request', {
              url:     `/v3/project/${ projectId.replace('/', ':') }/apps/${ monitoringId }`,
              method:  'DELETE',
              headers: { 'x-api-action-links': 'actionLinks' }
            }).then(() => {
              setSetting(this.$store, SETTING.GLOBAL_MONITORING_ENABLED, 'false');

              this.$set(this, 'disabledV1Done', true);
              this.$emit('update', { ready: true, hidden: true });
            }).catch(() => {
              throw new Error(`Failed to uninstall`);
            });
          },
          title: this.t('promptRemove.title', {}, true),
          body:  this.t('globalMonitoringPage.uninstallV1.promptDescription', {}, true),
        },
      });
      buttonCb(true);
    },

    validate() {
      this.errors = [];

      if (!this.showValuesComponent) {
        if (!this.useDefaultToken && !this.value.ui.apiToken) {
          this.errors.push(this.t('globalMonitoringPage.token.custom.yamlRequired', true));
        }
      }
      if (this.$refs.thanosCatalog) {
        this.$refs.thanosCatalog.validate();
      }
    },

    updateWarning: throttle(function() {
      this.getStoreWarnings();
    }, 1500, { trailing: true }),

    updateUseDefaultToken(neu) {
      this.useDefaultToken = neu;
    },

    getStoreWarnings() {
      const warnings = [];

      if ( this.monitoringStatus.installed ) {
        // Ignore the limits on upgrade (or if asked by query) and don't show any warnings
      } else {
        const needCpu = this.needCpu;
        const needMemory = this.needMemory;

        // Note: These are null if unknown
        const availableCpu = this.currentCluster?.availableCpu;
        const availableMemory = this.currentCluster?.availableMemory;

        if ( availableCpu !== null && availableCpu < needCpu ) {
          warnings.push(this.t('catalog.install.error.insufficientCpu', {
            need: Math.round(needCpu * 100) / 100,
            have: Math.round(availableCpu * 100) / 100,
          }));
        }

        if ( availableMemory !== null && availableMemory < needMemory ) {
          warnings.push(this.t('catalog.install.error.insufficientMemory', {
            need: formatSi(needMemory, {
              increment: 1024, suffix: 'iB', firstSuffix: 'B'
            }),
            have: formatSi(availableMemory, {
              increment: 1024, suffix: 'iB', firstSuffix: 'B'
            }),
          }));
        }
      }

      this.$set(this, 'warnings', warnings);
    },
    getRouteParamsClusterId() {
      const params = this.$route.params.cluster;

      return params === '_' ? 'local' : params;
    },

    reloadPage() {
      this.$router.go(0);
    }
  },

  mounted() {
    this.getStoreWarnings();
  },

  created() {
    this.initGlobalMonitoringRoute();
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="monitoringStatus.v1 || disabledV1Done">
    <header>
      <div class="title">
        <h1>
          <t k="globalMonitoringPage.header" />
        </h1>
      </div>
    </header>
    <div class="v1-monitoring">
      <template v-if="!disabledV1Done">
        <IconMessage
          class="mt-40 mb-20"
          icon="icon-warning"
          :vertical="true"
          icon-state="warning"
        >
          <template #message>
            <p>
              {{ t('globalMonitoringPage.uninstallV1.warning1') }}
            </p>
          </template>
        </IconMessage>
        <AsyncButton
          mode="disable"
          :delay="0"
          @click="disableGlobalMonitoringV1"
        />
      </template>
      <template v-else>
        <IconMessage
          class="mt-40"
          icon="icon-checkmark"
          :vertical="true"
          icon-state="success"
        >
          <template #message>
            <p class="">
              {{ t('globalMonitoringPage.uninstallV1.success1') }}
            </p>
          </template>
        </IconMessage>
        <AsyncButton
          mode="finish"
          :delay="0"
          @click="reloadPage"
        />
      </template>
    </div>
  </div>
  <section
    v-else
    class="dashboard"
  >
    <header>
      <div class="title">
        <h1>
          <t k="globalMonitoringPage.header" />
        </h1>
      </div>
    </header>

    <div v-if="warnings.length">
      <Banner
        v-for="(w, index) in warnings"
        :key="index"
        :closable="true"
        class="cluster-tools-tip"
        color="warning"
        :label="w"
      />
    </div>
    <Banner
      v-else-if="!chart"
      :closable="true"
      class="cluster-tools-tip"
      color="warning"
      :label="t('globalMonitoringPage.warning.undefindChart')"
    />
    <template>
      <div class="chart__values__controls">
        <ButtonGroup
          v-model="formYamlOption"
          :options="formYamlOptions"
          inactive-class="bg-disabled btn-sm"
          active-class="bg-primary btn-sm"
        />
        <div class="chart__values__controls--spacer" />
        <ButtonGroup
          v-if="showDiff"
          v-model="diffMode"
          :options="yamlDiffModeOptions"
          inactive-class="bg-disabled btn-sm"
          active-class="bg-primary btn-sm"
        />
      </div>
      <div class="scroll__container">
        <div class="scroll__content">
          <template v-if="showValuesComponent">
            <ThanosCatalog
              ref="thanosCatalog"
              v-model="value"
              :installed="monitoringStatus.installed"
              option-key="value"
              :chart="chart"
              :ui="get(versionInfo, 'values.ui') || {}"
              :version="chartVersion"
              :monitoring-settings="monitoringSettings"
              @updateVersion="updateVersion"
              @updateWarning="updateWarning"
              @updateUseDefaultToken="updateUseDefaultToken"
            />
          </template>
          <template v-else>
            <YamlEditor
              ref="yaml"
              v-model="valuesYaml"
              class="chart__values__content"
              :scrolling="true"
              :initial-yaml-values="originalYamlValues"
              :editor-mode="editorMode"
              :hide-preview-buttons="true"
            />
          </template>
        </div>
      </div>
    </template>

    <div>
      <Banner
        v-for="(err,idx) in errors"
        :key="idx"
        color="error"
        :label="err"
      />
    </div>

    <div class="controls-container pt-20">
      <button
        v-if="monitoringStatus.installed && confirmDisable"
        class="mr-10 btn bg-error"
        @click="disableMonitoring"
      >
        {{ t('globalMonitoringPage.confirmDisable') }}
      </button>
      <button
        v-else-if="monitoringStatus.installed"
        class="mr-10 btn bg-error"
        @click="promptDisableMonitoring"
      >
        {{ t('globalMonitoringPage.disable') }}
      </button>
      <AsyncButton
        :disabled="!chart || warnings.length > 0"
        @click="save"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
  $padding: 5px;
  $spacer: 10px;

  .outlet {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .chart {
    &__basic {
      display: flex;
      flex-direction: column;
      flex: 1;

      .spacer {
        line-height: 2;
      }
    }
    &__values {
      &__controls {
        display: flex;
        margin-bottom: 15px;

        & > *:not(:last-of-type) {
          margin-right: $padding * 2;
        }

        &--spacer {
          flex: 1
        }

      }

      &__content {
        flex: 1;

        ::v-deep .tab-container {
          overflow: auto;
        }
      }

    }
  }

  .controls-container {
    display: flex;
    justify-content: right;
    padding-top: $spacer;

    border-top: var(--header-border-size) solid var(--header-border);
  }

  .v1-monitoring {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    p {
      max-width: 900px;
    }
    .btn {
      min-width: 200px;
    }
  }
</style>
