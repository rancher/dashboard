<script>
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';

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
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, _CREATE, _EDIT, PREVIEW, _UNFLAG, _FLAGGED
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, DESCRIPTION as DESCRIPTION_ANNOTATION } from '@/config/labels-annotations';
import { exceptionToErrorsArray, stringify } from '@/utils/error';
import { diff } from '@/utils/object';
import { findBy } from '@/utils/array';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@/mixins/child-hook';

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

    await this.$store.dispatch('catalog/load');
    this.defaultRegistrySetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'system-default-registry'
    });

    const repoType = query[REPO_TYPE];
    const repoName = query[REPO];
    const chartName = query[CHART];
    let versionName = query[VERSION];
    const releaseNamespace = query[NAMESPACE] || '';
    const releaseName = query[NAME] || '';

    if ( releaseNamespace && releaseName ) {
      this.mode = _EDIT;
      this.existing = await this.$store.dispatch('cluster/find', {
        type: CATALOG.RELEASE,
        id:   `${ releaseNamespace }/${ releaseName }`
      });
    } else {
      this.mode = _CREATE;
    }

    this.value = await this.$store.dispatch('cluster/create', {
      type:     'chartInstallAction',
      metadata: {
        namespace: releaseNamespace,
        name:      releaseName
      }
    });

    if ( this.repo && chartName ) {
      this.chart = this.$store.getters['catalog/chart']({
        repoType, repoName, chartName
      });
    }

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

    if ( !versionName && this.chart?.versions?.length ) {
      versionName = this.chart.versions[0].version;
    }

    if ( versionName ) {
      this.version = this.$store.getters['catalog/version']({
        repoType, repoName, chartName, versionName
      });

      try {
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType, repoName, chartName, versionName
        });
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
        throw e;
      }

      if ( this.version && process.client ) {
        await this.loadValuesComponent();
      }

      const required = (this.version.annotations?.[CATALOG_ANNOTATIONS.REQUIRES_GVK] || '').split(/\s*,\s*/).filter(x => !!x).reverse();

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

      const updateValues = (this.existing && !this.chartValues) ||
        (!this.existing && (!this.loadedVersion || this.loadedVersion !== this.version.key) );

      if ( updateValues ) {
        if ( this.existing ) {
          // For an existing app, use the previous values
          this.chartValues = merge(merge({}, this.versionInfo.values), this.existing.spec?.values || {});
        } else {
          // If the chart/version changes, replace their values with the new one
          this.chartValues = merge({}, this.versionInfo.values);
        }

        this.removeGlobalValuesFrom(this.chartValues);

        this.loadedVersion = this.version.key;
        this.valuesYaml = jsyaml.safeDump(this.chartValues);

        if ( this.valuesYaml === '{}\n' ) {
          this.valuesYaml = '';
        }

        this.originalYamlValues = this.valuesYaml;
      }
    }
  },

  data() {
    return {
      defaultRegistrySetting: null,
      chart:                  null,
      chartValues:            null,
      originalYamlValues:     null,
      errors:                 null,
      existing:               null,
      forceNamespace:         null,
      loadedVersion:          null,
      mode:                   null,
      value:                  null,
      valuesComponent:        null,
      valuesYaml:             null,
      version:                null,
      versionInfo:            null,
      requires:               [],
      warnings:               [],

      crds:                true,
      cleanupOnFail:       false,
      force:               false,
      hooks:               true,
      nameDisabled:        false,
      openApi:             true,
      resetValues:         false,
      selectedTabName:     'readme',
      showPreview:         false,
      showValuesComponent: false,
      valuesTabs:          false,
      wait:                true,

      historyMax: 5,
      timeout:    600,
    };
  },

  computed: {
    isEntryTab() {
      const { tabName } = this;

      if (tabName === 'values-form' || tabName === 'values-yaml') {
        return true;
      }

      return false;
    },

    tabName() {
      return this.selectedTabName;
    },

    charts() {
      return this.$store.getters['catalog/charts'].filter(x => !x.deprecated);
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

    showBackButton() {
      const { selectedTabName, showValuesComponent, valuesComponent } = this;

      if (isEmpty(valuesComponent)) {
        return false;
      } else if (selectedTabName === 'values-yaml' && !showValuesComponent) {
        return true;
      }

      return false;
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
      if ( this.showPreview ) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) && !has(neu, 'preview') ) {
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
      const component = this.version?.annotations?.[CATALOG_ANNOTATIONS.COMPONENT];

      if ( component ) {
        if ( this.$store.getters['catalog/haveComponent'](component) ) {
          this.valuesComponent = this.$store.getters['catalog/importComponent'](component);

          const loaded = await this.valuesComponent();

          this.showValuesComponent = true;
          this.valuesTabs = loaded?.default?.hasTabs || false;
        } else {
          this.valuesComponent = null;
          this.valuesTabs = false;
          this.showValuesComponent = false;
        }
      } else {
        this.valuesComponent = null;
        this.valuesTabs = false;
        this.showValuesComponent = false;
      }
    },

    selectChart(key, version) {
      const chart = findBy(this.charts, 'key', key);

      this.$router.applyQuery({
        [REPO]:      chart.repoName,
        [REPO_TYPE]: chart.repoType,
        [CHART]:     chart.chartName,
        [VERSION]:   version || chart.versions[0].version
      });
    },

    selectVersion(version) {
      this.$router.applyQuery({ [VERSION]: version });
    },

    showPreviewYaml() {
      const {
        chartValues,
        originalYamlValues,
        showValuesComponent,
        valuesYaml,
        valuesComponent,
      } = this;

      if (!!valuesComponent) {
        if (!originalYamlValues) {
          this.originalYamlValues = valuesYaml;
        }

        // seed the yaml with any entered info
        this.valuesYaml = jsyaml.safeDump(chartValues);

        if (showValuesComponent) {
          this.tabChanged({ tab: { name: 'values-yaml' } });
          this.showValuesComponent = false;
        } else {
          this.tabChanged({ tab: { name: 'values-form' } });
          this.showValuesComponent = true;
        }
      }
    },

    preview() {
      this.showPreview = true;

      return this.$router.applyQuery({ [PREVIEW]: _FLAGGED });
    },

    unpreview() {
      this.showPreview = false;

      return this.$router.applyQuery({ [PREVIEW]: _UNFLAG });
    },

    cancel(reallyCancel) {
      if (!reallyCancel && !this.showValuesComponent) {
        return this.resetFromBack();
      }

      if ( this.existing ) {
        this.done();
      } else {
        this.$router.replace({ name: 'c-cluster-apps' });
      }
    },

    async resetFromBack() {
      this.showValuesComponent = true;

      if (has(this.$route.query, PREVIEW)) {
        await this.unpreview();
      }

      this.valuesYaml = this.originalYamlValues;
    },

    done() {
      this.$router.replace({
        name:   `c-cluster-product-resource`,
        params: {
          product:   this.$store.getters['productId'],
          cluster:   this.$store.getters['clusterId'],
          resource:  CATALOG.RELEASE,
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
      if ( !values.global ) {
        values.global = {};
      }

      if ( !values.global.cattle ) {
        values.global.cattle = {};
      }

      const cluster = this.$store.getters['currentCluster'];

      values.global.cattle.clusterId = cluster.id;
      values.global.cattle.clusterName = cluster.nameDisplay;
      values.global.cattle.systemDefaultRegistry = this.defaultRegistrySetting?.value || '';
      values.systemDefaultRegistry = this.defaultRegistrySetting?.value || '';

      return values;
    },

    removeGlobalValuesFrom(values) {
      if ( !values ) {
        return;
      }

      delete values.global?.cattle?.clusterId;
      delete values.global?.cattle?.clusterName;
      delete values.global?.cattle?.systemDefaultRegistry;
      delete values.systemDefaultRegistry;

      if ( !Object.keys(values.global?.cattle || {}).length ) {
        delete values.global?.cattle;
      }

      if ( !Object.keys(values.global || {}).length ) {
        delete values.global;
      }

      return values;
    },

    actionInput(isUpgrade) {
      const fromChart = this.versionInfo.values || {};

      if ( !this.valuesComponent ) {
        try {
          this.chartValues = jsyaml.safeLoad(this.valuesYaml);
        } catch (err) {
          return { errors: exceptionToErrorsArray(err) };
        }
      }

      // Only save the values that differ from the chart's standard values.yaml
      const values = diff(fromChart, this.chartValues);

      // Add our special global values
      this.addGlobalValuesTo(values);

      const form = JSON.parse(JSON.stringify(this.value));

      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version.version,
        releaseName: form.metadata.name,
        namespace:   form.metadata.namespace,
        description: form.metadata?.annotations?.[DESCRIPTION_ANNOTATION],
        values,
      };

      if ( isUpgrade ) {
        chart.resetValues = this.resetValues;
      }

      const errors = [];
      const out = {
        charts:  [chart],
        noHooks: this.hooks === false,
        timeout: this.timeout > 0 ? `${ this.timeout }s` : null,
        wait:    this.wait === true,
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
          chartVersion: this.version.version
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
          namespace:   dependency.annotations[CATALOG_ANNOTATIONS.NAMESPACE] || chart.namespace,
          values:      this.addGlobalValuesTo({}),
        });
      }

      return { errors, input: out };
    },

    tabChanged({ tab }) {
      window.scrollTop = 0;

      this.selectedTabName = tab.name;

      if ( tab.name === 'values-yaml' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else-if="!chart">
    Chart Not Found
  </div>

  <div v-else>
    <h1 v-if="existing">
      <t k="catalog.install.header.upgrade" :name="existing.nameDisplay" />
    </h1>
    <h1 v-else>
      <t k="catalog.install.header.install" :name="chart.chartName" />
    </h1>

    <div class="chart-info mb-20">
      <div class="logo-container">
        <div class="logo-bg">
          <LazyImage :src="chart.icon" class="logo" />
        </div>
      </div>
      <div class="description">
        <Markdown v-if="versionInfo && versionInfo.appReadme" v-model="versionInfo.appReadme" class="md md-desc" />
        <p v-else-if="chart.description">
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
      <div v-if="existing" class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            label="Chart"
            :value="$route.query.chart"
            option-label="chartName"
            option-key="key"
            :reduce="opt=>opt.key"
            :options="charts"
            @input="selectChart($event)"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            label="Version"
            :value="$route.query.version"
            option-label="version"
            option-key="version"
            :reduce="opt=>opt.version"
            :options="chart.versions"
            @input="selectVersion($event)"
          />
        </div>
      </div>
      <NameNsDescription
        v-else
        v-model="value"
        :mode="mode"
        :name-disabled="nameDisabled"
        :name-ns-hidden="!showNameEditor"
        :force-namespace="forceNamespace"
        :extra-columns="showVersions ? ['versions'] : []"
      >
        <template v-if="showVersions" #versions>
          <LabeledSelect
            label="Chart Version"
            :value="$route.query.version"
            option-label="version"
            option-key="version"
            :reduce="opt=>opt.version"
            :options="chart.versions"
            @input="selectVersion($event)"
          />
        </template>
      </NameNsDescription>

      <Tabbed
        :side-tabs="true"
        :class="{'with-name': showNameEditor}"
        @changed="tabChanged($event)"
      >
        <Tab v-if="showReadme" name="readme" :label="t('catalog.install.section.readme')" :weight="-1">
          <!-- Negative weight makes it go before any valuesComponent tabs with no weight set -->
          <Markdown v-if="showReadme" ref="readme" v-model="versionInfo.readme" class="md readme" />
        </Tab>

        <template v-if="valuesComponent && showValuesComponent">
          <component
            :is="valuesComponent"
            v-if="valuesTabs"
            v-model="chartValues"
            :chart="chart"
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
              :chart="chart"
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
                :chart="chart"
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
          v-else-if="versionInfo && versionInfo.questions"
          v-model="chartValues"
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

        <Tab name="helm" :label="t('catalog.install.section.helm')" :weight="100">
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
        :is-form="!!showValuesComponent"
        @cancel-confirmed="cancel"
      >
        <template #default="{checkCancel}">
          <template v-if="!showValuesComponent">
            <button
              v-if="showPreview && isEntryTab"
              type="button"
              class="btn role-secondary"
              @click="unpreview"
            >
              <t k="resourceYaml.buttons.continue" />
            </button>

            <button
              v-if="isEntryTab && !showPreview"
              :disabled="valuesYaml === originalYamlValues"
              type="button"
              class="btn role-secondary"
              @click="preview"
            >
              <t k="resourceYaml.buttons.diff" />
            </button>
          </template>

          <button
            v-if="isEntryTab && showValuesComponent"
            type="button"
            class="btn role-secondary"
            @click="showPreviewYaml"
          >
            {{ t("cruResource.previewYaml") }}
          </button>

          <div>
            <button
              v-if="showBackButton"
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
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $desc-height: 150px;
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
        margin-top: 20px;
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

    .logo-container {
      height: $desc-height;
      width: $sideways-tabs-width;
      text-align: center;
    }

    .logo-bg {
      height: $desc-height;
      width: $desc-height;
      background-color: white;
      border: $padding solid white;
      border-radius: calc( 3 * var(--border-radius));
      margin: 0 auto;
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
      width: calc(100% - #{$sideways-tabs-width});
      height: $desc-height;
      overflow: auto;

      .name {
        margin: #{-1 * $padding} 0 0 0;
      }
    }
  }
</style>
