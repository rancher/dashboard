<script>
import { clone, set } from '@shell/utils/object';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import FleetUtils from '@shell/utils/fleet';
import {
  AUTH_TYPE, CONFIG_MAP, FLEET, NORMAN, SECRET, VIRTUAL_HARVESTER_PROVIDER
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
import UnitInput from '@shell/components/form/UnitInput';
import { toSeconds } from '@shell/utils/duration';
import { DEFAULT_POLLING_INTERVAL, MINIMUM_POLLING_INTERVAL } from '@shell/models/fleet-application';

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
    UnitInput,
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

    this.allClusters = hash.allClusters || [];
    this.allClusterGroups = hash.allClusterGroups || [];
    this.allSecrets = hash.allSecrets || [];
    this.allConfigMaps = hash.allConfigMaps || [];

    this.updateTargets();
  },

  data() {
    let pollingInterval = toSeconds(this.value.spec.pollingInterval) || this.value.spec.pollingInterval;

    if (!pollingInterval) {
      if (this.realMode === _CREATE) {
        pollingInterval = DEFAULT_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.durationSeconds(pollingInterval);
      } else if (this.realMode === _EDIT || this.realMode === _VIEW) {
        pollingInterval = MINIMUM_POLLING_INTERVAL;
      }
    }

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

    const chartValues = saferDump(clone(this.value.spec.helm.values));

    return {
      VALUES_STATE,
      SOURCE_TYPE,
      allClusters:          [],
      allClusterGroups:     [],
      allSecrets:           [],
      allConfigMaps:        [],
      allWorkspaces:        [],
      pollingInterval,
      targetMode,
      targetAdvanced,
      targetAdvancedErrors: null,
      sourceTypeInit:       this.value.sourceType,
      sourceType:           this.value.sourceType || SOURCE_TYPE.REPO,
      helmSpecInit:         clone(this.value.spec.helm),
      yamlForm:             VALUES_STATE.YAML,
      chartValues,
      chartValuesInit:      chartValues,
      valuesFrom:           FleetUtils.HelmOp.fromValuesFrom(this.value.spec.helm.valuesFrom),
      correctDriftEnabled,
      tempCachedValues:     {},
      doneRouteList:        'c-cluster-fleet-application',
      isRealModeEdit:       this.realMode === _EDIT
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

    sourceTypeOptions() {
      return Object.values(SOURCE_TYPE).map((value) => ({
        value,
        label: this.t(`fleet.helmOp.source.types.${ value }`)
      }));
    },

    valueFromOptions() {
      return [
        {
          value: 'configMapKeyRef', label: 'ConfigMap Key', hideVariableName: true
        },
        {
          value: 'secretKeyRef', label: 'Secret key', hideVariableName: true
        },
      ];
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

    showPollingIntervalWarning() {
      return !this.isView && this.value.isPollingEnabled && this.pollingInterval < MINIMUM_POLLING_INTERVAL;
    },
  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    workspace(neu) {
      if (this.isCreate) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  methods: {
    onSourceTypeSelect(type) {
      delete this.value.spec.helm.repo;
      delete this.value.spec.helm.chart;
      delete this.value.spec.helm.version;

      if (this.realMode !== _CREATE && this.sourceTypeInit === type) {
        const { repo, chart, version } = this.helmSpecInit;

        set(this.value, 'spec.helm.repo', repo);
        set(this.value, 'spec.helm.chart', chart);
        set(this.value, 'spec.helm.version', version);
      }
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

    enablePolling(value) {
      if (value) {
        delete this.value.spec.disablePolling;
      } else {
        this.value.spec.disablePolling = true;
      }
    },

    updatePollingInterval(value) {
      if (!value) {
        this.pollingInterval = DEFAULT_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.durationSeconds(DEFAULT_POLLING_INTERVAL);
      } else if (value === MINIMUM_POLLING_INTERVAL) {
        delete this.value.spec.pollingInterval;
      } else {
        this.value.spec.pollingInterval = this.durationSeconds(value);
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

    addValueFrom() {
      this.valuesFrom.push({ valueFrom: {} });
    },

    updateValueFrom(index, value) {
      this.valuesFrom[index] = value;

      this.value.spec.helm.valuesFrom = FleetUtils.HelmOp.toValuesFrom(this.valuesFrom, this.workspace);
    },

    removeValueFrom(index) {
      this.valuesFrom.splice(index, 1);
    },

    updateBeforeSave() {
      this.value.spec['correctDrift'] = { enabled: this.correctDriftEnabled };
    },

    durationSeconds(value) {
      return `${ value }s`;
    }
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
          />
        </div>
      </div>

      <h2 v-t="'fleet.helmOp.source.title'" />

      <div
        v-if="!isView"
        class="row mb-20"
      >
        <div class="col span-6">
          <LabeledSelect
            v-model:value="sourceType"
            :options="sourceTypeOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.helmOp.source.selectLabel')"
            @update:value="onSourceTypeSelect"
          />
        </div>
      </div>

      <template v-if="sourceType === SOURCE_TYPE.TARBALL">
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

      <template v-if="sourceType === SOURCE_TYPE.REPO">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.repo"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.repo.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.repo.placeholder`, null, true)"
              :required="true"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
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

      <template v-if="sourceType === SOURCE_TYPE.OCI">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
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
    </template>

    <template #values>
      <Banner
        color="info"
        class="description"
        label-key="fleet.helmOp.values.description"
      />

      <h2 v-t="'fleet.helmOp.values.title'" />

      <div class="mb-15">
        <div
          v-if="isRealModeEdit"
          class="yaml-form-controls"
        >
          <ButtonGroup
            v-model:value="yamlForm"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :options="yamlFormOptions"
            @update:value="updateYamlForm"
          />
          <div
            class="yaml-form-controls-spacer"
            style="flex:1"
          >
            &nbsp;
          </div>
          <ButtonGroup
            v-if="isYamlDiff"
            v-model:value="diffMode"
            :options="yamlDiffModeOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          />
        </div>

        <YamlEditor
          ref="yaml"
          v-model:value="chartValues"
          :mode="mode"
          :initial-yaml-values="chartValuesInit"
          :scrolling="true"
          :editor-mode="editorMode"
          :hide-preview-buttons="true"
          @update:value="updateChartValues"
        />
      </div>

      <div class="mb-20">
        <h2 v-t="'fleet.helmOp.values.valuesFrom.selectLabel'" />
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
            type="checkbox"
            label-key="fleet.helmOp.tls.insecure"
            :mode="mode"
          />
        </div>
      </div>

      <h2 v-t="'fleet.helmOp.resources.label'" />

      <div class="resource-handling mb-30">
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

      <h2 v-t="'fleet.helmOp.polling.label'" />
      <div class="row polling">
        <div class="col span-6">
          <Checkbox
            :value="value.isPollingEnabled"
            type="checkbox"
            label-key="fleet.helmOp.polling.enable"
            :mode="mode"
            @update:value="enablePolling"
          />
        </div>
        <template v-if="value.isPollingEnabled">
          <div class="col">
            <Banner
              v-if="showPollingIntervalWarning"
              color="warning"
              label-key="fleet.helmOp.polling.pollingInterval.minimumValuewarning"
            />
            <Banner
              v-if="value.isWebhookConfigured"
              color="warning"
              label-key="fleet.helmOp.polling.pollingInterval.webhookWarning"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              v-model:value="pollingInterval"
              min="1"
              :suffix="t('suffix.seconds', { count: pollingInterval })"
              :label="t('fleet.helmOp.polling.pollingInterval.label')"
              :mode="mode"
              tooltip-key="fleet.helmOp.polling.pollingInterval.tooltip"
              @update:value="updatePollingInterval"
            />
          </div>
        </template>
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
