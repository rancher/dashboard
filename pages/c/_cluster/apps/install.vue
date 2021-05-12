<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { mapPref, DIFF } from '@/store/prefs';

import Banner from '@/components/Banner';
import ButtonGroup from '@/components/ButtonGroup';
import ChartReadme from '@/components/ChartReadme';
import Checkbox from '@/components/form/Checkbox';
import LabeledSelect from '@/components/form/LabeledSelect';
import LazyImage from '@/components/LazyImage';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import ResourceCancelModal from '@/components/ResourceCancelModal';
import Questions from '@/components/Questions';
import Tabbed from '@/components/Tabbed';
import UnitInput from '@/components/form/UnitInput';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import Wizard from '@/components/Wizard';

import { CATALOG, MANAGEMENT } from '@/config/types';
import {
  CHART, FROM_TOOLS, NAMESPACE, REPO, REPO_TYPE, VERSION, _FLAGGED
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, DESCRIPTION as DESCRIPTION_ANNOTATION, PROJECT } from '@/config/labels-annotations';
import { exceptionToErrorsArray } from '@/utils/error';
import { clone, diff, get, set } from '@/utils/object';
import { findBy, insertAt } from '@/utils/array';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@/mixins/child-hook';
import ChartMixin from '@/pages/c/_cluster/apps/chart_mixin';
import isEqual from 'lodash/isEqual';

