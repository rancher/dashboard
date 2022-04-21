<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEqual from 'lodash/isEqual';
import { mapPref, DIFF } from '@shell/store/prefs';
import { mapFeature, MULTI_CLUSTER, LEGACY } from '@shell/store/features';
import { mapGetters } from 'vuex';

import Banner from '@shell/components/Banner';
import ButtonGroup from '@shell/components/ButtonGroup';
import ChartReadme from '@shell/components/ChartReadme';
import Checkbox from '@shell/components/form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@shell/components/form/LabeledInput';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Questions from '@shell/components/Questions';
import Tabbed from '@shell/components/Tabbed';
import UnitInput from '@shell/components/form/UnitInput';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import Wizard from '@shell/components/Wizard';
import TypeDescription from '@shell/components/TypeDescription';
import ChartMixin from '@shell/mixins/chart';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { CATALOG, MANAGEMENT, DEFAULT_WORKSPACE } from '@shell/config/types';
import {
  CHART, FROM_CLUSTER, FROM_TOOLS, HIDE_SIDE_NAV, NAMESPACE, REPO, REPO_TYPE, VERSION, _FLAGGED
} from '@shell/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, PROJECT } from '@shell/config/labels-annotations';

import { exceptionToErrorsArray } from '@shell/utils/error';
import { clone, diff, get, set } from '@shell/utils/object';
import { findBy, insertAt } from '@shell/utils/array';
import Vue from 'vue';
import { saferDump } from '@shell/utils/create-yaml';
import { LINUX, WINDOWS } from '@shell/store/catalog';

const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
  DIFF: 'DIFF'
};

function isPlainLayout(query) {
  return Object.keys(query).includes(HIDE_SIDE_NAV);
}

