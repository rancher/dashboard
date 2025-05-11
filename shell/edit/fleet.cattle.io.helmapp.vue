<script>
import { set } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';
import jsyaml from 'js-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import {
  AUTH_TYPE, CATALOG as REPO_CATALOG, CONFIG_MAP, FLEET, NORMAN, SECRET, VIRTUAL_HARVESTER_PROVIDER
} from '@shell/config/types';
import { CAPI, CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import FormValidation from '@shell/mixins/form-validation';
import Labels from '@shell/components/form/Labels';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Banner from '@components/Banner/Banner.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import ValueFromResource from '@shell/components/form/ValueFromResource';
import { mapPref, DIFF } from '@shell/store/prefs';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { SECRET_TYPES } from '@shell/config/secret';

const APP_CO_REGISTRY = 'oci://dp.apps.rancher.io/charts';

const VALUES_STATE = {
  YAML: 'YAML',
  DIFF: 'DIFF'
};

export default {
  name: 'CruHelmOp',

  inheritAttrs: false,

  emits: ['input'],

  components: {
    Banner,
    ButtonGroup,
    Checkbox,
    CruResource,
    YamlEditor,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    SelectOrCreateAuthSecret,
    ValueFromResource,
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      allClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      },

      allClusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },

      allSecrets: {
        inStoreType: 'management',
        type:        SECRET
      },

      allConfigMaps: {
        inStoreType: 'management',
        type:        CONFIG_MAP
      }
    }, this.$store);

    await this.$store.dispatch('catalog/load', { root: true });

    this.allClusters = hash.allClusters || [];
    this.allClusterGroups = hash.allClusterGroups || [];
    this.allSecrets = hash.allSecrets || [];
    this.allConfigMaps = hash.allConfigMaps || [];

    this.updateTargets();
  },

  data() {
    const valueFromOptions = [
      {
        value: 'configMapKeyRef', label: 'ConfigMap Key', hideVariableName: true
      },
      {
        value: 'secretKeyRef', label: 'Secret key', hideVariableName: true
      },
    ];

    const targetInfo = this.value.targetInfo;
    const targetCluster = targetInfo.cluster;
    const targetClusterGroup = targetInfo.clusterGroup;
    const targetAdvanced = targetInfo.advanced;

    let targetMode = targetInfo.mode;

    if ( this.realMode === _CREATE ) {
      targetMode = 'all';
    } else if ( targetMode === 'cluster' ) {
      targetMode = `cluster://${ targetCluster }`;
    } else if ( targetMode === 'clusterGroup' ) {
      targetMode = `group://${ targetClusterGroup }`;
    }

    const correctDriftEnabled = this.value.spec?.correctDrift?.enabled || false;

    let sourceType = SOURCE_TYPE.REPO;

    if (this.value.spec.helm?.repo) {
      if (this.value.spec.helm.repo.startsWith('oci://')) {
        sourceType = SOURCE_TYPE.OCI;
      }
    } else if (this.value.spec.helm?.chart) {
      if (this.value.spec.helm.chart.startsWith('https://')) {
        sourceType = SOURCE_TYPE.TARBALL;
      }
    }

    const valuesFrom = [];

    (this.value.spec.helm.valuesFrom || []).forEach((elem) => {
      const out = {};

      const cm = elem.configMapKeyRef;

      if (cm) {
        out.valueFrom = {
          configMapKeyRef: {
            key:  cm.key || '',
            name: cm.name || '',
          }
        };
      }

      const sc = elem.secretKeyRef;

      if (sc) {
        out.valueFrom = {
          secretKeyRef: {
            key:  sc.key || '',
            name: sc.name || '',
          }
        };
      }

      valuesFrom.push(out);
    });

    return {
      VALUES_STATE,
      allClusters:          [],
      allClusterGroups:     [],
      allSecrets:           [],
      allConfigMaps:        [],
      allWorkspaces:        [],
      targetMode,
      targetAdvanced,
      targetAdvancedErrors: null,
      sourceType,
      defaultYamlValues:    this.value.spec.helm.values,
      yamlForm:             VALUES_STATE.YAML,
      valuesFrom,
      correctDriftEnabled,
      tempCachedValues:     {},
      valueFromOptions,
      doneRouteList:        'c-cluster-fleet-application',
      chartValues:          {}
    };
  },

  created() {
    this.registerBeforeHook(this.doCreateSecrets, `registerAuthSecrets${ new Date().getTime() }`, 99);
    this.registerBeforeHook(this.updateBeforeSave);
  },

  mounted() {
    this.value.applyDefaults();
  },

  computed: {
    registries() {
      const all = [
        APP_CO_REGISTRY
      ];

      const registries = this.$store.getters['catalog/repos'] || [];

      return all.reduce((acc, id) => {
        const registry = registries.find((repo) => repo.spec?.url === id);

        if (!!registry) {
          return [
            ...acc,
            registry
          ];
        }

        return acc;
      }, []);
    },

    charts() {
      const charts = this.$store.getters['catalog/charts'];

      return this.registries.reduce((acc, registry) => ({
        ...acc,
        [registry._key]: charts.filter((chart) => chart.repoKey === registry._key)
      }), {});
    },

    // chartOptions() {
    //   const all = this.$store.getters['catalog/charts'];

    //   return this.registries.reduce((acc, registry) => {

    //     const charts = all.reduce((acc, chart) => {
    //       if (chart.repoKey === registry._key) {
    //         return [
    //           ...acc,
    //           {
    //             value: chart,
    //             label: chart.chartNameDisplay
    //           }
    //         ];
    //       }

    //       return acc;
    //     }, [])

    //     return {
    //       ...acc,
    //       [registry._key]: charts
    //     };
    //   }, {});
    // },

    sourceTypeOptions() {
      const out = [
        ...Object.values(SOURCE_TYPE).map((value) => ({
          value,
          label: this.t(`fleet.helmOp.source.types.${ value }`)
        })),
        {
          label:    'divider',
          disabled: true,
          kind:     'divider'
        }
      ];

      if (this.registries.length) {
        out.push({
          disabled: true,
          kind:     'title',
          label:    this.t('fleet.helmOp.source.registryOption')
        });
      }

      this.registries.forEach((registry) => {
        out.push({
          value: { key: registry._key, isClusterRegistry: true },
          label: registry.name,
        });
      });

      return out;
    },

    ...mapGetters(['workspace']),

    steps() {
      return [
        {
          name:           'basics',
          title:          this.t('fleet.helmOp.add.steps.metadata.title'),
          label:          this.t('fleet.helmOp.add.steps.metadata.label'),
          subtext:        this.t('fleet.helmOp.add.steps.metadata.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.metadata.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'chart',
          title:          this.t('fleet.helmOp.add.steps.chart.title'),
          label:          this.t('fleet.helmOp.add.steps.chart.label'),
          subtext:        this.t('fleet.helmOp.add.steps.chart.subtext'),
          descriptionKey: 'fleet.helmOp.add.steps.chart.description',
          ready:          true,
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

    isLocal() {
      return this.value.metadata.namespace === 'fleet-local';
    },

    targetOptions() {
      const out = [
        {
          label: 'No Clusters',
          value: 'none'
        },
        {
          label: 'All Clusters in the Workspace',
          value: 'all',
        },
        {
          label: 'Advanced',
          value: 'advanced'
        },
      ];

      const clusters = this.allClusters
        .filter((x) => {
          return x.metadata.namespace === this.value.metadata.namespace;
        })
        .filter((x) => !isHarvesterCluster(x))
        .map((x) => {
          return { label: x.nameDisplay, value: `cluster://${ x.metadata.name }` };
        });

      if ( clusters.length ) {
        out.push({ kind: 'divider', disabled: true });
        out.push({
          kind:     'title',
          label:    'Clusters',
          disabled: true,
        });

        out.push(...clusters);
      }

      const groups = this.allClusterGroups
        .filter((x) => x.metadata.namespace === this.value.metadata.namespace)
        .map((x) => {
          return { label: x.nameDisplay, value: `group://${ x.metadata.name }` };
        });

      if ( groups.length ) {
        out.push({ kind: 'divider', disabled: true });
        out.push({
          kind:     'title',
          label:    'Cluster Groups',
          disabled: true
        });

        out.push(...groups);
      }

      return out;
    },

    yamlFormOptions() {
      return [{
        labelKey: 'fleet.helmOp.values.yaml.options.edit',
        value:    VALUES_STATE.YAML,
      }, {
        labelKey: 'fleet.helmOp.values.yaml.options.diff',
        value:    VALUES_STATE.DIFF,
        disabled: this.defaultYamlValues === this.value.spec.helm.values,
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

    editorMode() {
      if (this.showYamlDiff) {
        return EDITOR_MODES.DIFF_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },

    diffMode: mapPref(DIFF),

    showYamlDiff() {
      return this.yamlForm === VALUES_STATE.DIFF && this.defaultYamlValues !== this.value.spec.helm.values;
    }
  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    workspace(neu) {
      if ( this.isCreate ) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  methods: {
    onSourceTypeSelect(value) {
      if (value.isClusterRegistry) {
        const registry = this.registries.find((registry) => registry._key === value.key);

        this.value.spec.helm.repo = registry.spec.url;
      }
    },

    async onChartSelect(value) {
      if (value) {
        const chart = value.chartName;
        const version = value.versions[0];

        this.value.spec.helm.chart = chart;
        this.value.spec.helm.version = version.version;

        this.getChartValues(version);
      }
    },

    chartOptions(registry) {
      return this.charts[registry].map((chart) => ({
        value: chart,
        label: chart.chartNameDisplay
      }));
    },

    async onVersionSelect(value) {
      if (value) {
        this.value.spec.helm.version = value.version;

        this.getChartValues(value);
      }
    },

    versionOptions(registry) {
      const selectedChart = this.charts[registry].find((chart) => chart.chartName === this.value.spec?.helm?.chart) || {};

      return (selectedChart.versions || []).map((version) => ({
        label: version.version,
        value: version
      }));
    },

    async getChartValues(version) {
      const res = await this.$store.dispatch('management/request', { url: `/v1/${ REPO_CATALOG.CLUSTER_REPO }/${ version.repoName }?link=info&chartName=${ version.name }&version=${ version.version }` });

      this.value.spec.helm.values = saferDump(res?.values || {});
    },

    updateTargets() {
      const spec = this.value.spec;
      const mode = this.targetMode;

      let kind, value;
      const match = mode.match(/([^:]+)(:\/\/(.*))?$/);

      if ( match ) {
        kind = match[1];
        value = match[3];
      }

      if ( kind === 'all' ) {
        spec.targets = [{
          clusterSelector: {
            matchExpressions: [{
              key:      CAPI.PROVIDER,
              operator: 'NotIn',
              values:   [
                VIRTUAL_HARVESTER_PROVIDER
              ],
            }],
          },
        }];
      } else if ( kind === 'none' ) {
        spec.targets = [];
      } else if ( kind === 'cluster' ) {
        spec.targets = [
          { clusterName: value },
        ];
      } else if ( kind === 'group' ) {
        spec.targets = [
          { clusterGroup: value }
        ];
      } else if ( kind === 'advanced' ) {
        try {
          const parsed = jsyaml.load(this.targetAdvanced);

          spec.targets = parsed;
          this.targetAdvancedErrors = null;
        } catch (e) {
          this.targetAdvancedErrors = exceptionToErrorsArray(e);
        }
      } else {
        spec.targets = [];
      }
    },

    updateCachedAuthVal(val, key) {
      this.tempCachedValues[key] = typeof val === 'string' ? { selected: val } : { ...val };

      // if (key === 'helmSecretName') {
      //   this.toggleHelmRepoURLRegex(val && val.selected !== AUTH_TYPE._NONE);
      // }
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

    addValueFrom() {
      this.valuesFrom.push({ valueFrom: {} });
    },

    updateValueFrom(index, value) {
      this.valuesFrom[index] = value;
    },

    removeValueFrom(index) {
      this.valuesFrom.splice(index, 1);
    },

    updateBeforeSave() {
      this.value.spec['correctDrift'] = { enabled: this.correctDriftEnabled };

      this.value.spec.helm.valuesFrom = this.valuesFrom
        .filter((f) => f.valueFrom?.configMapKeyRef || f.valueFrom?.secretKeyRef)
        .map(({ valueFrom }) => {
          const cm = valueFrom.configMapKeyRef;
          const sc = valueFrom.secretKeyRef;

          const out = {};

          if (cm?.name) {
            out.configMapKeyRef = {
              key:       cm.key,
              name:      cm.name,
              namespace: this.workspace
            };
          }

          if (sc?.name) {
            out.secretKeyRef = {
              key:       sc.key,
              name:      sc.name,
              namespace: this.workspace
            };
          }

          return out;
        });
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
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :namespaced="false"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />
      <Labels
        :value="value"
        :mode="mode"
        :display-side-by-side="false"
        :add-icon="'icon-plus'"
      />
    </template>

    <template #chart>
      <h2 v-t="'fleet.helmOp.source.release.title'" />

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.helm.releaseName"
            :mode="mode"
            :label-key="`fleet.helmOp.source.release.label`"
            :placeholder="t(`fleet.helmOp.source.release.placeholder`, null, true)"
            :required="true"
          />
        </div>
      </div>

      <h2 v-t="'fleet.helmOp.source.title'" />

      <div
        v-if="!isView"
        class="row mb-10"
      >
        <div class="col span-6">
          <LabeledSelect
            v-model:value="sourceType"
            :options="sourceTypeOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.helmOp.source.selectLabel')"
            @selecting="onSourceTypeSelect"
          />
        </div>
      </div>

      <template v-if="sourceType === 'tarball'">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              label-key="fleet.helmOp.source.tarball.label"
              :placeholder="t('fleet.helmOp.source.tarball.placeholder', null, true)"
              :required="true"
            />
          </div>
        </div>
      </template>

      <template v-if="sourceType === 'repo' || sourceType === 'oci'">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.repo"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.placeholder`, null, true)"
              :required="true"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              label-key="fleet.helmOp.source.chart.label"
              :placeholder="t('fleet.helmOp.source.chart.placeholder', null, true)"
              :required="true"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="value.spec.helm.version"
              :mode="mode"
              label-key="fleet.helmOp.source.version.label"
              :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
              :required="true"
            />
          </div>
        </div>
      </template>

      <template v-if="sourceType.isClusterRegistry">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              :value="value.spec.helm.repo"
              :mode="mode"
              :label-key="'fleet.helmOp.source.oci.label'"
              :placeholder="t('fleet.helmOp.source.oci.placeholder', null, true)"
              :required="true"
              :disabled="true"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.helm.chart"
              :options="chartOptions(sourceType.key)"
              option-key="value"
              :mode="mode"
              :selectable="option => !option.disabled"
              :label="t('fleet.helmOp.source.chart.label')"
              @selecting="onChartSelect($event.value)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="value.spec.helm.version"
              :options="versionOptions(sourceType.key)"
              option-key="value"
              :mode="mode"
              :selectable="option => !option.disabled"
              :label="t('fleet.helmOp.source.version.label')"
              @selecting="onVersionSelect($event.value)"
            />
          </div>
        </div>
      </template>
    </template>

    <template #values>
      <Banner
        color="info"
        class="description"
        label-key="fleet.helmOp.values.description"
      />

      <h2 v-t="'fleet.helmOp.values.title'" />

      <!-- <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="valuesType"
            :options="valuesTypeOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.helmOp.values.selectLabel')"
          />
        </div>
      </div> -->

      <div class="mb-15">
        <h3 v-t="'fleet.helmOp.values.values.selectLabel'" />
        <div
          v-if="!isView"
          class="yaml-form-controls"
        >
          <ButtonGroup
            v-model:value="yamlForm"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :options="yamlFormOptions"
          />
          <div
            class="yaml-form-controls-spacer"
            style="flex:1"
          >
&nbsp;
          </div>
          <ButtonGroup
            v-if="showYamlDiff"
            v-model:value="diffMode"
            :options="yamlDiffModeOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          />
          <!-- <div
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
          </div> -->
        </div>

        <div>
          <YamlEditor
            v-if="yamlForm === VALUES_STATE.YAML"
            ref="yaml"
            v-model:value="value.spec.helm.values"
            class="step__values__content"
            :mode="mode"
            :scrolling="true"
            :initial-yaml-values="defaultYamlValues"
            :editor-mode="editorMode"
            :hide-preview-buttons="true"
          />
        </div>

        <div
          v-if="yamlForm === VALUES_STATE.DIFF"
        >
          DIFF
        </div>

        <!-- Confirm loss of changes on toggle from yaml/preview to form -->
        <!-- <ResourceCancelModal
          ref="cancelModal"
          :is-cancel-modal="false"
          :is-form="true"
          @cancel-cancel="preFormYamlOption=formYamlOption"
          @confirm-cancel="formYamlOption = preFormYamlOption;"
        /> -->
      </div>

      <!-- <div class="mb-15">
        <ArrayList
          v-model:value="value.spec.helm.valuesFiles"
          :title="t('fleet.helmOp.values.valuesFiles.selectLabel')"
          :mode="mode"
          :initial-empty-row="false"
          :value-placeholder="t('fleet.helmOp.values.valuesFiles.placeholder')"
          :add-label="t('fleet.helmOp.values.valuesFiles.addLabel')"
          :a11y-label="t('fleet.helmOp.values.valuesFiles.ariaLabel')"
          :add-icon="'icon-plus'"
          :protip="t('fleet.helmOp.values.valuesFiles.empty')"
        />
      </div> -->

      <div class="mb-20">
        <h3 v-t="'fleet.helmOp.values.valuesFrom.selectLabel'" />
        <!-- <LabeledSelect
          v-model:value="valuesFrom"
          :options="[]"
          option-key="value"
          :mode="mode"
          :selectable="option => !option.disabled"
          :label="t('fleet.helmOp.values.valuesFrom.selectLabel')"
        /> -->

        <div
          v-for="(row, i) in valuesFrom"
          :key="i"
        >
          <ValueFromResource
            :value="row"
            :options="valueFromOptions"
            :all-secrets="allSecrets"
            :all-config-maps="allConfigMaps"
            :namespaced="true"
            :mode="mode"
            :show-variable-name="true"
            @remove="removeValueFrom(i)"
            @update:value="updateValueFrom(i, $event)"
          />
        </div>
        <button
          v-if="!isView"
          v-t="'workload.container.command.addEnvVar'"
          type="button"
          class="btn role-tertiary add"
          data-testid="add-env-var"
          @click="addValueFrom"
        />
      </div>
    </template>

    <template #target>
      <h2 v-t="isLocal ? 'fleet.helmOp.target.labelLocal' : 'fleet.helmOp.target.label'" />

      <template v-if="!isLocal">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="targetMode"
              :options="targetOptions"
              option-key="value"
              :mode="mode"
              :selectable="option => !option.disabled"
              :label="t('fleet.helmOp.target.selectLabel')"
            >
              <template v-slot:option="opt">
                <hr v-if="opt.kind === 'divider'">
                <div v-else-if="opt.kind === 'title'">
                  {{ opt.label }}
                </div>
                <div v-else>
                  {{ opt.label }}
                </div>
              </template>
            </LabeledSelect>
          </div>
        </div>

        <div
          v-if="targetMode === 'advanced'"
          class="row mt-10"
        >
          <div class="col span-12">
            <YamlEditor v-model:value="targetAdvanced" />
          </div>
        </div>

        <Banner
          v-for="(err, i) in targetAdvancedErrors"
          :key="i"
          color="error"
          :label="err"
        />
      </template>

      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.serviceAccount"
            :mode="mode"
            label-key="fleet.helmOp.serviceAccount.label"
            placeholder-key="fleet.helmOp.serviceAccount.placeholder"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.targetNamespace"
            :mode="mode"
            label-key="fleet.helmOp.targetNamespace.label"
            placeholder-key="fleet.helmOp.targetNamespace.placeholder"
            label="Target Namespace"
            placeholder="Optional: Require all resources to be in this namespace"
          />
        </div>
      </div>
    </template>

    <template #advanced>
      <Banner
        v-if="!isView"
        color="info"
        label-key="fleet.helmOp.add.steps.advanced.info"
      />

      <h2 v-t="'fleet.helmOp.auth.title'" />

      <SelectOrCreateAuthSecret
        :value="value.spec.helmSecretName"
        :register-before-hook="registerBeforeHook"
        :namespace="value.metadata.namespace"
        :delegate-create-to-parent="true"
        in-store="management"
        :mode="mode"
        generate-name="helmrepo-auth-"
        label-key="fleet.helmOp.auth.helm"
        :pre-select="tempCachedValues.helmSecretName"
        :cache-secrets="true"
        :show-ssh-known-hosts="true"
        @update:value="updateAuth($event, 'helmSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
      />

      <div class="row mt-20 mb-20">
        <div class="col span-6">
          <Checkbox
            v-model:value="value.spec.insecureSkipTLSVerify"
            :tooltip="t('fleet.helmOp.tls.insecure')"
            type="checkbox"
            label-key="fleet.helmOp.tls.insecure"
            :mode="mode"
          />
        </div>
      </div>

      <h2 v-t="'fleet.helmOp.resources.label'" />

      <div class="resource-handling">
        <Checkbox
          v-model:value="correctDriftEnabled"
          :tooltip="t('fleet.helmOp.resources.correctDriftTooltip')"
          type="checkbox"
          label-key="fleet.helmOp.resources.correctDrift"
          :mode="mode"
        />
        <Checkbox
          v-model:value="value.spec.keepResources"
          :tooltip="t('fleet.helmOp.resources.keepResourcesTooltip')"
          type="checkbox"
          label-key="fleet.helmOp.resources.keepResources"
          :mode="mode"
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
  .resource-handling {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