export default {
  name: 'Install',

  components: {
    Banner,
    ButtonGroup,
    ChartReadme,
    Checkbox,
    LabeledSelect,
    LazyImage,
    Loading,
    NameNsDescription,
    ResourceCancelModal,
    Questions,
    Tabbed,
    UnitInput,
    YamlEditor,
    Wizard
  },

  mixins: [
    ChildHook,
    ChartMixin
  ],

  async fetch() {
    await this.baseFetch();

    this.errors = [];

    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    });

    this.serverUrlSetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'server-url'
    });

    this.value = await this.$store.dispatch('cluster/create', {
      type:     'chartInstallAction',
      metadata: {
        namespace: this.existing ? this.existing.spec.namespace : this.query.appNamespace,
        name:      this.existing ? this.existing.spec.name : this.query.appName,
      }
    });

    if ( this.existing ) {
      this.forceNamespace = this.existing.metadata.namespace;
      this.nameDisabled = true;
    } else {
      if ( this.chart?.targetNamespace ) {
        this.forceNamespace = this.chart.targetNamespace;
      } else if ( this.query.appNamespace ) {
        this.forceNamespace = this.query.appNamespace;
      } else {
        this.forceNamespace = null;
      }

      if ( this.chart?.targetName ) {
        this.value.metadata.name = this.chart.targetName;
        this.nameDisabled = true;
      } else if ( this.query.appName ) {
        this.value.metadata.name = this.query.appName;
      } else {
        this.nameDisabled = false;
      }

      if ( this.query.description ) {
        this.value.setAnnotation(DESCRIPTION_ANNOTATION, this.query.description);
      }
    }

    if (this.forceNamespace && !this.existing) {
      let ns;

      try {
        ns = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: this.forceNamespace });
        const project = ns.metadata.annotations[PROJECT];

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
      this.valuesYaml = jsyaml.safeDump(this.chartValues || {});

      if ( this.valuesYaml === '{}\n' ) {
        this.valuesYaml = '';
      }

      // For YAML diff
      if ( !this.loadedVersion ) {
        this.originalYamlValues = this.valuesYaml;
      }

      this.loadedVersionValues = this.versionInfo?.values || {};
      this.loadedVersion = this.version?.key;
    }

    this.updateStepOneReady();
  },

  data() {
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
      mode:                   null,
      value:                  null,
      valuesComponent:        null,
      valuesYaml:             '',
      project:                null,

      crds:                true,
      cleanupOnFail:       false,
      force:               false,
      hooks:               true,
      nameDisabled:        false,
      openApi:             true,
      resetValues:         false,
      showPreview:         false,
      preShowPreview:      false,
      showDiff:            false,
      showValuesComponent: true,
      showQuestions:       true,
      showSlideIn:         false,
      componentHasTabs:    false,
      wait:                true,

      historyMax: 5,
      timeout:    600,

      steps: [{
        name:        'basics',
        label:       this.t('catalog.install.steps.basics.label'),
        subtext:     this.t('catalog.install.steps.basics.subtext'),
        ready:       true,
      }, {
        name:        'helmValues',
        label:       this.t('catalog.install.steps.helmValues.label'),
        subtext:     this.t('catalog.install.steps.helmValues.subtext'),
        ready:       true,
      }, {
        name:        'helmCli',
        label:       this.t('catalog.install.steps.helmCli.label'),
        subtext:     this.t('catalog.install.steps.helmCli.subtext'),
        ready:       true,
      }],

    };
  },

  computed: {
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
        label: '(None)',
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

    hasQuestions() {
      return this.versionInfo && !!this.versionInfo.questions;
    },

    showingYaml() {
      return this.showPreview || ( !this.valuesComponent && !this.hasQuestions );
    },

    formYamlOptions() {
      return [{
        labelKey: 'catalog.install.section.chartOptions',
        value:    false,
      }, {
        labelKey: 'catalog.install.section.valuesYaml',
        value:    true,
      }];
    },

    editYamlOptions() {
      return [{
        labelKey: 'resourceYaml.buttons.edit',
        value:    false,
      }, {
        labelKey: 'resourceYaml.buttons.diff',
        value:    true,
      }];
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
      return this.existing?.nameDisplay || this.chart.chartDisplayName;
    },

    stepperSubtext() {
      return this.existing && this.currentVersion !== this.targetVersion ? `${ this.currentVersion } > ${ this.targetVersion }` : this.targetVersion;
    },

    reademeWindowName() {
      return `${ this.stepperName }-${ this.version.version }`;
    },

    showingReadmeWindow() {
      return !!this.$store.getters['wm/byId'](this.reademeWindowName);
    },

    diffMode: mapPref(DIFF),

    step1Description() {
      return this.$store.getters['i18n/exists']('catalog.install.steps.basics.description') ? this.t('catalog.install.steps.basics.description', { action: this.action }, true) : '';
    },

    step2Description() {
      return this.$store.getters['i18n/exists']('catalog.install.steps.helmValues.description') ? this.t('catalog.install.steps.helmValues.description', { action: this.action }, true) : '';
    },

    step3Description() {
      return this.$store.getters['i18n/exists']('catalog.install.steps.helmCli.description') ? this.t('catalog.install.steps.helmCli.description', { action: this.action }, true) : '';
    },

  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    },

    'value.metadata.namespace'(neu, old) {
      if (neu) {
        const ns = this.$store.getters['cluster/byId'](NAMESPACE, this.value.metadata.namespace);

        const project = ns?.metadata.annotations[PROJECT];

        if (project) {
          this.project = project.replace(':', '/');
        }
      }
    },

    preShowPreview(neu) {
      if (!neu && this.valuesYaml !== this.previousYamlValues) {
        this.$refs.cancelModal.show();
      } else {
        this.showPreview = this.preShowPreview;
      }
    },

    showPreview(neu) {
      if (neu) {
        // Show the YAML preview
        this.valuesYaml = jsyaml.safeDump(this.chartValues || {});
        this.previousYamlValues = this.valuesYaml;

        this.showValuesComponent = false;
        this.showQuestions = false;
      } else {
        // Return to form, reset everything back to starting point
        this.showValuesComponent = true;
        this.showQuestions = true;

        this.showDiff = false;
        this.valuesYaml = this.previousYamlValues;
      }
    },

    requires() {
      this.updateStepOneReady();
    },

    warnings() {
      this.updateStepOneReady();
    },

    ignoreWarning() {
      this.updateStepOneReady();
    },

  },

  mounted() {
    this.loadValuesComponent();

    window.scrollTop = 0;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
      window.c = this;
    }
  },

  beforeDestroy() {
    this.$store.dispatch('wm/close', this.reademeWindowName, { root: true });
  },

  methods: {

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
      } else {
        this.$router.replace(this.chartLocation(false));
      }
    },

    done() {
      if ( this.$route.query[FROM_TOOLS] === _FLAGGED ) {
        this.$router.replace(this.clusterToolsLocation());
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

        this.operation = await this.$store.dispatch('cluster/find', {
          type: CATALOG.OPERATION,
          id:   `${ res.operationNamespace }/${ res.operationName }`
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
      const isWindows = cluster.providerOs === 'windows';
      const pathPrefix = cluster.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      setIfNotSet(cattle, 'clusterId', cluster.id);
      setIfNotSet(cattle, 'clusterName', cluster.nameDisplay);
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
      const isWindows = cluster.providerOs === 'windows';
      const pathPrefix = cluster.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      if ( values.global?.cattle ) {
        deleteIfEqual(values.global.cattle, 'clusterId', cluster.id);
        deleteIfEqual(values.global.cattle, 'clusterName', cluster.nameDisplay);
        deleteIfEqual(values.global.cattle, 'systemDefaultRegistry', defaultRegistry);
        deleteIfEqual(values.global.cattle, 'url', serverUrl);
        deleteIfEqual(values.global.cattle, 'rkePathPrefix', pathPrefix);
        deleteIfEqual(values.global.cattle, 'rkeWindowsPathPrefix', windowsPathPrefix);

        if ( isWindows ) {
          deleteIfEqual(values.global.cattle.windows, 'enabled', true);
        }
      }

      if ( values.global?.cattle.windows && !Object.keys(values.global.cattle.windows).length ) {
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
        this.chartValues = jsyaml.safeLoad(this.valuesYaml);
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

      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version?.version || this.query.versionName,
        releaseName: form.metadata.name,
        description: form.metadata?.annotations?.[DESCRIPTION_ANNOTATION],
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.chart.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.chart.repoName
        },
        values,
      };

      if ( isUpgrade ) {
        chart.resetValues = this.resetValues;
      }

      const out = {
        charts:    [chart],
        noHooks:   this.hooks === false,
        timeout:   this.timeout > 0 ? `${ this.timeout }s` : null,
        wait:      this.wait === true,
        namespace: form.metadata.namespace,
        projectId: this.project,
      };

      if ( isUpgrade ) {
        out.force = this.force === true;
        out.historyMax = this.historyMax;
        out.cleanupOnFail = this.cleanupOnFail;
      } else {
        out.disableOpenAPIValidation = this.openApi === false;
        out.skipCRDs = this.crds === false;
      }

      const more = [];

      let auto = (this.version.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

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

      auto = (this.version.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL_GVK] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

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

      for ( const dependency of more ) {
        out.charts.unshift({
          chartName:   dependency.name,
          version:     dependency.version,
          releaseName: dependency.annotations[CATALOG_ANNOTATIONS.RELEASE_NAME] || dependency.name,
          projectId:   this.project,
          values:      this.addGlobalValuesTo({}),
          annotations: {
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
      const okWarnings = !this.warnings.length || this.ignoreWarning;
      const okChart = !!this.chart;

      this.steps[0].ready = okRequires && okWarnings && okChart;
    },

    getOptionLabel(opt) {
      return opt?.chartDisplayName;
    },

    showReadmeWindow() {
      this.$store.dispatch('wm/open', {
        id:        this.reademeWindowName,
        label:     this.reademeWindowName,
        icon:      'file',
        component: 'ChartReadme',
        attrs:     { versionInfo: this.versionInfo }
      }, { root: true });
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="install-steps">
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
      <template #bannerTitleImage>
        <div class="logo-bg">
          <LazyImage :src="chart ? chart.icon : ''" class="logo" />
        </div>
      </template>
      <template #basics>
        <div class="step__basic">
          <p v-if="step1Description" class="row mb-10">
            {{ step1Description }}
          </p>
          <div v-if="requires.length || warnings.length" class="mb-30">
            <Banner v-for="msg in requires" :key="msg" color="error">
              <span v-html="msg" />
            </Banner>

            <Banner v-for="msg in warnings" :key="msg" color="warning">
              <span v-html="msg" />
            </Banner>

            <Checkbox v-if="warnings.length" v-model="ignoreWarning" :label="t('catalog.install.action.ignoreWarning', { count: warnings.length })" />
          </div>
          <div v-if="existing" class="row mb-10">
            <div class="col span-6">
              <!-- We have a chart, select a new version -->
              <LabeledSelect
                v-if="chart"
                :label="t('catalog.install.version')"
                :value="query.versionName"
                :options="filteredVersions"
                :selectable="version => !version.disabled"
                @input="selectVersion"
              />
              <!-- There is no chart, let the user try to select one -->
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
            :mode="mode"
            :name-disabled="nameDisabled"
            :name-required="false"
            :name-ns-hidden="!showNameEditor"
            :force-namespace="forceNamespace"
            :namespace-new-allowed="!existing && !forceNamespace"
            :extra-columns="showProject ? ['project'] : []"
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
        </div>
      </template>
      <template #helmValues>
        <p v-if="step2Description" class="row mb-10">
          {{ step2Description }}
        </p>
        <div class="step__values__controls">
          <!-- Edit as YAML / Back to Form -->
          <ButtonGroup
            v-if="(valuesComponent || hasQuestions)"
            v-model="preShowPreview"
            :options="formYamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :disabled="preShowPreview != showPreview"
          ></ButtonGroup>
          <!-- Continue Editing / Show Diff -->
          <ButtonGroup
            v-if="showingYaml"
            v-model="showDiff"
            :options="editYamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          ></ButtonGroup>
          <div class="step__values__controls--spacer">
&nbsp;
          </div>
          <ButtonGroup
            v-if="showingYaml && showDiff"
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
                :mode="mode"
                :chart="chart"
                :version="version"
                :version-info="versionInfo"
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
        <ResourceCancelModal ref="cancelModal" :is-cancel-modal="false" :is-form="true" @cancel-cancel="preShowPreview=true" @confirm-cancel="showPreview = false;"></ResourceCancelModal>
      </template>
      <template #helmCli>
        <p v-if="step3Description" class="row mb-10">
          {{ step3Description }}
        </p>
        <div><Checkbox v-if="existing" v-model="cleanupOnFail" :label="t('catalog.install.helm.cleanupOnFail')" /></div>
        <div><Checkbox v-if="!existing" v-model="crds" :label="t('catalog.install.helm.crds')" /></div>
        <div><Checkbox v-model="hooks" :label="t('catalog.install.helm.hooks')" /></div>
        <div><Checkbox v-if="existing" v-model="force" :label="t('catalog.install.helm.force')" /></div>
        <div><Checkbox v-if="existing" v-model="resetValues" :label="t('catalog.install.helm.resetValues')" /></div>
        <div><Checkbox v-if="!existing" v-model="openApi" :label="t('catalog.install.helm.openapi')" /></div>
        <div><Checkbox v-model="wait" :label="t('catalog.install.helm.wait')" /></div>
        <div style="display: block; max-width: 400px;" class="mt-10">
          <UnitInput
            v-model.number="timeout"
            :label="t('catalog.install.helm.timeout.label')"
            :suffix="t('catalog.install.helm.timeout.unit', {value: timeout})"
          />
        </div>
        <div style="display: block; max-width: 400px;" class="mt-10">
          <UnitInput
            v-if="existing"
            v-model.number="historyMax"
            :label="t('catalog.install.helm.historyMax.label')"
            :suffix="t('catalog.install.helm.historyMax.unit', {value: historyMax})"
          />
        </div>
      </template>
    </Wizard>
    <div class="slideIn" :class="{'hide': false, 'slideIn__show': showSlideIn}">
      <h2 class="slideIn__header">
        {{ t('catalog.install.steps.helmValues.chartInfo.label') }}
        <div class="slideIn__header__buttons">
          <div v-tooltip="'Dock in window'" class="slideIn__header__button" @click="showSlideIn = false; showReadmeWindow()">
            <i class="icon icon-terminal" />
          </div>
          <div class="slideIn__header__button" @click="showSlideIn = false">
            <i class="icon icon-close" />
          </div>
        </div>
      </h2>
      <ChartReadme v-if="hasReadme" :version-info="versionInfo" class="chart-content__tabs" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $title-height: 50px;
  $padding: 5px;

  .install-steps {
    position: relative; overflow: hidden;
  }

  .wizard {
    .logo-bg {
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
    border-left: var(--header-border-size) solid var(--header-border);
    position: absolute;
    top: 0;
    right: -700px;
    height: 100%;
    background-color: var(--topmenu-bg);
    max-width: 35%;
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

</style>