export default {
  name: 'Install',

  layout(context) {
    return isPlainLayout(context.query) ? 'plain' : '';
  },

  components: {
    Banner,
    ButtonGroup,
    ChartReadme,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    LazyImage,
    Loading,
    NameNsDescription,
    ResourceCancelModal,
    Questions,
    Tabbed,
    UnitInput,
    YamlEditor,
    Wizard,
    TypeDescription
  },

  mixins: [
    ChildHook,
    ChartMixin
  ],

  async fetch() {
    await this.fetchChart();

    this.errors = [];

    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    });

    this.serverUrlSetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url'
    });

    if ( this.existing ) {
      this.forceNamespace = this.existing.metadata.namespace;
      this.nameDisabled = true;
    } else if (this.$route.query[FROM_CLUSTER] === _FLAGGED) {
      this.forceNamespace = DEFAULT_WORKSPACE;
    } else if ( this.chart?.targetNamespace ) {
      this.forceNamespace = this.chart.targetNamespace;
    } else if ( this.query.appNamespace ) {
      this.forceNamespace = this.query.appNamespace;
    } else {
      this.forceNamespace = null;
    }

    this.legacyApp = this.existing ? await this.existing.deployedAsLegacy() : false;
    this.mcapp = this.existing ? await this.existing.deployedAsMultiCluster() : false;

    this.value = await this.$store.dispatch('cluster/create', {
      type:     'chartInstallAction',
      metadata: {
        namespace: this.forceNamespace || this.$store.getters['defaultNamespace'],
        name:      this.existing?.spec?.name || this.query.appName || '',
      }
    });

    if ( !this.existing) {
      if ( this.chart?.targetName ) {
        this.value.metadata.name = this.chart.targetName;
        this.nameDisabled = true;
      } else if ( this.query.appName ) {
        this.value.metadata.name = this.query.appName;
      } else {
        this.nameDisabled = false;
      }

      if ( this.query.description ) {
        this.customCmdOpts.description = this.query.description;
      }
    }

    if (this.forceNamespace && !this.existing) {
      let ns;

      try {
        ns = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: this.forceNamespace });
        const project = ns.metadata.annotations?.[PROJECT];

        if (project) {
          this.project = project.replace(':', '/');
        }
      } catch {}
    }

    if ( !this.chart || !this.query.versionName) {
      return;
    }

    if ( this.version && process.client ) {
      await this.loadValuesComponent();
    }

    await this.loadChartSteps();

    if ( !this.loadedVersion || this.loadedVersion !== this.version.key ) {
      let userValues;

      if ( this.loadedVersion ) {
        // If changing charts once the page is loaded, diff from the chart you were
        // previously on to get the actual customization, then apply onto the new chart values.

        if ( this.showingYaml ) {
          this.applyYamlToValues();
        }

        userValues = diff(this.loadedVersionValues, this.chartValues);
      } else if ( this.existing ) {
        // For an existing app, use the values from the previous install
        userValues = clone(this.existing.spec?.values || {});
        // For an existing app, use the values from the previous install
      } else {
        // For an new app, start empty
        userValues = {};
      }

      this.removeGlobalValuesFrom(userValues);
      this.chartValues = merge(merge({}, this.versionInfo?.values || {}), userValues);
      this.valuesYaml = saferDump(this.chartValues);

      // For YAML diff
      if ( !this.loadedVersion ) {
        this.originalYamlValues = this.valuesYaml;
      }

      this.loadedVersionValues = this.versionInfo?.values || {};
      this.loadedVersion = this.version?.key;
    }

    this.updateStepOneReady();

    this.preFormYamlOption = this.valuesComponent || this.hasQuestions ? VALUES_STATE.FORM : VALUES_STATE.YAML;

    // Look for annotation to say this app is a legacy migrated app (we look in either place for now)
    this.migratedApp = (this.existing?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MIGRATED] === 'true');
  },

  data() {
    const defaultCmdOpts = {
      cleanupOnFail:       false,
      crds:                true,
      hooks:               true,
      force:               false,
      resetValues:         false,
      openApi:             true,
      wait:                true,
      timeout:       600,
      historyMax:    5,
    };

    return {
      defaultRegistrySetting: null,
      serverUrlSetting:       null,
      chartValues:            null,
      originalYamlValues:     null,
      previousYamlValues:     null,
      errors:                 null,
      existing:               null,
      forceNamespace:         null,
      loadedVersion:          null,
      loadedVersionValues:    null,
      legacyApp:              null,
      mcapp:                  null,
      mode:                   null,
      value:                  null,
      valuesComponent:        null,
      valuesYaml:             '',
      project:                null,
      migratedApp:            false,

      defaultCmdOpts,
      customCmdOpts: { ...defaultCmdOpts },

      nameDisabled: false,

      preFormYamlOption:   VALUES_STATE.YAML,
      formYamlOption:      VALUES_STATE.YAML,
      showDiff:            false,
      showValuesComponent: true,
      showQuestions:       true,
      showSlideIn:         false,
      shownReadmeWindows:  [],
      componentHasTabs:    false,
      showCommandStep:     false,
      isNamespaceNew:      false,

      stepBasic: {
        name:           'basics',
        label:          this.t('catalog.install.steps.basics.label'),
        subtext:        this.t('catalog.install.steps.basics.subtext'),
        descriptionKey: 'catalog.install.steps.basics.description',
        ready:          true,
        weight:         30
      },
      stepClusterTplVersion: {
        name:           'clusterTplVersion',
        label:          this.t('catalog.install.steps.clusterTplVersion.label'),
        subtext:        this.t('catalog.install.steps.clusterTplVersion.subtext'),
        descriptionKey: 'catalog.install.steps.helmValues.description',
        ready:          true,
        weight:         30
      },
      stepValues: {
        name:           'helmValues',
        label:          this.t('catalog.install.steps.helmValues.label'),
        subtext:        this.t('catalog.install.steps.helmValues.subtext'),
        descriptionKey: 'catalog.install.steps.helmValues.description',
        ready:          true,
        weight:         20
      },
      stepCommands: {
        name:           'helmCli',
        label:          this.t('catalog.install.steps.helmCli.label'),
        subtext:        this.t('catalog.install.steps.helmCli.subtext'),
        descriptionKey: 'catalog.install.steps.helmCli.description',
        ready:          true,
        weight:         10
      },

      customSteps: [

      ],

      isPlainLayout: isPlainLayout(this.$route.query),

      legacyDefs: {
        legacy: this.t('catalog.install.error.legacy.category.legacy'),
        mcm:    this.t('catalog.install.error.legacy.category.mcm')
      }
    };
  },

  computed: {
    ...mapGetters({ inStore: 'catalog/inStore', features: 'features/get' }),
    mcm: mapFeature(MULTI_CLUSTER),

    namespaceIsNew() {
      const all = this.$store.getters['cluster/all'](NAMESPACE);
      const want = this.value?.metadata?.namespace;

      if ( !want ) {
        return false;
      }

      return !findBy(all, 'id', want);
    },

    showProject() {
      return this.isRancher && !this.existing && this.forceNamespace;
    },

    projectOpts() {
      const cluster = this.currentCluster;
      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      const out = projects.filter(x => x.spec.clusterName === cluster.id).map((project) => {
        return {
          id:    project.id,
          label: project.nameDisplay,
          value: project.id
        };
      });

      out.unshift({
        id:    'none',
        label: `(${ this.t('generic.none') })`,
        value: '',
      });

      return out;
    },

    charts() {
      const current = this.existing?.matchingChart(true);

      const out = this.$store.getters['catalog/charts'].filter((x) => {
        if ( x.key === current?.key || x.chartName === current?.chartName ) {
          return true;
        }

        if ( x.hidden && !this.showHidden ) {
          return false;
        }

        if ( x.deprecated && !this.showDeprecated ) {
          return false;
        }

        return true;
      });

      let last = '';

      for ( let i = 0 ; i < out.length ; i++ ) {
        if ( out[i].repoName !== last ) {
          last = out[i].repoName;
          insertAt(out, i, {
            kind:     'label',
            label:    out[i].repoNameDisplay,
            disabled: true
          });
          i++;
        }
      }

      return out;
    },

    showSelectVersionOrChart() {
      // Allow the user to choose a version if the app exists OR they've come from tools
      return this.existing || (FROM_TOOLS in this.$route.query);
    },

    showNameEditor() {
      return !this.nameDisabled || !this.forceNamespace;
    },

    showVersions() {
      return this.chart?.versions.length > 1;
    },

    targetNamespace() {
      if ( this.forceNamespace ) {
        return this.forceNamespace;
      } else if ( this.value?.metadata.namespace ) {
        return this.value.metadata.namespace;
      }

      return 'default';
    },

    editorMode() {
      if ( this.showDiff ) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },

    showingYaml() {
      return this.formYamlOption === VALUES_STATE.YAML || ( !this.valuesComponent && !this.hasQuestions );
    },

    formYamlOptions() {
      const options = [];

      if (this.valuesComponent || this.hasQuestions) {
        options.push({
          labelKey: 'catalog.install.section.chartOptions',
          value:    VALUES_STATE.FORM,
        });
      }
      options.push({
        labelKey: 'catalog.install.section.valuesYaml',
        value:    VALUES_STATE.YAML,
      }, {
        labelKey: 'catalog.install.section.diff',
        value:    VALUES_STATE.DIFF,
        // === quite obviously shouldn't work, but has been and still does. When the magic breaks address with heavier stringify/jsyaml.dump
        disabled: this.formYamlOption === VALUES_STATE.FORM ? this.originalYamlValues === jsyaml.dump(this.chartValues || {}) : this.originalYamlValues === this.valuesYaml,
      });

      return options;
    },

    yamlDiffModeOptions() {
      return [{
        labelKey: 'resourceYaml.buttons.unified',
        value:    'unified',
      }, {
        labelKey: 'resourceYaml.buttons.split',
        value:    'split',
      }];
    },

    stepperName() {
      return this.existing?.nameDisplay || this.chart?.chartNameDisplay;
    },

    stepperSubtext() {
      return this.existing && this.currentVersion !== this.targetVersion ? `${ this.currentVersion } > ${ this.targetVersion }` : this.targetVersion;
    },

    readmeWindowName() {
      // Version can change, so allow multiple WM tabs for different versions
      return `${ this.stepperName }-${ this.version?.version }`;
    },

    showingReadmeWindow() {
      return !!this.$store.getters['wm/byId'](this.readmeWindowName);
    },

    diffMode: mapPref(DIFF),

    step1Description() {
      const descriptionKey = this.steps.find(s => s.name === 'basics').descriptionKey;

      return this.$store.getters['i18n/withFallback'](descriptionKey, { action: this.action, existing: !!this.existing }, '');
    },

    step2Description() {
      const descriptionKey = this.steps.find(s => s.name === 'helmValues').descriptionKey;

      return this.$store.getters['i18n/withFallback'](descriptionKey, { action: this.action, existing: !!this.existing }, '');
    },

    step3Description() {
      const descriptionKey = this.steps.find(s => s.name === 'helmCli').descriptionKey;

      return this.$store.getters['i18n/withFallback'](descriptionKey, { action: this.action, existing: !!this.existing }, '');
    },

    steps() {
      const steps = [];

      const type = this.version?.annotations?.[CATALOG_ANNOTATIONS.TYPE];

      if ( type === CATALOG_ANNOTATIONS._CLUSTER_TPL ) {
        if (this.filteredVersions?.length > 1) {
          steps.push(this.stepClusterTplVersion);
        }
        steps.push({
          ...this.stepValues,
          label:          this.t('catalog.install.steps.clusterTplValues.label'),
          subtext:        this.t('catalog.install.steps.clusterTplValues.subtext'),
          descriptionKey: 'catalog.install.steps.clusterTplValues.description',
        });
      } else {
        steps.push(
          this.stepBasic,
          this.stepValues,
          ...this.customSteps
        );
      }

      if (this.showCommandStep) {
        steps.push(this.stepCommands);
      }

      return steps.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    },

    cmdOptions() {
      return this.showCommandStep ? this.customCmdOpts : this.defaultCmdOpts;
    },

    namespaceNewAllowed() {
      return !this.existing && !this.forceNamespace;
    },

    legacyEnabled() {
      return this.features(LEGACY);
    },

    legacyFeatureRoute() {
      return {
        name:   'c-cluster-product-resource',
        params: { product: 'settings', resource: 'management.cattle.io.feature' }
      };
    },

    legacyAppRoute() {
      return { name: 'c-cluster-legacy-project' };
    },

    mcmRoute() {
      return { name: 'c-cluster-mcapps' };
    },

    windowsIncompatible() {
      if (this.chart?.windowsIncompatible) {
        return this.t('catalog.charts.windowsIncompatible');
      }
      if (this.versionInfo) {
        const incompatibleVersion = !(this.versionInfo?.chart?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).includes('windows');

        if (incompatibleVersion && !this.chart.windowsIncompatible) {
          return this.t('catalog.charts.versionWindowsIncompatible');
        }
      }

      return null;
    }
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
        this.showSlideIn = false;
      }
    },

    'value.metadata.namespace'(neu, old) {
      if (neu) {
        const ns = this.$store.getters['cluster/byId'](NAMESPACE, this.value.metadata.namespace);

        const project = ns?.metadata.annotations?.[PROJECT];

        if (project) {
          this.project = project.replace(':', '/');
        }
      }
    },

    preFormYamlOption(neu, old) {
      if (neu === VALUES_STATE.FORM && this.valuesYaml !== this.previousYamlValues && !!this.$refs.cancelModal) {
        this.$refs.cancelModal.show();
      } else {
        this.formYamlOption = neu;
      }
    },

    formYamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        // Return to form, reset everything back to starting point
        this.valuesYaml = this.previousYamlValues;

        this.showValuesComponent = true;
        this.showQuestions = true;

        this.showDiff = false;
        break;
      case VALUES_STATE.YAML:
        // Show the YAML preview
        if (old === VALUES_STATE.FORM) {
          this.valuesYaml = jsyaml.dump(this.chartValues || {});
          this.previousYamlValues = this.valuesYaml;
        }

        this.showValuesComponent = false;
        this.showQuestions = false;

        this.showDiff = false;
        break;
      case VALUES_STATE.DIFF:
        // Show the YAML diff
        if (old === VALUES_STATE.FORM) {
          this.valuesYaml = jsyaml.dump(this.chartValues || {});
          this.previousYamlValues = this.valuesYaml;
        }

        this.showValuesComponent = false;
        this.showQuestions = false;

        this.updateValue(this.valuesYaml);
        this.showDiff = true;
        break;
      }
    },

    requires() {
      this.updateStepOneReady();
    },

    warnings() {
      this.updateStepOneReady();
    },

  },

  async mounted() {
    await this.loadValuesComponent();

    await this.loadChartSteps();

    window.scrollTop = 0;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
      window.c = this;
    }

    this.preFormYamlOption = this.valuesComponent || this.hasQuestions ? VALUES_STATE.FORM : VALUES_STATE.YAML;
  },

  beforeDestroy() {
    this.shownReadmeWindows.forEach(name => this.$store.dispatch('wm/close', name, { root: true }));
  },

  methods: {
    updateValue(value) {
      if (this.$refs.yaml) {
        this.$refs.yaml.updateValue(value);
      }
    },

    async loadValuesComponent() {
      // TODO: Remove RELEASE_NAME. This is only in until the component annotation is added to the OPA Gatekeeper chart
      const component = this.version?.annotations?.[CATALOG_ANNOTATIONS.COMPONENT] || this.version?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME];

      if ( component ) {
        if ( this.$store.getters['catalog/haveComponent'](component) ) {
          this.valuesComponent = this.$store.getters['catalog/importComponent'](component);
          const loaded = await this.valuesComponent();

          this.showValuesComponent = true;
          this.componentHasTabs = loaded?.default?.hasTabs || false;
        } else {
          this.valuesComponent = null;
          this.componentHasTabs = false;
          this.showValuesComponent = false;
        }
      } else {
        this.valuesComponent = null;
        this.componentHasTabs = false;
        this.showValuesComponent = false;
      }
    },

    async loadChartSteps() {
      const component = this.version?.annotations?.[CATALOG_ANNOTATIONS.COMPONENT] || this.version?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME];

      if ( component ) {
        const steps = await this.$store.getters['catalog/chartSteps'](component);

        this.customSteps = await Promise.all( steps.map(cs => this.loadChartStep(cs)));
      }
    },

    async loadChartStep(customStep) {
      const loaded = await customStep.component();
      const withFallBack = this.$store.getters['i18n/withFallback'];

      return {
        name:        customStep.name,
        label:       withFallBack(loaded?.default?.label, null, customStep.name),
        subtext:     withFallBack(loaded?.default?.subtext, null, ''),
        weight:      loaded?.default?.weight,
        ready:       false,
        hidden:      true,
        loading:    true,
        component: customStep.component,
      };
    },

    selectChart(chart) {
      if ( !chart ) {
        return;
      }

      this.$router.applyQuery({
        [REPO]:      chart.repoName,
        [REPO_TYPE]: chart.repoType,
        [CHART]:     chart.chartName,
        [VERSION]:   chart.versions[0].version
      });
    },

    cancel() {
      if ( this.existing ) {
        this.done();
      } else if (this.$route.query[FROM_TOOLS] === _FLAGGED) {
        this.$router.replace(this.clusterToolsLocation());
      } else if (this.$route.query[FROM_CLUSTER] === _FLAGGED) {
        this.$router.replace(this.clustersLocation());
      } else {
        this.$router.replace(this.chartLocation(false));
      }
    },

    done() {
      if ( this.$route.query[FROM_TOOLS] === _FLAGGED ) {
        this.$router.replace(this.clusterToolsLocation());
      } else if (this.$route.query[FROM_CLUSTER] === _FLAGGED) {
        this.$router.replace(this.clustersLocation());
      } else {
        // If the create app process fails helm validation then we still get here... so until this is fixed new apps will be taken to the
        // generic apps list (existing apps will be taken to their detail page)
        this.$router.replace(this.appLocation());
      }
    },

    async finish(btnCb) {
      try {
        const isUpgrade = !!this.existing;

        this.errors = [];

        await this.applyHooks(BEFORE_SAVE_HOOKS);

        const { errors, input } = this.actionInput(isUpgrade);

        if ( errors?.length ) {
          this.errors = errors;
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
          // The wait times out eventually, move on...
        }

        await this.applyHooks(AFTER_SAVE_HOOKS);

        btnCb(true);
        this.done();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
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
      const isWindows = (cluster.workerOSs || []).includes(WINDOWS);
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

    removeGlobalValuesFrom(values) {
      if ( !values ) {
        return;
      }

      const cluster = this.$store.getters['currentCluster'];
      const defaultRegistry = this.defaultRegistrySetting?.value || '';
      const serverUrl = this.serverUrlSetting?.value || '';
      const isWindows = (cluster.workerOSs || []).includes(WINDOWS);
      const pathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      if ( values.global?.cattle ) {
        deleteIfEqual(values.global.cattle, 'clusterId', cluster?.id);
        deleteIfEqual(values.global.cattle, 'clusterName', cluster?.nameDisplay);
        deleteIfEqual(values.global.cattle, 'systemDefaultRegistry', defaultRegistry);
        deleteIfEqual(values.global.cattle, 'url', serverUrl);
        deleteIfEqual(values.global.cattle, 'rkePathPrefix', pathPrefix);
        deleteIfEqual(values.global.cattle, 'rkeWindowsPathPrefix', windowsPathPrefix);

        if ( isWindows ) {
          deleteIfEqual(values.global.cattle.windows, 'enabled', true);
        }
      }

      if ( values.global?.cattle?.windows && !Object.keys(values.global.cattle.windows).length ) {
        delete values.global.cattle.windows;
      }

      if ( values.global?.cattle && !Object.keys(values.global.cattle).length ) {
        delete values.global.cattle;
      }

      if ( values.global ) {
        deleteIfEqual(values.global, 'systemDefaultRegistry', defaultRegistry);
      }

      if ( !Object.keys(values.global || {}).length ) {
        delete values.global;
      }

      return values;

      function deleteIfEqual(obj, key, val) {
        if ( get(obj, key) === val ) {
          delete obj[key];
        }
      }
    },

    applyYamlToValues() {
      try {
        this.chartValues = jsyaml.load(this.valuesYaml);
      } catch (err) {
        return { errors: exceptionToErrorsArray(err) };
      }

      return { errors: [] };
    },

    actionInput(isUpgrade) {
      const fromChart = this.versionInfo?.values || {};

      const errors = [];

      if ( this.showingYaml ) {
        const { errors: yamlErrors } = this.applyYamlToValues();

        errors.push(...yamlErrors);
      }

      // Only save the values that differ from the chart's standard values.yaml
      const values = diff(fromChart, this.chartValues);

      // Add our special blend of 11 herbs and global values
      this.addGlobalValuesTo(values);

      const form = JSON.parse(JSON.stringify(this.value));
      const migratedAnnotations = this.migratedApp ? { [CATALOG_ANNOTATIONS.MIGRATED]: 'true' } : {};
      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version?.version || this.query.versionName,
        releaseName: form.metadata.name,
        description: this.customCmdOpts.description,
        annotations: {
          ...migratedAnnotations,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.chart.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.chart.repoName
        },
        values,
      };

      if ( isUpgrade ) {
        chart.resetValues = this.cmdOptions.resetValues;
      }

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

      const more = [];

      let auto = (this.version?.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

      for ( const constraint of auto ) {
        const provider = this.$store.getters['catalog/versionSatisfying']({
          constraint,
          repoName:     this.chart.repoName,
          repoType:     this.chart.repoType,
          chartVersion: this.version.version,
        });

        if ( provider ) {
          more.push(provider);
        } else {
          errors.push(`This chart requires ${ constraint } but no matching chart was found`);
        }
      }

      auto = (this.version?.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL_GVK] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

      for ( const gvr of auto ) {
        const provider = this.$store.getters['catalog/versionProviding']({
          gvr,
          repoName: this.chart.repoName,
          repoType: this.chart.repoType
        });

        if ( provider ) {
          more.push(provider);
        } else {
          errors.push(`This chart requires another chart that provides ${ gvr }, but none was was found`);
        }
      }

      // 'more' contains the values for the CRD chart, which needs the same
      // global and cattle values as the chart.
      for ( const dependency of more ) {
        out.charts.unshift({
          chartName:   dependency.name,
          version:     dependency.version,
          releaseName: dependency.annotations[CATALOG_ANNOTATIONS.RELEASE_NAME] || dependency.name,
          projectId:   this.project,
          values:      this.addGlobalValuesTo({ global: values.global }),
          annotations: {
            ...migratedAnnotations,
            [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: dependency.repoType,
            [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: dependency.repoName
          },
        });
      }

      return { errors, input: out };
    },

    tabChanged() {
      window.scrollTop = 0;
    },

    updateStepOneReady() {
      const okRequires = !this.requires.length;
      const okChart = !!this.chart;

      this.steps[0].ready = okRequires && okChart;
    },

    getOptionLabel(opt) {
      return opt?.chartNameDisplay;
    },

    showReadmeWindow() {
      this.$store.dispatch('wm/open', {
        id:        this.readmeWindowName,
        label:     this.readmeWindowName,
        icon:      'file',
        component: 'ChartReadme',
        attrs:     { versionInfo: this.versionInfo }
      }, { root: true });
      this.shownReadmeWindows.push(this.readmeWindowName);
    },

    updateStep(stepName, update) {
      const step = this.steps.find(step => step.name === stepName);

      if (step) {
        for (const prop in update) {
          Vue.set(step, prop, update[prop]);
        }
      }
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="!legacyApp && !mcapp" class="install-steps" :class="{ 'isPlainLayout': isPlainLayout}">
    <TypeDescription resource="chart" />
    <Wizard
      v-if="value"
      :steps="steps"
      :errors="errors"
      :edit-first-step="true"
      :banner-title="stepperName"
      :banner-title-subtext="stepperSubtext"
      :finish-mode="action"
      class="wizard"
      @cancel="cancel"
      @finish="finish"
    >
      <template v-for="customStep of customSteps" v-slot:[customStep.name]>
        <component
          :is="customStep.component"
          :key="customStep.name"
          @update="updateStep(customStep.name, $event)"
          @errors="e=>errors.push(...e)"
        />
      </template>
      <template #bannerTitleImage>
        <div>
          <div class="logo-bg">
            <LazyImage :src="chart ? chart.icon : ''" class="logo" />
          </div>
          <label v-if="windowsIncompatible" class="os-label">
            {{ windowsIncompatible }}
          </label>
        </div>
      </template>
      <template #basics>
        <div class="step__basic">
          <Banner v-if="step1Description" color="info" class="description">
            <span>{{ step1Description }}</span>
            <span v-if="namespaceNewAllowed" class="mt-10">
              {{ t('catalog.install.steps.basics.nsCreationDescription', {}, true) }}
            </span>
          </Banner>
          <div v-if="requires.length || warnings.length" class="mb-15">
            <Banner v-for="msg in requires" :key="msg" color="error">
              <span v-html="msg" />
            </Banner>

            <Banner v-for="msg in warnings" :key="msg" color="warning">
              <span v-html="msg" />
            </Banner>
          </div>
          <div v-if="showSelectVersionOrChart" class="row mb-20">
            <div class="col span-4">
              <!-- We have a chart for the app, let the user select a new version -->
              <LabeledSelect
                v-if="chart"
                :label="t('catalog.install.version')"
                :value="query.versionName"
                :options="filteredVersions"
                :selectable="version => !version.disabled"
                @input="selectVersion"
              />
              <!-- Can't find the chart for the app, let the user try to select one -->
              <LabeledSelect
                v-else
                :label="t('catalog.install.chart')"
                :value="chart"
                :options="charts"
                :selectable="option => !option.disabled"
                :get-option-label="opt => getOptionLabel(opt)"
                option-key="key"
                @input="selectChart($event)"
              >
                <template v-slot:option="opt">
                  <template v-if="opt.kind === 'divider'">
                    <hr />
                  </template>
                  <template v-else-if="opt.kind === 'label'">
                    <b style="position: relative; left: -2.5px;">{{ opt.label }}</b>
                  </template>
                </template>
              </LabeledSelect>
            </div>
          </div>
          <NameNsDescription
            v-if="chart"
            v-model="value"
            :description-hidden="true"
            :mode="mode"
            :name-disabled="nameDisabled"
            :name-required="false"
            :name-ns-hidden="!showNameEditor"
            :force-namespace="forceNamespace"
            :namespace-new-allowed="namespaceNewAllowed"
            :extra-columns="showProject ? ['project'] : []"
            :show-spacer="false"
            :horizontal="false"
            @isNamespaceNew="isNamespaceNew = $event"
          >
            <template v-if="showProject" #project>
              <LabeledSelect
                v-model="project"
                :disabled="!namespaceIsNew"
                :label="t('catalog.install.project')"
                option-key="id"
                :options="projectOpts"
                :tooltip="!namespaceIsNew ? t('catalog.install.namespaceIsInProject', {namespace: value.metadata.namespace}, true) : ''"
                :hover-tooltip="!namespaceIsNew"
                :status="'info'"
              />
            </template>
          </NameNsDescription>
          <div class="step__values__controls--spacer" style="flex:1">
&nbsp;
          </div>
          <Banner v-if="isNamespaceNew" color="info" v-html="t('catalog.install.steps.basics.createNamespace', {namespace: value.metadata.namespace}, true) ">
          </Banner>

          <Checkbox v-model="showCommandStep" class="mb-20" :label="t('catalog.install.steps.helmCli.checkbox', { action, existing: !!existing })" />
        </div>
      </template>
      <template #clusterTplVersion>
        <Banner color="info" class="description">
          {{ t('catalog.install.steps.clusterTplVersion.description') }}
        </Banner>
        <div class="row mb-20">
          <div class="col span-4">
            <LabeledSelect
              v-if="chart"
              :label="t('catalog.install.version')"
              :value="query.versionName"
              :options="filteredVersions"
              :selectable="version => !version.disabled"
              @input="selectVersion"
            />
          </div>
          <div class="step__values__controls--spacer">
&nbsp;
          </div>
          <div class="btn-group">
            <button type="button" class="btn bg-primary btn-sm" :disabled="!hasReadme || showingReadmeWindow" @click="showSlideIn = !showSlideIn">
              {{ t('catalog.install.steps.helmValues.chartInfo.button') }}
            </button>
          </div>
        </div>
      </template>
      <template #helmValues>
        <Banner v-if="step2Description" color="info" class="description">
          {{ step2Description }}
        </Banner>
        <div class="step__values__controls">
          <ButtonGroup
            v-model="preFormYamlOption"
            :options="formYamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :disabled="preFormYamlOption != formYamlOption"
          ></ButtonGroup>
          <div class="step__values__controls--spacer">
&nbsp;
          </div>
          <ButtonGroup
            v-if="showDiff"
            v-model="diffMode"
            :options="yamlDiffModeOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          ></ButtonGroup>
          <div v-if="hasReadme && !showingReadmeWindow" class="btn-group">
            <button type="button" class="btn bg-primary btn-sm" @click="showSlideIn = !showSlideIn">
              {{ t('catalog.install.steps.helmValues.chartInfo.button') }}
            </button>
          </div>
        </div>
        <div class="scroll__container">
          <div class="scroll__content">
            <!-- Values (as Custom Component) -->
            <template v-if="valuesComponent && showValuesComponent">
              <Tabbed
                v-if="componentHasTabs"
                ref="tabs"
                :side-tabs="true"
                :class="{'with-name': showNameEditor}"
                class="step__values__content"
                @changed="tabChanged($event)"
              >
                <component
                  :is="valuesComponent"
                  v-model="chartValues"
                  :mode="mode"
                  :chart="chart"
                  class="step__values__content"
                  :existing="existing"
                  :version="version"
                  :version-info="versionInfo"
                  @warn="e=>errors.push(e)"
                  @register-before-hook="registerBeforeHook"
                  @register-after-hook="registerAfterHook"
                />
              </Tabbed>
              <template v-else>
                <component
                  :is="valuesComponent"
                  v-if="valuesComponent"
                  v-model="chartValues"
                  :mode="mode"
                  :chart="chart"
                  class="step__values__content"
                  :existing="existing"
                  :version="version"
                  :version-info="versionInfo"
                  @warn="e=>errors.push(e)"
                  @register-before-hook="registerBeforeHook"
                  @register-after-hook="registerAfterHook"
                />
              </template>
            </template>
            <!-- Values (as Questions)  -->
            <Tabbed
              v-else-if="hasQuestions && showQuestions"
              ref="tabs"
              :side-tabs="true"
              :class="{'with-name': showNameEditor}"
              class="step__values__content"
              @changed="tabChanged($event)"
            >
              <Questions
                v-model="chartValues"
                :in-store="inStore"
                :mode="mode"
                :source="versionInfo"
                tabbed="multiple"
                :target-namespace="targetNamespace"
              />
            </Tabbed>
            <!-- Values (as YAML) -->
            <template v-else>
              <YamlEditor
                ref="yaml"
                v-model="valuesYaml"
                class="step__values__content"
                :scrolling="true"
                :initial-yaml-values="originalYamlValues"
                :editor-mode="editorMode"
                :hide-preview-buttons="true"
              />
            </template>
          </div>
        </div>

        <!-- Confirm loss of changes on toggle from yaml/preview to form -->
        <ResourceCancelModal ref="cancelModal" :is-cancel-modal="false" :is-form="true" @cancel-cancel="preFormYamlOption=formYamlOption" @confirm-cancel="formYamlOption = preFormYamlOption;"></ResourceCancelModal>
      </template>
      <template #helmCli>
        <Banner v-if="step3Description" color="info" class="description">
          {{ step3Description }}
        </Banner>
        <div><Checkbox v-if="existing" v-model="customCmdOpts.cleanupOnFail" :label="t('catalog.install.helm.cleanupOnFail')" /></div>
        <div><Checkbox v-if="!existing" v-model="customCmdOpts.crds" :label="t('catalog.install.helm.crds')" /></div>
        <div><Checkbox v-model="customCmdOpts.hooks" :label="t('catalog.install.helm.hooks')" /></div>
        <div><Checkbox v-if="existing" v-model="customCmdOpts.force" :label="t('catalog.install.helm.force')" /></div>
        <div><Checkbox v-if="existing" v-model="customCmdOpts.resetValues" :label="t('catalog.install.helm.resetValues')" /></div>
        <div><Checkbox v-if="!existing" v-model="customCmdOpts.openApi" :label="t('catalog.install.helm.openapi')" /></div>
        <div><Checkbox v-model="customCmdOpts.wait" :label="t('catalog.install.helm.wait')" /></div>
        <div style="display: block; max-width: 400px;" class="mt-10">
          <UnitInput
            v-model.number="customCmdOpts.timeout"
            :label="t('catalog.install.helm.timeout.label')"
            :suffix="t('catalog.install.helm.timeout.unit', {value: customCmdOpts.timeout})"
          />
        </div>
        <div style="display: block; max-width: 400px;" class="mt-10">
          <UnitInput
            v-if="existing"
            v-model.number="customCmdOpts.historyMax"
            :label="t('catalog.install.helm.historyMax.label')"
            :suffix="t('catalog.install.helm.historyMax.unit', {value: customCmdOpts.historyMax})"
          />
        </div>
        <div style="display: block; max-width: 400px;" class="mt-10">
          <LabeledInput
            v-model="customCmdOpts.description"
            label-key="catalog.install.helm.description.label"
            placeholder-key="catalog.install.helm.description.placeholder"
            :min-height="30"
          />
        </div>
      </template>
    </Wizard>
    <div class="slideIn" :class="{'hide': false, 'slideIn__show': showSlideIn}">
      <h2 class="slideIn__header">
        {{ t('catalog.install.steps.helmValues.chartInfo.label') }}
        <div class="slideIn__header__buttons">
          <div v-tooltip="t('catalog.install.slideIn.dock')" class="slideIn__header__button" @click="showSlideIn = false; showReadmeWindow()">
            <i class="icon icon-dock" />
          </div>
          <div class="slideIn__header__button" @click="showSlideIn = false">
            <i class="icon icon-close" />
          </div>
        </div>
      </h2>
      <ChartReadme v-if="hasReadme" :version-info="versionInfo" class="chart-content__tabs" />
    </div>
  </div>

  <!-- App is deployed as a Legacy or MultiCluster app, don't let user update from here -->
  <div v-else class="install-steps" :class="{ 'isPlainLayout': isPlainLayout}">
    <div class="outer-container">
      <div class="header mb-20">
        <div class="title">
          <div class="top choice-banner">
            <div class="title">
              <!-- Logo -->
              <slot name="bannerTitleImage">
                <div class="round-image">
                  <LazyImage :src="chart ? chart.icon : ''" class="logo" />
                </div>
              </slot>
              <!-- Title with subtext -->
              <div class="subtitle">
                <h2 v-if="stepperName">
                  {{ stepperName }}
                </h2>
                <span v-if="stepperSubtext" class="subtext">{{ stepperSubtext }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Banner color="warning" class="description">
        <span>
          {{ t('catalog.install.error.legacy.label', { legacyType: mcapp ? legacyDefs.mcm : legacyDefs.legacy }, true) }}
        </span>
        <template v-if="!legacyEnabled">
          <span v-html="t('catalog.install.error.legacy.enableLegacy.prompt', true)" />
          <nuxt-link :to="legacyFeatureRoute">
            {{ t('catalog.install.error.legacy.enableLegacy.goto') }}
          </nuxt-link>
        </template>
        <template v-else>
          <nuxt-link :to="mcapp ? mcmRoute : legacyAppRoute">
            <span v-html="t('catalog.install.error.legacy.navigate', { legacyType: mcapp ? legacyDefs.mcm : legacyDefs.legacy }, true)" />
          </nuxt-link>
        </template>
      </Banner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $title-height: 50px;
  $padding: 5px;
  $slideout-width: 35%;

  .install-steps {
    padding-top: 0;

    position: relative;
    overflow: hidden;

    &.isPlainLayout {
      padding: 20px;
    }

    .description {
      display: flex;
      flex-direction: column;
      margin-top: 0;
    }
  }

  .wizard {
    .logo-bg {
      margin-right: 10px;
      height: $title-height;
      width: $title-height;
      background-color: white;
      border: $padding solid white;
      border-radius: calc( 3 * var(--border-radius));
      position: relative;
    }

    .logo {
      max-height: $title-height - 2 * $padding;
      max-width: $title-height - 2 * $padding;
      position: absolute;
      width: auto;
      height: auto;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      margin: auto;
    }
  }

  .step {
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

  .slideIn {
    $slideout-width: 35%;

    border-left: var(--header-border-size) solid var(--header-border);
    position: absolute;
    top: 0;
    right: -$slideout-width;
    height: 100%;
    background-color: var(--topmenu-bg);
    width: $slideout-width;
    z-index: 10;
    display: flex;
    flex-direction: column;

    padding: 10px;

    transition: right .5s ease;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &__buttons {
        display: flex;
      }

      &__button {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        > i {
          font-size: 20px;
          opacity: 0.5;
        }
        &:hover {
          background-color: var(--wm-closer-hover-bg);
        }
      }
    }

    .chart-content__tabs {
      display: flex;
      flex-direction: column;
      flex: 1;

      height: 0;

      padding-bottom: 10px;

      ::v-deep .chart-readmes {
        flex: 1;
        overflow: auto;
      }
    }

    &__show {
      right: 0;
    }

  }

  .scroll {
    &__container {
      $yaml-height: 200px;
      display: flex;
      flex: 1;
      min-height: $yaml-height;
      height: 0;
    }
    &__content {
      display: flex;
      flex: 1;
      overflow: auto;
    }

  }

  ::v-deep .yaml-editor {
    flex: 1
  }

.outer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
}

.header {
  display: flex;
  align-content: space-between;
  align-items: center;

  border-bottom: var(--header-border-size) solid var(--header-border);

  & > .title {
    flex: 1;
    min-height: 75px;
  }

  .choice-banner {

    flex-basis: 40%;
    display: flex;
    align-items: center;

    &.top {

      H2 {
        margin: 0px;
      }

      .title{
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        & > .subtitle {
          margin: 0 20px;
        }
      }

      .subtitle{
        display: flex;
        flex-direction: column;
        & .subtext {
          color: var(--input-label);
        }
      }

    }

    &:not(.top){
      box-shadow: 0px 0px 12px 3px var(--box-bg);
      flex-direction: row;
      align-items: center;
      justify-content: start;
      &:hover{
        outline: var(--outline-width) solid var(--outline);
        cursor: pointer;
      }
    }

    & .round-image {
      min-width: 50px;
      height: 50px;
      margin: 10px 10px 10px 0;
      border-radius: 50%;
      overflow: hidden;
      .logo {
        min-width: 50px;
        height: 50px;
      }
    }
  }
}

.os-label {
  position: absolute;
  background-color: var(--warning-banner-bg);
  color:var(--warning);
  margin-top: 5px;
}

</style>
