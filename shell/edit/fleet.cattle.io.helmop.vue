<script>
import { clone, set } from '@shell/utils/object';
import semver from 'semver';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { base64Encode } from '@shell/utils/crypto';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { AUTH_TYPE, CONFIG_MAP, NORMAN, SECRET } from '@shell/config/types';
import { CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
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
import { mapPref, DIFF } from '@shell/store/prefs';
import { SECRET_TYPES } from '@shell/config/secret';
import UnitInput from '@shell/components/form/UnitInput';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { toSeconds } from '@shell/utils/duration';
import FleetValuesFrom from '@shell/components/fleet/FleetValuesFrom.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';

const MINIMUM_POLLING_INTERVAL = 15;

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
    FleetClusterTargets,
    FleetConfigMapSelector,
    FleetSecretSelector,
    FleetValuesFrom,
    YamlEditor,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    SelectOrCreateAuthSecret,
    UnitInput,
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
      sourceType:       this.value.sourceType || SOURCE_TYPE.REPO,
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

    updateBeforeSave() {
      this.value.spec['correctDrift'] = { enabled: this.correctDriftEnabled };

      if (this.mode === _CREATE) {
        this.value.metadata.labels[FLEET_LABELS.CREATED_BY_USER_ID] = this.currentUser.id;
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
          path:  'spec.helm.version',
          rules: ['semanticVersion'],
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
              :rules="fvGetAndReportPathRules('spec.helm.chart')"
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
              :rules="fvGetAndReportPathRules('spec.helm.repo')"
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
              :rules="fvGetAndReportPathRules('spec.helm.chart')"
              :required="true"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="value.spec.helm.version"
              :mode="mode"
              label-key="fleet.helmOp.source.version.label"
              :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.version')"
            />
          </div>
        </div>
      </template>

      <template v-if="sourceType === SOURCE_TYPE.OCI">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.repo"
              :mode="mode"
              :label-key="`fleet.helmOp.source.${ sourceType }.chart.label`"
              :placeholder="t(`fleet.helmOp.source.${ sourceType }.chart.placeholder`, null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.repo')"
              :required="true"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="value.spec.helm.version"
              :mode="mode"
              label-key="fleet.helmOp.source.version.label"
              :placeholder="t('fleet.helmOp.source.version.placeholder', null, true)"
              :rules="fvGetAndReportPathRules('spec.helm.version')"
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
        <FleetValuesFrom
          v-model:value="value.spec.helm.valuesFrom"
          :namespace="value.metadata.namespace"
          :mode="realMode"
        />
      </div>
    </template>

    <template #target>
      <h2 v-t="'fleet.helmOp.target.label'" />
      <FleetClusterTargets
        :targets="value.spec.targets"
        :matching="value.targetClusters"
        :namespace="value.metadata.namespace"
        :mode="realMode"
        :created="targetsCreated"
        @update:value="updateTargets"
        @created="targetsCreated=$event"
      />

      <h3 class="mmt-16">
        {{ t('fleet.helmOp.target.additionalOptions') }}
      </h3>
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
            v-model:value="value.spec.namespace"
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
        data-testid="helmOp-advanced-info"
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

      <div class="row mt-20 mb-20">
        <div class="col span-6">
          <FleetSecretSelector
            :value="downstreamSecretsList"
            :namespace="value.metadata.namespace"
            :mode="mode"
            @update:value="updateDownstreamResources('Secret', $event)"
          />
        </div>
      </div>
      <div class="row mt-20 mb-20">
        <div class="col span-6">
          <FleetConfigMapSelector
            :value="downstreamConfigMapsList"
            :namespace="value.metadata.namespace"
            :mode="mode"
            @update:value="updateDownstreamResources('ConfigMap', $event)"
          />
        </div>
      </div>
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

      <template v-if="sourceType === SOURCE_TYPE.REPO">
        <h2 v-t="'fleet.helmOp.polling.label'" />
        <div class="row polling">
          <div class="col span-6">
            <Checkbox
              :value="isPollingEnabled"
              type="checkbox"
              label-key="fleet.helmOp.polling.enable"
              data-testid="helmOp-enablePolling-checkbox"
              :tooltip="enablePollingTooltip"
              :mode="mode"
              :disabled="isNullOrStaticVersion"
              @update:value="togglePolling"
            />
          </div>
          <template v-if="isPollingEnabled">
            <div class="col">
              <Banner
                v-if="showPollingIntervalMinValueWarning"
                color="warning"
                label-key="fleet.helmOp.polling.pollingInterval.minimumValueWarning"
                data-testid="helmOp-pollingInterval-minimumValueWarning"
              />
            </div>
            <div class="col span-6">
              <UnitInput
                v-model:value="pollingInterval"
                min="1"
                data-testid="helmOp-pollingInterval-input"
                :suffix="t('suffix.seconds', { count: pollingInterval })"
                :label="t('fleet.helmOp.polling.pollingInterval.label')"
                :mode="mode"
                tooltip-key="fleet.helmOp.polling.pollingInterval.tooltip"
                @blur.capture="updatePollingInterval(pollingInterval)"
              />
            </div>
          </template>
        </div>
      </template>
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
