<script>
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { mapState, mapGetters } from 'vuex';

import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import CruResourceFooter from '@/components/CruResourceFooter';
import LabeledSelect from '@/components/form/LabeledSelect';
import LazyImage from '@/components/LazyImage';
import Loading from '@/components/Loading';
import Markdown from '@/components/Markdown';
import NameNsDescription from '@/components/form/NameNsDescription';
import Questions from '@/components/Questions';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import UnitInput from '@/components/form/UnitInput';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';

import { CATALOG, MANAGEMENT } from '@/config/types';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, _CREATE, _EDIT, _FLAGGED,
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, DESCRIPTION as DESCRIPTION_ANNOTATION } from '@/config/labels-annotations';
import { exceptionToErrorsArray, stringify } from '@/utils/error';
import { clone, diff, get, set } from '@/utils/object';
import { findBy, insertAt } from '@/utils/array';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@/mixins/child-hook';
import sortBy from 'lodash/sortBy';

export default {
  name: 'Install',

  components: {
    AsyncButton,
    Banner,
    Checkbox,
    CruResourceFooter,
    LabeledSelect,
    LazyImage,
    Loading,
    Markdown,
    NameNsDescription,
    Questions,
    Tab,
    Tabbed,
    UnitInput,
    YamlEditor,
  },

  mixins: [ChildHook],

  async fetch() {
    this.warnings = [];
    this.requires = [];
    this.errors = [];

    const query = this.$route.query;

    this.showDeprecated = query['deprecated'] === _FLAGGED;
    this.showHidden = query['hidden'] === _FLAGGED;

    await this.$store.dispatch('catalog/load');

    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    });

    const repoType = query[REPO_TYPE];
    const repoName = query[REPO];
    const chartName = query[CHART];
    let versionName = query[VERSION];
    const appNamespace = query[NAMESPACE] || '';
    const appName = query[NAME] || '';

    if ( this.repo && chartName ) {
      this.chart = this.$store.getters['catalog/chart']({
        repoType,
        repoName,
        chartName,
        includeHidden: true,
      });
    }

    if ( appNamespace && appName ) {
      // Explicitly asking for edit

      try {
        this.existing = await this.$store.dispatch('cluster/find', {
          type: CATALOG.APP,
          id:   `${ appNamespace }/${ appName }`,
        });

        this.mode = _EDIT;
      } catch (e) {
        this.mode = _CREATE;
        this.existing = null;
      }
    } else if ( this.chart?.targetNamespace && this.chart?.targetName ) {
      // Asking to install a special chart with fixed namespace/name
      // so edit it if there's an existing install

      try {
        this.existing = await this.$store.dispatch('cluster/find', {
          type: CATALOG.APP,
          id:   `${ this.chart.targetNamespace }/${ this.chart.targetName }`,
        });
        this.mode = _EDIT;
      } catch (e) {
        this.mode = _CREATE;
        this.existing = null;
      }
    } else {
      // Regular create

      this.mode = _CREATE;
    }
    this.value = await this.$store.dispatch('cluster/create', {
      type:     'chartInstallAction',
      metadata: {
        namespace: this.existing ? this.existing.spec.namespace : appNamespace,
        name:      this.existing ? this.existing.spec.name : appName,
      }
    });

    if ( this.existing ) {
      this.forceNamespace = this.existing.metadata.namespace;
      this.nameDisabled = true;
    } else {
      if ( this.chart?.targetNamespace ) {
        this.forceNamespace = this.chart.targetNamespace;
      } else if ( query[NAMESPACE] ) {
        this.forceNamespace = query[NAMESPACE];
      } else {
        this.forceNamespace = null;
      }

      if ( this.chart?.targetName ) {
        this.value.metadata.name = this.chart.targetName;
        this.nameDisabled = true;
      } else if ( query[NAME] ) {
        this.value.metadata.name = query[name];
      } else {
        this.nameDisabled = false;
      }

      if ( query[DESCRIPTION_QUERY] ) {
        this.value.setAnnotation(DESCRIPTION_ANNOTATION, query[DESCRIPTION_QUERY]);
      }
    }

    if ( !this.chart ) {
      return;
    }

    if ( !versionName && this.chart.versions?.length ) {
      versionName = this.chart.versions[0].version;
    }

    if ( !versionName ) {
      return;
    }

    this.version = this.$store.getters['catalog/version']({
      repoType, repoName, chartName, versionName
    });

    try {
      this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
        repoType, repoName, chartName, versionName
      });
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      this.versionInfo = null;
    }

    if ( this.version && process.client ) {
      await this.loadValuesComponent();
    }

    const required = (this.version?.annotations?.[CATALOG_ANNOTATIONS.REQUIRES_GVK] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

    if ( required.length ) {
      for ( const gvr of required ) {
        if ( this.$store.getters['catalog/isInstalled']({ gvr }) ) {
          continue;
        }

        const provider = this.$store.getters['catalog/versionProviding']({
          gvr,
          repoName: this.chart.repoName,
          repoType: this.chart.repoType
        });

        const url = this.$router.resolve({
          name:   'c-cluster-apps-install',
          params: {
            cluster:  this.$route.params.cluster,
            product:  this.$store.getters['productId'],
          },
          query: {
            [REPO_TYPE]: provider.repoType,
            [REPO]:      provider.repoName,
            [CHART]:     provider.name,
            [VERSION]:   provider.version,
          }
        }).href;

        if ( provider ) {
          this.requires.push(`<a href="${ url }">${ provider.name }</a> must be installed before you can install this chart.`);
        } else {
          this.warnings.push(`This chart requires another chart that provides ${ gvr }, but none was was found`);
        }
      }
    }

    // const updateValues = (this.existing && !this.chartValues) ||
    // (!this.existing && (!this.loadedVersion || this.loadedVersion !== this.version.key) );

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
  },

  data() {
    return {
      showHidden:             false,
      showDeprecated:         false,
      defaultRegistrySetting: null,
      chart:                  null,
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
      version:                null,
      versionInfo:            null,
      project:                null,
      requires:               [],
      warnings:               [],

      crds:                true,
      cleanupOnFail:       false,
      force:               false,
      hooks:               true,
      nameDisabled:        false,
      openApi:             true,
      resetValues:         false,
      defaultTab:          'appReadme',
      showPreview:         false,
      showDiff:            false,
      showValuesComponent: true,
      showQuestions:       true,
      componentHasTabs:    false,
      wait:                true,

      historyMax: 5,
      timeout:    600,

      catalogOSAnnotation: CATALOG_ANNOTATIONS.SUPPORTED_OS,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapState(['isMultiCluster']),

    namespaceIsNew() {
      const all = this.$store.getters['cluster/all'](NAMESPACE);
      const want = this.value?.metadata?.namespace;

      if ( !want ) {
        return false;
      }

      return !findBy(all, 'id', want);
    },

    showProject() {
      return this.isMultiCluster && !this.existing && this.namespaceIsNew;
    },

    projectOpts() {
      const cluster = this.$store.getters['currentCluster'];
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
        value: null,
      });

      return out;
    },

    isValuesTab() {
      const tabName = this.$refs.tabs?.activeTabName;

      return tabName && !['appReadme', 'helm', 'readme'].includes(tabName);
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

    repo() {
      const query = this.$route.query;
      const repoType = query[REPO_TYPE];
      const repoName = query[REPO];

      return this.$store.getters['catalog/repo']({ repoType, repoName });
    },

    showReadme() {
      return !!this.versionInfo?.readme;
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

    filteredVersions() {
      const {
        currentCluster,
        catalogOSAnnotation,
      } = this;
      const versions = this.chart?.versions || [];
      const selectedVersion = this.version?.version;
      const clusterProvider = currentCluster.status.provider || 'other';
      const out = [];

      versions.forEach((version) => {
        const nue = {
          label:    version.version,
          id:       version.version,
          disabled: false,
        };

        if ( version?.annotations?.[catalogOSAnnotation] === 'windows' ) {
          nue.label = this.t('catalog.install.versions.windows', { ver: version.version });

          if (clusterProvider !== 'rke.windows') {
            nue.disabled = true;
          }
        } else if ( version?.annotations?.[catalogOSAnnotation] === 'linux' ) {
          nue.label = this.t('catalog.install.versions.linux', { ver: version.version });

          if (clusterProvider === 'rke.windows') {
            nue.disabled = true;
          }
        }

        out.push(nue);
      });

      const selectedMatch = out.find(v => v.id === selectedVersion);

      if (!selectedMatch) {
        out.push({ value: selectedVersion, label: this.t('catalog.install.versions.current', { ver: selectedVersion }) });
      }

      return sortBy(out, 'id');
    },
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
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

  methods: {
    stringify,

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

    selectChart(chart, version) {
      if ( !chart ) {
        return;
      }

      this.$router.applyQuery({
        [REPO]:      chart.repoName,
        [REPO_TYPE]: chart.repoType,
        [CHART]:     chart.chartName,
        [VERSION]:   version || chart.versions[0].version
      });
    },

    selectVersion({ id: version }) {
      this.$router.applyQuery({ [VERSION]: version });
    },

    preview() {
      this.valuesYaml = jsyaml.safeDump(this.chartValues || {});
      this.previousYamlValues = this.valuesYaml;

      this.showPreview = true;
      this.showValuesComponent = false;
      this.showQuestions = false;

      this.$nextTick(() => {
        this.$refs.tabs.select('values-yaml');
      });
    },

    unpreview() {
      this.showPreview = false;
      this.showValuesComponent = true;
      this.showQuestions = true;
    },

    diff() {
      this.showDiff = true;
    },

    undiff() {
      this.showDiff = false;
    },

    cancel(reallyCancel) {
      if (!reallyCancel && this.showPreview) {
        return this.resetFromBack();
      }

      if ( this.existing ) {
        this.done();
      } else {
        this.$router.replace({ name: 'c-cluster-apps' });
      }
    },

    async resetFromBack() {
      await this.unpreview();
      await this.undiff();
      this.valuesYaml = this.previousYamlValues;
    },

    done() {
      this.$router.replace({
        name:   `c-cluster-product-resource`,
        params: {
          product:   this.$store.getters['productId'],
          cluster:   this.$store.getters['clusterId'],
          resource:  CATALOG.APP,
        }
      });
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

      const cluster = this.$store.getters['currentCluster'];
      const defaultRegistry = this.defaultRegistrySetting?.value || '';

      setIfNotSet(cattle, 'clusterId', cluster.id);
      setIfNotSet(cattle, 'clusterName', cluster.nameDisplay);
      setIfNotSet(cattle, 'systemDefaultRegistry', defaultRegistry);
      setIfNotSet(global, 'systemDefaultRegistry', defaultRegistry);

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

      deleteIfEqual(values, 'systemDefaultRegistry', defaultRegistry);

      if ( values.global?.cattle ) {
        deleteIfEqual(values.global.cattle, 'clusterId', cluster.id);
        deleteIfEqual(values.global.cattle, 'clusterName', cluster.nameDisplay);
        deleteIfEqual(values.global.cattle, 'systemDefaultRegistry', defaultRegistry);
      }

      if ( values.global?.cattle && !Object.keys(values.global.cattle).length ) {
        delete values.global.cattle;
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
    },

    actionInput(isUpgrade) {
      const fromChart = this.versionInfo?.values || {};

      if ( this.showingYaml ) {
        this.applyYamlToValues();
      }

      // Only save the values that differ from the chart's standard values.yaml
      const values = diff(fromChart, this.chartValues);

      // Add our special blend of 11 herbs and global values
      this.addGlobalValuesTo(values);

      const form = JSON.parse(JSON.stringify(this.value));

      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version.version,
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

      const errors = [];
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

    tabChanged({ tab }) {
      window.scrollTop = 0;

      if ( tab.name === 'values-yaml' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },

    getOptionLabel(opt) {
      return opt?.chartDisplayName;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <form v-else>
    <h1 v-if="existing">
      <t k="catalog.install.header.upgrade" :name="existing.nameDisplay" />
    </h1>
    <h1 v-else-if="chart">
      <t k="catalog.install.header.install" :name="chart.chartDisplayName" />
    </h1>
    <h1 v-else>
      <t k="catalog.install.header.installGeneric" />
    </h1>

    <div v-if="chart" class="chart-info mb-20">
      <div class="logo-container">
        <div class="logo-bg">
          <LazyImage :src="chart.icon" class="logo" />
        </div>
      </div>
      <div class="description">
        <p>
          {{ chart.description }}
        </p>
      </div>
    </div>

    <template v-if="requires.length || warnings.length">
      <Banner v-for="msg in requires" :key="msg" color="warning">
        <span v-html="msg" />
      </Banner>

      <Banner v-for="msg in warnings" :key="msg" color="error">
        <span v-html="msg" />
      </Banner>

      <div class="mt-20 text-center">
        <button type="button" class="btn role-primary" @click="cancel">
          <t k="generic.cancel" />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
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
                <b style="position: relative; left: -10px;">{{ opt.label }}</b>
              </template>
            </template>
          </LabeledSelect>
        </div>
        <div v-if="chart" class="col span-6">
          <LabeledSelect
            :label="t('catalog.install.version')"
            :value="$route.query.version"
            :options="filteredVersions"
            :selectable="version => !version.disabled"
            @input="selectVersion"
          />
        </div>
      </div>
      <div v-if="chart && value">
        <NameNsDescription
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
            <LabeledSelect v-model="project" :label="t('catalog.install.project')" option-key="id" :options="projectOpts" />
          </template>
        </NameNsDescription>

        <Tabbed
          ref="tabs"
          :side-tabs="true"
          :class="{'with-name': showNameEditor}"
          :default-tab="defaultTab"
          @changed="tabChanged($event)"
        >
          <Tab name="appReadme" :label="t('catalog.install.section.appReadme')" :weight="100">
            <Markdown v-if="versionInfo && versionInfo.appReadme" v-model="versionInfo.appReadme" class="md md-desc" />
            <Markdown v-else :value="t('catalog.install.appReadmeGeneric')" class="md md-desc" />
          </Tab>

          <template v-if="valuesComponent && showValuesComponent">
            <component
              :is="valuesComponent"
              v-if="componentHasTabs"
              v-model="chartValues"
              :mode="mode"
              :chart="chart"
              :existing="existing"
              :version="version"
              :version-info="versionInfo"
              @warn="e=>warnings.push(e)"
              @register-before-hook="registerBeforeHook"
              @register-after-hook="registerAfterHook"
            />
            <Tab
              v-else
              name="values-form"
              :label="t('catalog.install.section.chartOptions')"
            >
              <component
                :is="valuesComponent"
                v-if="valuesComponent"
                v-model="chartValues"
                :mode="mode"
                :chart="chart"
                :existing="existing"
                :version="version"
                :version-info="versionInfo"
                @warn="e=>warnings.push(e)"
                @register-before-hook="registerBeforeHook"
                @register-after-hook="registerAfterHook"
              />
              <Tab
                v-else
                name="values-form"
                :label="t('catalog.install.section.chartOptions')"
              >
                <component
                  :is="valuesComponent"
                  v-if="valuesComponent"
                  v-model="chartValues"
                  :mode="mode"
                  :chart="chart"
                  :existing="existing"
                  :version="version"
                  :version-info="versionInfo"
                  @warn="e=>warnings.push(e)"
                  @register-before-hook="registerBeforeHook"
                  @register-after-hook="registerAfterHook"
                />
              </Tab>
            </tab>
          </template>
          <Questions
            v-else-if="hasQuestions && showQuestions"
            v-model="chartValues"
            :mode="mode"
            :chart="chart"
            :version="version"
            :version-info="versionInfo"
            :target-namespace="targetNamespace"
          />
          <Tab v-else name="values-yaml" :label="t('catalog.install.section.valuesYaml')">
            <YamlEditor
              ref="yaml"
              v-model="valuesYaml"
              :scrolling="false"
              :initial-yaml-values="originalYamlValues"
              :editor-mode="editorMode"
            />
          </Tab>

          <Tab v-if="showReadme" name="readme" :label="t('catalog.install.section.readme')" :weight="-1">
            <Markdown v-if="showReadme" ref="readme" v-model="versionInfo.readme" class="md readme" />
          </Tab>

          <Tab name="helm" :label="t('catalog.install.section.helm')" :weight="-2">
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
          </Tab>
        </Tabbed>

        <div v-for="(err, idx) in errors" :key="idx">
          <Banner color="error" :label="stringify(err)" />
        </div>

        <CruResourceFooter
          done-route="c-cluster-apps"
          :mode="mode"
          :finish-button-mode="(existing ? 'upgrade' : 'install')"
          :is-form="true"
          @cancel-confirmed="cancel"
        >
          <template #default="{checkCancel}">
            <template v-if="(!!valuesComponent || hasQuestions) && !showValuesComponent && !showQuestions">
              <button
                v-if="showDiff"
                type="button"
                class="btn role-secondary"
                @click="undiff"
              >
                <t k="resourceYaml.buttons.continue" />
              </button>
              <button
                v-else
                :disabled="valuesYaml === originalYamlValues"
                type="button"
                class="btn role-secondary"
                @click="diff"
              >
                <t k="resourceYaml.buttons.diff" />
              </button>
            </template>

            <button
              v-if="(showValuesComponent || hasQuestions) && isValuesTab && !showPreview"
              type="button"
              class="btn role-secondary"
              @click="preview"
            >
              {{ t("cruResource.previewYaml") }}
            </button>

            <div>
              <button
                v-if="showPreview && !showDiff"
                type="button"
                class="btn role-secondary"
                @click="valuesYaml === originalYamlValues ? resetFromBack() : checkCancel(false)"
              >
                <t k="cruResource.backToForm" />
              </button>

              <AsyncButton
                :mode="(existing ? 'upgrade' : 'install')"
                @click="finish"
              />
            </div>
          </template>
        </CruResourceFooter>
      </div>
    </template>
  </form>
</template>

<style lang="scss" scoped>
  $desc-height: 100px;
  $padding: 5px;

  .md {
    overflow: auto;
    max-width: 100%;

    ::v-deep {
      * + H1,
      * + H2,
      * + H3,
      * + H4,
      * + H5,
      * + H6 {
        margin-top: 40px;
      }
    }
  }

  .md-desc > H1:first-child {
    display: none;
  }

  .chart-info {
    margin-top: 10px;
    display: flex;
    height: $desc-height;
    align-items: center;

    .logo-container {
      height: $desc-height;
      width: $desc-height;
      text-align: center;
    }

    .logo-bg {
      height: $desc-height;
      width: $desc-height;
      background-color: white;
      border: $padding solid white;
      border-radius: calc( 3 * var(--border-radius));
      position: relative;
    }

    .logo {
      max-height: $desc-height - 2 * $padding;
      max-width: $desc-height - 2 * $padding;
      position: absolute;
      width: auto;
      height: auto;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      margin: auto;
    }

    .description {
      flex-grow: 1;
      padding-left: 20px;
      // width: calc(100% - #{$sideways-tabs-width});
      // height: $desc-height;
      overflow: auto;
      color: var(--secondary);

      .name {
        margin: #{-1 * $padding} 0 0 0;
      }
    }
  }
</style>
