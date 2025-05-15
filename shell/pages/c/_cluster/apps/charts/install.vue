<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEqual from 'lodash/isEqual';
import { mapPref, DIFF } from '@shell/store/prefs';
import { mapFeature, MULTI_CLUSTER, LEGACY } from '@shell/store/features';
import { mapGetters } from 'vuex';
import { markRaw } from 'vue';
import { Banner } from '@components/Banner';
import ButtonGroup from '@shell/components/ButtonGroup';
import ChartReadme from '@shell/components/ChartReadme';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { LabeledTooltip } from '@components/LabeledTooltip';
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
import { CATALOG, MANAGEMENT, DEFAULT_WORKSPACE, CAPI } from '@shell/config/types';
import {
  CHART, FROM_CLUSTER, FROM_TOOLS, HIDE_SIDE_NAV, NAMESPACE, REPO, REPO_TYPE, VERSION, _FLAGGED
} from '@shell/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, PROJECT } from '@shell/config/labels-annotations';

import { exceptionToErrorsArray } from '@shell/utils/error';
import {
  clone, diff, get, mergeWithReplace, set
} from '@shell/utils/object';
import { ignoreVariables } from './install.helpers';
import { findBy, insertAt } from '@shell/utils/array';
import { saferDump } from '@shell/utils/create-yaml';
import { LINUX, WINDOWS } from '@shell/store/catalog';
import { SETTING } from '@shell/config/settings';

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
    LabeledTooltip,
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
    this.errors = [];
    // IMPORTANT! Any exception thrown before this.value is set will result in an empty page

    /*
      fetchChart is defined in shell/mixins. It first checks the URL
      query for an app name and namespace. It uses those values to check
      for a catalog app resource. If found, it sets the form to edit
      mode. If not, it sets the form to create mode.

      If the app and app namespace are not provided in the query,
      it checks for target name and namespace values defined in the
      Helm chart itself.
    */
    try {
      await this.fetchChart();
    } catch (e) {
      console.warn('Unable to fetch chart: ', e); // eslint-disable-line no-console
    }

    try {
      await this.fetchAutoInstallInfo();
    } catch (e) {
      console.warn('Unable to determine if other charts require install: ', e); // eslint-disable-line no-console
    }

    // If the chart doesn't contain system `systemDefaultRegistry` properties there's no point applying them
    if (this.showCustomRegistry) {
      // Note: Cluster scoped registry is only supported for node driver clusters
      try {
        this.clusterRegistry = await this.getClusterRegistry();
      } catch (e) {
        console.warn('Unable to get cluster registry: ', e); // eslint-disable-line no-console
      }

      try {
        this.globalRegistry = await this.getGlobalRegistry();
      } catch (e) {
        console.warn('Unable to get global registry: ', e); // eslint-disable-line no-console
      }
      this.defaultRegistrySetting = this.clusterRegistry || this.globalRegistry;
    }

    try {
      this.serverUrlSetting = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SERVER_URL,
      });
    } catch (e) {
      console.error('Unable to fetch `server-url` setting: ', e); // eslint-disable-line no-console
    }

    /*
      Figure out the namespace where the chart is
      being installed or upgraded.
    */
    if ( this.existing ) {
      /*
      If the Helm chart is already installed,
      use the existing namespace by default.
    */

      this.forceNamespace = this.existing.metadata.namespace;
      this.nameDisabled = true;
    } else if (this.$route.query[FROM_CLUSTER] === _FLAGGED) {
      /* For Fleet, use the fleet-default namespace. */
      this.forceNamespace = DEFAULT_WORKSPACE;
    } else if ( this.chart?.targetNamespace ) {
      /* If a target namespace is defined in the chart,
      set the target namespace as default. */
      this.forceNamespace = this.chart.targetNamespace;
    } else if ( this.query.appNamespace ) {
      /* If a namespace is defined in the URL query,
       use that namespace as default. */
      this.forceNamespace = this.query.appNamespace;
    } else {
      this.forceNamespace = null;
    }

    /* Check if the app is deprecated. */
    try {
      this.legacyApp = this.existing ? await this.existing.deployedAsLegacy() : false;
    } catch (e) {
      this.legacyApp = false;
      console.warn('Unable to determine if existing install is a legacy app: ', e); // eslint-disable-line no-console
    }

    /* Check if the app is a multicluster deprecated app.
    (Multicluster apps were replaced by Fleet.) */

    try {
      this.mcapp = this.existing ? await this.existing.deployedAsMultiCluster() : false;
    } catch (e) {
      this.mcapp = false;
      console.warn('Unable to determine if existing install is a mc app: ', e); // eslint-disable-line no-console
    }

    /* The form state is intialized as a chartInstallAction resource. */
    try {
      this.value = await this.$store.dispatch('cluster/create', {
        type:     'chartInstallAction',
        metadata: {
          namespace: this.forceNamespace || this.$store.getters['defaultNamespace'],
          name:      this.existing?.spec?.name || this.query.appName || '',
        }
      });
    } catch (e) {
      console.error('Unable to create object of type `chartInstallAction`: ', e); // eslint-disable-line no-console

      // Nothing's going to work without a `value`. See https://github.com/rancher/dashboard/issues/9452 to handle this and other catches.
      return;
    }

    /* Logic for when the Helm chart is not already installed */
    if ( !this.existing) {
      /*
        The target name is used for Git repos for Fleet.
        The target name indicates the name of the cluster
        group that the chart is meant to be installed in.
      */
      if ( this.chart?.targetName ) {
        /*
          Set the name of the chartInstallAction
          to the name of the cluster group
          where the chart should be installed.
        */
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
    } /* End of logic for when chart is already installed */

    /*
      Logic for what to do if the user is installing
      the Helm chart for the first time and a default
      namespace has been set.
    */
    if (this.forceNamespace && !this.existing) {
      let ns;

      /*
        Before moving forward, check to make sure the
        default namespace exists and the logged-in user
        has permission to see it.
      */
      try {
        ns = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: this.forceNamespace });
        const project = ns.metadata.annotations?.[PROJECT];

        if (project) {
          this.project = project.replace(':', '/');
        }
      } catch {}
    }

    /* If no chart by the given app name and namespace
     can be found, or if no version is found, do nothing. */
    if ( !this.chart || !this.query.versionName) {
      return;
    }

    if ( this.version ) {
      /*
        Check if the Helm chart has provided the name
        of a Vue component to use for configuring
        chart values. If so, load that component.

        This will set this.valuesComponent,
        this.showValuesComponent.
      */
      await this.loadValuesComponent();
    }

    /*
      this.loadedVersion will only be true if you select a non-defalut
      option from the "Version" dropdown menu in Apps & Marketplace
      when updating a previously installed app.
    */
    if ( !this.loadedVersion || this.loadedVersion !== this.version.key ) {
      let userValues;

      /*
        When you select a version, a new chart is loaded. Then
        Rancher anticipates that you probably want to port all of your
        previously customized, non-default values from the old chart
        version to the new chart version, so it applies the previous
        chart's customization to the new chart values before
        you see the values form on the next page in the workflow.
      */
      if ( this.loadedVersion ) {
        if ( this.showingYaml ) {
          this.applyYamlToValues();
        }
        /*
          this.loadedVersionValues is taken from versionInfo,
          which contains everything there is to know about a specific
          version of a Helm chart, including all chart values,
          chart metadata, a short app README and a more
          version-specific README called the chart README.

          Here we assume that any difference between the values in
          two different Helm chart versions is a "user value," or
          a user-selected customization.
        */
        userValues = diff(this.loadedVersionValues, this.chartValues);
      } else if ( this.existing ) {
        await this.existing.fetchValues(); // In theory this has already been called, but do again to be safe
        /* For an already installed app, use the values from the previous install. */
        userValues = clone(this.existing.values || {});
      } else {
        /* For an new app, start empty. */
        userValues = {};
      }

      /*
        Remove global values if they are identical to
        the currently available information about the cluster
        and Rancher settings.

        Immediately before the Helm chart is installed or
        upgraded, the global values are re-added.
      */
      this.removeGlobalValuesFrom(userValues);

      this.chartValues = mergeWithReplace(
        merge({}, this.versionInfo?.values || {}),
        userValues,
      );

      if (this.showCustomRegistry) {
        /**
         * The input to configure the registry should never be
         * shown for third-party charts, which don't have Rancher
         * global values.
         */
        const existingRegistry = this.chartValues?.global?.systemDefaultRegistry || this.chartValues?.global?.cattle?.systemDefaultRegistry;

        delete this.chartValues?.global?.systemDefaultRegistry;
        delete this.chartValues?.global?.cattle?.systemDefaultRegistry;

        this.customRegistrySetting = existingRegistry || this.defaultRegistrySetting;
        this.showCustomRegistryInput = !!this.customRegistrySetting;
      }

      /* Serializes an object as a YAML document */
      this.valuesYaml = saferDump(this.chartValues);

      /* For YAML diff */
      if ( !this.loadedVersion ) {
        this.originalYamlValues = this.valuesYaml;
      }

      this.loadedVersionValues = this.versionInfo?.values || {};
      this.loadedVersion = this.version?.key;
    }

    /* Check if chart exists and if required values exist */
    this.updateStepOneReady();

    this.preFormYamlOption = this.valuesComponent || this.hasQuestions ? VALUES_STATE.FORM : VALUES_STATE.YAML;

    /* Look for annotation to say this app is a legacy migrated app (we look in either place for now) */
    this.migratedApp = (this.existing?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MIGRATED] === 'true');
  },

  data() {
    /* Helm CLI options that are not persisted on the back end,
    but are used for the final install/upgrade operation. */
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
      defaultRegistrySetting: '',
      customRegistrySetting:  '',
      serverUrlSetting:       null,
      chartValues:            null,
      clusterRegistry:        '',
      originalYamlValues:     null,
      previousYamlValues:     null,
      errors:                 null,
      existing:               null,
      globalRegistry:         '',
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
      customCmdOpts:          { ...defaultCmdOpts },
      autoInstallInfo:        [],

      nameDisabled: false,

      preFormYamlOption:       VALUES_STATE.YAML,
      formYamlOption:          VALUES_STATE.YAML,
      showDiff:                false,
      showValuesComponent:     true,
      showQuestions:           true,
      showSlideIn:             false,
      shownReadmeWindows:      [],
      showCommandStep:         false,
      showCustomRegistryInput: false,
      isNamespaceNew:          false,

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

    /**
     * Return list of variables to filter chart questions
     */
    ignoreVariables() {
      return ignoreVariables(this.versionInfo);
    },

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

      const out = projects.filter((x) => x.spec.clusterName === cluster?.id).map((project) => {
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
      const current = this.existing?.matchingCharts(true)[0];

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

    showingYamlDiff() {
      return this.formYamlOption === VALUES_STATE.DIFF;
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
      const descriptionKey = this.steps.find((s) => s.name === 'basics').descriptionKey;

      return this.$store.getters['i18n/withFallback'](descriptionKey, { action: this.action, existing: !!this.existing }, '');
    },

    step2Description() {
      const descriptionKey = this.steps.find((s) => s.name === 'helmValues').descriptionKey;

      return this.$store.getters['i18n/withFallback'](descriptionKey, { action: this.action, existing: !!this.existing }, '');
    },

    step3Description() {
      const descriptionKey = this.steps.find((s) => s.name === 'helmCli').descriptionKey;

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
      // Check for the legacy feature flag in the settings
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
    },

    /**
     * Check if the chart contains `systemDefaultRegistry` properties.
     * If not we shouldn't apply the setting, because if the option
     * is exposed for third-party Helm charts, it confuses users because
     * it shows a private registry setting that is never used
     * by the chart they are installing. If not hidden, the setting
     * does nothing, and if the user changes it, it will look like
     * there is a bug in the UI when it doesn't work, because UI is
     * exposing a feature that the chart does not have.
     */
    showCustomRegistry() {
      const global = this.versionInfo?.values?.global || {};

      return global.systemDefaultRegistry !== undefined || global.cattle?.systemDefaultRegistry !== undefined;
    },

  },

  watch: {
    '$route.query'(neu, old) {
      // If the query changes, refetch the chart
      // When going back to app list, the query is empty and we don't want to refetch
      if ( !isEqual(neu, old) && Object.keys(neu).length > 0 ) {
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
    // Load a Vue component named in the Helm chart
    // for editing values
    await this.loadValuesComponent();

    window.scrollTop = 0;

    this.preFormYamlOption = this.valuesComponent || this.hasQuestions ? VALUES_STATE.FORM : VALUES_STATE.YAML;
  },

  beforeUnmount() {
    this.shownReadmeWindows.forEach((name) => this.$store.dispatch('wm/close', name, { root: true }));
  },

  methods: {
    async getClusterRegistry() {
      const hasPermissionToSeeProvCluster = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);

      if (hasPermissionToSeeProvCluster) {
        const mgmCluster = this.$store.getters['currentCluster'];
        const provClusterId = mgmCluster?.provClusterId;
        let provCluster;

        try {
          provCluster = provClusterId ? await this.$store.dispatch('management/find', {
            type: CAPI.RANCHER_CLUSTER,
            id:   provClusterId
          }) : {};
        } catch (e) {
          console.error(`Unable to fetch prov cluster '${ provClusterId }': `, e); // eslint-disable-line no-console
        }

        if (provCluster?.isRke2) { // isRke2 returns true for both RKE2 and K3s clusters.
          // If a cluster scoped registry exists,
          // it should be used by default.
          const clusterRegistry = provCluster.agentConfig?.['system-default-registry'] || '';

          if (clusterRegistry) {
            return clusterRegistry;
          }
        }

        if (provCluster?.isRke1) {
          // For RKE1 clusters, the cluster scoped private registry is on the management
          // cluster, not the provisioning cluster.
          const rke1Registries = mgmCluster?.spec?.rancherKubernetesEngineConfig?.privateRegistries;

          if (rke1Registries?.length > 0) {
            const defaultRegistry = rke1Registries.find((registry) => {
              return registry.isDefault;
            });

            return defaultRegistry.url;
          }
        }
      }
    },

    async getGlobalRegistry() {
      // Use the global registry as a fallback.
      // If it is an empty string, the container
      // runtime will pull images from docker.io.
      const globalRegistry = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SYSTEM_DEFAULT_REGISTRY,
      });

      return globalRegistry.value;
    },

    updateValue(value) {
      if (this.$refs.yaml) {
        this.$refs.yaml.updateValue(value);
      }
    },

    async loadValuesComponent() {
      // The const component is a string, for example, 'monitoring'.
      const component = this.version?.annotations?.[CATALOG_ANNOTATIONS.COMPONENT];

      // Load a values component for the UI if it is named in the Helm chart.
      if ( component ) {
        const hasChartComponent = this.$store.getters['type-map/hasCustomChart'](component);

        if ( hasChartComponent ) {
          this.valuesComponent = markRaw(this.$store.getters['type-map/importChart'](component));
          this.showValuesComponent = true;
        } else {
          this.valuesComponent = null;
          this.showValuesComponent = false;
        }
      } else {
        this.valuesComponent = null;
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
      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);
      const systemProjectId = projects.find((p) => p.spec?.displayName === 'System')?.id?.split('/')?.[1] || '';

      const serverUrl = this.serverUrlSetting?.value || '';
      const isWindows = (cluster?.workerOSs || []).includes(WINDOWS);
      const pathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      setIfNotSet(cattle, 'clusterId', cluster?.id);
      setIfNotSet(cattle, 'clusterName', cluster?.nameDisplay);

      if (this.showCustomRegistry) {
        set(cattle, 'systemDefaultRegistry', this.customRegistrySetting);
        set(global, 'systemDefaultRegistry', this.customRegistrySetting);
      }

      setIfNotSet(global, 'cattle.systemProjectId', systemProjectId);
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
      const serverUrl = this.serverUrlSetting?.value || '';
      const isWindows = (cluster?.workerOSs || []).includes(WINDOWS);
      const pathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const windowsPathPrefix = cluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';

      if ( values.global?.cattle ) {
        deleteIfEqual(values.global.cattle, 'clusterId', cluster?.id);
        deleteIfEqual(values.global.cattle, 'clusterName', cluster?.nameDisplay);
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

    /*
      actionInput determines what values Rancher finally sends
      to the backend when installing or upgrading the app. It
      injects Rancher-specific values into the chart values.
    */
    actionInput(isUpgrade) {
      /* Default values defined in the Helm chart itself */
      const fromChart = this.versionInfo?.values || {};

      const errors = [];

      if ( this.showingYaml || this.showingYamlDiff ) {
        const { errors: yamlErrors } = this.applyYamlToValues();

        errors.push(...yamlErrors);
      }

      /*
        Only save the values that differ from the chart's standard values.yaml.
        chartValues is created by applying the user's customized onto
        the default chart values.
      */
      const values = diff(fromChart, this.chartValues);

      /*
        Refer to the developer docs at docs/developer/helm-chart-apps.md
        for details on what values are injected and where they come from.
      */

      this.addGlobalValuesTo(values);

      const form = JSON.parse(JSON.stringify(this.value));

      /*
        Migrated annotations are required to allow a deprecated legacy app to be
        upgraded.
      */
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

      /*
        Configure Helm CLI options for doing the install or
        upgrade operation.
      */
      const out = {
        charts:    [chart],
        noHooks:   this.cmdOptions.hooks === false,
        timeout:   this.cmdOptions.timeout > 0 ? `${ this.cmdOptions.timeout }s` : null,
        wait:      this.cmdOptions.wait === true,
        namespace: form.metadata.namespace,
        projectId: this.project,
      };

      /*
        Configure Helm CLI options that are specific to
        installs or specific to upgrades.
      */
      if ( isUpgrade ) {
        out.force = this.cmdOptions.force === true;
        out.historyMax = this.cmdOptions.historyMax;
        out.cleanupOnFail = this.cmdOptions.cleanupOnFail;
      } else {
        out.disableOpenAPIValidation = this.cmdOptions.openApi === false;
        out.skipCRDs = this.cmdOptions.crds === false;
      }

      const more = [];

      const auto = (this.version?.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL_GVK] || '').split(/\s*,\s*/).filter((x) => !!x).reverse();

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

      /* Chart custom UI components have the ability to edit CRD chart values eg gatekeeper-crd has values.enableRuntimeDefaultSeccompProfile
        like the main chart, only CRD values that differ from defaults should be sent on install/upgrade
        CRDs should be installed with the same global values as the main chart
      */
      for (const versionInfo of this.autoInstallInfo) {
        // allValues are the values potentially changed in the installation ui: any previously customized values + defaults
        // values are default values from the chart
        const { allValues, values: crdValues } = versionInfo;

        // only save crd values that differ from the defaults defined in chart values.yaml
        const customizedCrdValues = diff(crdValues, allValues);

        // CRD globals should be overwritten by main chart globals
        // we want to avoid including globals present on crd values and not main chart values
        // that covers the scenario where a global value was customized on a previous install (and so is present in crd global vals) and the user has reverted it to default on this update (no longer present in main chart global vals)
        const crdValuesToInstall = { ...customizedCrdValues, global: values.global };

        out.charts.unshift({
          chartName:   versionInfo.chart.name,
          version:     versionInfo.chart.version,
          releaseName: versionInfo.chart.annotations[CATALOG_ANNOTATIONS.RELEASE_NAME] || chart.name,
          projectId:   this.project,
          values:      crdValuesToInstall
        });
      }
      /*
        'more' contains additional
        charts that may not be CRD charts but are also meant to be installed at
        the same time.
      */
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

    updateStepTwoReady(update) {
      this.updateStep('helmValues', { ready: update });
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
      const step = this.steps.find((step) => step.name === stepName);

      if (step) {
        for (const prop in update) {
          step[prop] = update[prop];
        }
      }
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else-if="!legacyApp && !mcapp"
    class="install-steps pt-20"
    :class="{ 'isPlainLayout': isPlainLayout}"
  >
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
      :class="{'windowsIncompatible': windowsIncompatible}"
      @cancel="cancel"
      @finish="finish"
    >
      <template #bannerTitleImage>
        <div>
          <div class="logo-bg">
            <LazyImage
              :src="chart ? chart.icon : ''"
              class="logo"
            />
          </div>
          <label
            v-if="windowsIncompatible"
            class="os-label"
          >
            {{ windowsIncompatible }}
          </label>
        </div>
      </template>
      <template #basics>
        <div class="step__basic">
          <Banner
            v-if="step1Description"
            color="info"
            class="description"
          >
            <div>
              <span>{{ step1Description }}</span>
              <span
                v-if="namespaceNewAllowed"
                class="mt-10"
              >
                {{ t('catalog.install.steps.basics.nsCreationDescription', {}, true) }}
              </span>
            </div>
          </Banner>
          <div
            v-if="requires.length || warnings.length"
            class="mb-15"
          >
            <Banner
              v-for="(msg, i) in requires"
              :key="i"
              color="error"
            >
              <span v-clean-html="msg" />
            </Banner>

            <Banner
              v-for="(msg, i) in warnings"
              :key="i"
              color="warning"
            >
              <span v-clean-html="msg" />
            </Banner>
          </div>
          <div
            v-if="showSelectVersionOrChart"
            class="row mb-20"
          >
            <div class="col span-4">
              <!-- We have a chart for the app, let the user select a new version -->
              <LabeledSelect
                v-if="chart"
                :label="t('catalog.install.version')"
                :value="query.versionName"
                :options="filteredVersions"
                :selectable="version => !version.disabled"
                @update:value="selectVersion"
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
                @update:value="selectChart($event)"
              >
                <template v-slot:option="opt">
                  <template v-if="opt.kind === 'divider'">
                    <hr>
                  </template>
                  <template v-else-if="opt.kind === 'label'">
                    <b style="position: relative; left: -2.5px;">{{ opt.label }}</b>
                  </template>
                </template>
              </LabeledSelect>
            </div>
          </div>
          <NameNsDescription
            v-model:value="value"
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
            <template
              v-if="showProject"
              #project
            >
              <LabeledSelect
                v-model:value="project"
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
          <Checkbox
            v-model:value="showCommandStep"
            class="mb-20"
            :label="t('catalog.install.steps.helmCli.checkbox', { action, existing: !!existing })"
          />

          <Checkbox
            v-if="showCustomRegistry"
            v-model:value="showCustomRegistryInput"
            class="mb-20"
            :label="t('catalog.chart.registry.custom.checkBoxLabel')"
            :tooltip="t('catalog.chart.registry.tooltip')"
          />
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-if="showCustomRegistryInput"
                v-model:value="customRegistrySetting"
                label-key="catalog.chart.registry.custom.inputLabel"
                placeholder-key="catalog.chart.registry.custom.placeholder"
                :min-height="30"
              />
            </div>
          </div>
          <div
            class="step__values__controls--spacer"
            style="flex:1"
          >
&nbsp;
          </div>
          <Banner
            v-if="isNamespaceNew && value.metadata.namespace.length"
            color="info"
            class="namespace-create-banner"
          >
            <div v-clean-html="t('catalog.install.steps.basics.createNamespace', {namespace: value.metadata.namespace}, true) " />
          </Banner>
        </div>
      </template>
      <template #clusterTplVersion>
        <Banner
          color="info"
          class="description"
        >
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
              @update:value="selectVersion"
            />
          </div>
          <div class="step__values__controls--spacer">
&nbsp;
          </div>
          <div class="btn-group">
            <button
              type="button"
              class="btn bg-primary btn-sm"
              :disabled="!hasReadme || showingReadmeWindow"
              @click="showSlideIn = !showSlideIn"
            >
              {{ t('catalog.install.steps.helmValues.chartInfo.button') }}
            </button>
          </div>
        </div>
      </template>
      <template #helmValues>
        <Banner
          v-if="step2Description"
          color="info"
          class="description"
        >
          {{ step2Description }}
        </Banner>
        <div class="step__values__controls">
          <ButtonGroup
            v-model:value="preFormYamlOption"
            data-testid="btn-group-options-view"
            :options="formYamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :disabled="preFormYamlOption != formYamlOption"
          />
          <div class="step__values__controls--spacer">
&nbsp;
          </div>
          <ButtonGroup
            v-if="showDiff"
            v-model:value="diffMode"
            :options="yamlDiffModeOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          />
          <div
            v-if="hasReadme && !showingReadmeWindow"
            class="btn-group"
          >
            <button
              type="button"
              class="btn bg-primary btn-sm"
              @click="showSlideIn = !showSlideIn"
            >
              {{ t('catalog.install.steps.helmValues.chartInfo.button') }}
            </button>
          </div>
        </div>

        <div class="scroll__container">
          <div class="scroll__content">
            <!-- Values (as Custom Component in ./shell/charts/) -->
            <template v-if="valuesComponent && showValuesComponent">
              <component
                :is="valuesComponent"
                v-if="valuesComponent"
                v-model:value="chartValues"
                :mode="mode"
                :chart="chart"
                class="step__values__content"
                :existing="existing"
                :version="version"
                :version-info="versionInfo"
                :auto-install-info="autoInstallInfo"
                @warn="e=>errors.push(e)"
                @register-before-hook="registerBeforeHook"
                @register-after-hook="registerAfterHook"
              />
            </template>

            <!-- Values (as Questions, abstracted component based on question.yaml configuration from repositories)  -->
            <Tabbed
              v-else-if="hasQuestions && showQuestions"
              ref="tabs"
              :side-tabs="true"
              :hide-single-tab="true"
              :class="{'with-name': showNameEditor}"
              class="step__values__content"
              @changed="tabChanged($event)"
            >
              <Questions
                v-model:value="chartValues"
                :in-store="inStore"
                :mode="mode"
                :source="versionInfo"
                :ignore-variables="ignoreVariables"
                tabbed="multiple"
                :target-namespace="targetNamespace"
              />
            </Tabbed>
            <!-- Values (as YAML) -->
            <template v-else>
              <YamlEditor
                ref="yaml"
                v-model:value="valuesYaml"
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
        <ResourceCancelModal
          ref="cancelModal"
          :is-cancel-modal="false"
          :is-form="true"
          @cancel-cancel="preFormYamlOption=formYamlOption"
          @confirm-cancel="formYamlOption = preFormYamlOption;"
        />
      </template>
      <template #helmCli>
        <Banner
          v-if="step3Description"
          color="info"
          class="description"
        >
          {{ step3Description }}
        </Banner>
        <div>
          <Checkbox
            v-if="existing"
            v-model:value="customCmdOpts.cleanupOnFail"
            :label="t('catalog.install.helm.cleanupOnFail')"
          />
        </div>
        <div>
          <Checkbox
            v-if="!existing"
            v-model:value="customCmdOpts.crds"
            :label="t('catalog.install.helm.crds')"
          />
        </div>
        <div>
          <Checkbox
            v-model:value="customCmdOpts.hooks"
            :label="t('catalog.install.helm.hooks')"
          />
        </div>
        <div>
          <Checkbox
            v-if="existing"
            v-model:value="customCmdOpts.force"
            :label="t('catalog.install.helm.force')"
          />
        </div>
        <div>
          <Checkbox
            v-if="existing"
            v-model:value="customCmdOpts.resetValues"
            :label="t('catalog.install.helm.resetValues')"
          />
        </div>
        <div>
          <Checkbox
            v-if="!existing"
            v-model:value="customCmdOpts.openApi"
            :label="t('catalog.install.helm.openapi')"
          />
        </div>
        <div>
          <Checkbox
            v-model:value="customCmdOpts.wait"
            :label="t('catalog.install.helm.wait')"
          />
        </div>
        <div
          style="display: block; max-width: 400px;"
          class="mt-10"
        >
          <UnitInput
            v-model:value="customCmdOpts.timeout"
            :label="t('catalog.install.helm.timeout.label')"
            :suffix="t('catalog.install.helm.timeout.unit', {value: customCmdOpts.timeout})"
            type="number"
          />
        </div>
        <div
          style="display: block; max-width: 400px;"
          class="mt-10"
        >
          <UnitInput
            v-if="existing"
            v-model:value="customCmdOpts.historyMax"
            :label="t('catalog.install.helm.historyMax.label')"
            :suffix="t('catalog.install.helm.historyMax.unit', {value: customCmdOpts.historyMax})"
            type="number"
          />
        </div>
        <div
          style="display: block; max-width: 400px;"
          class="mt-10"
        >
          <LabeledInput
            v-model:value="customCmdOpts.description"
            label-key="catalog.install.helm.description.label"
            placeholder-key="catalog.install.helm.description.placeholder"
            :min-height="30"
          />
        </div>
      </template>
    </Wizard>
    <div
      class="slideIn"
      :class="{'hide': false, 'slideIn__show': showSlideIn}"
    >
      <h2 class="slideIn__header">
        {{ t('catalog.install.steps.helmValues.chartInfo.label') }}
        <div class="slideIn__header__buttons">
          <div
            v-clean-tooltip="t('catalog.install.slideIn.dock')"
            class="slideIn__header__button"
            @click="showSlideIn = false; showReadmeWindow()"
          >
            <i class="icon icon-dock" />
          </div>
          <div
            class="slideIn__header__button"
            @click="showSlideIn = false"
          >
            <i class="icon icon-close" />
          </div>
        </div>
      </h2>
      <ChartReadme
        v-if="hasReadme"
        :version-info="versionInfo"
        class="chart-content__tabs"
      />
    </div>
  </div>

  <!-- App is deployed as a Legacy or MultiCluster app, don't let user update from here -->
  <div
    v-else
    class="install-steps"
    :class="{ 'isPlainLayout': isPlainLayout}"
  >
    <div class="outer-container">
      <div class="header mb-20">
        <div class="title">
          <div class="top choice-banner">
            <div class="title">
              <!-- Logo -->
              <slot name="bannerTitleImage">
                <div class="round-image">
                  <LazyImage
                    :src="chart ? chart.icon : ''"
                    class="logo"
                  />
                </div>
              </slot>
              <!-- Title with subtext -->
              <div class="subtitle">
                <h2 v-if="stepperName">
                  {{ stepperName }}
                </h2>
                <span
                  v-if="stepperSubtext"
                  class="subtext"
                >{{ stepperSubtext }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Banner
        color="warning"
        class="description"
      >
        <span v-if="!mcapp">
          {{ t('catalog.install.error.legacy.label', { legacyType: mcapp ? legacyDefs.mcm : legacyDefs.legacy }, true) }}
        </span>
        <template v-if="!legacyEnabled">
          <span v-clean-html="t('catalog.install.error.legacy.enableLegacy.prompt', true)" />
          <router-link :to="legacyFeatureRoute">
            {{ t('catalog.install.error.legacy.enableLegacy.goto') }}
          </router-link>
        </template>
        <template v-else-if="mcapp">
          <span v-clean-html="t('catalog.install.error.legacy.mcmNotSupported')" />
        </template>
        <template v-else>
          <router-link :to="legacyAppRoute">
            <span v-clean-html="t('catalog.install.error.legacy.navigate')" />
          </router-link>
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
    height: 0;
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

    // Hack - We're adding an absolute tag under the logo that we want to consume space without breaking vertical alignment of row.
    // W  ith the slots available this isn't possible without adding tag specific styles to the root wizard classes
    &.windowsIncompatible {
      :deep() .header {
        padding-bottom: 15px;
      }
    }

    .os-label {
      position: absolute;
      background-color: var(--warning-banner-bg);
      color:var(--warning);
      margin-top: 5px;
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

      .namespace-create-banner {
        margin-bottom: 70px;
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

        :deep() .tab-container {
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

      :deep() .chart-readmes {
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
      min-height: $yaml-height;
      margin-bottom: 60px;
      overflow: auto;
      display: flex;
      flex: 1;
    }
    &__content {
      display: flex;
      flex: 1;
      overflow: auto;
    }
  }

  :deep() .yaml-editor {
    flex: 1
  }

.outer-container {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: auto;
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

</style>
