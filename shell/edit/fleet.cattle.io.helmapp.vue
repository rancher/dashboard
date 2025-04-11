<script>
import { set } from '@shell/utils/object';
import { mapGetters } from 'vuex';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import {
  AUTH_TYPE, FLEET, NORMAN, SECRET, VIRTUAL_HARVESTER_PROVIDER
} from '@shell/config/types';
import { CAPI, CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import FormValidation from '@shell/mixins/form-validation';
import HelmChart from '@shell/components/HelmChart.vue';
import Labels from '@shell/components/form/Labels';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Banner from '@components/Banner/Banner.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import ArrayList from '@shell/components/form/ArrayList';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { mapPref, DIFF } from '@shell/store/prefs';

const VALUES_TYPE = {
  values: 'values',
  valuesFiles: 'valuesFiles',
  valuesFrom: 'valuesFrom' // TODO from secrets ?
};

const VALUES_STATE = {
  YAML: 'YAML',
  DIFF: 'DIFF'
};

export default {
  name: 'CruHelmApp',

  inheritAttrs: false,

  emits: ['input'],

  components: {
    ArrayList,
    Banner,
    ButtonGroup,
    Checkbox,
    CruResource,
    HelmChart,
    YamlEditor,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    Tabbed,
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
      }
    }, this.$store);

    this.allClusters = hash.allClusters || [];
    this.allClusterGroups = hash.allClusterGroups || [];

    this.updateTargets();
  },

  data() {

    const sourceOptions = [
      {
        label: this.t('fleet.helmApp.source.types.tarball'),
        value: 'tarball'
      },
      {
        label: this.t('fleet.helmApp.source.types.repo'),
        value: 'repo'
      },
      {
        label: this.t('fleet.helmApp.source.types.oci'),
        value: 'oci'
      },
    ];

    const valuesTypeOptions = Object.values(VALUES_TYPE).map((value) => ({
      value,
      label: this.t(`fleet.helmApp.values.types.${ value }`) 
    }));

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

    return {
      VALUES_TYPE,
      VALUES_STATE,
      allClusters:             [],
      allClusterGroups:        [],
      allWorkspaces:           [],
      targetMode,
      targetAdvanced,
      targetAdvancedErrors:    null,
      sourceOptions,
      sourceType: 'repo', // TODO edit mode
      valuesTypeOptions,
      valuesType: VALUES_TYPE.values,
      defaultYamlValues: this.value.spec.helm.values,
      yamlForm: VALUES_STATE.YAML,
      valuesFrom: null,
    };
  },

  computed: {
    ...mapGetters(['workspace']),

    steps() {
      return [
        {
          name:           'basics',
          title:          this.t('fleet.helmApp.add.steps.metadata.title'),
          label:          this.t('fleet.helmApp.add.steps.metadata.label'),
          subtext:        this.t('fleet.helmApp.add.steps.metadata.subtext'),
          descriptionKey: 'fleet.helmApp.add.steps.metadata.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'chart',
          title:          this.t('fleet.helmApp.add.steps.chart.title'),
          label:          this.t('fleet.helmApp.add.steps.chart.label'),
          subtext:        this.t('fleet.helmApp.add.steps.chart.subtext'),
          descriptionKey: 'fleet.helmApp.add.steps.chart.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'values',
          title:          this.t('fleet.helmApp.add.steps.values.title'),
          label:          this.t('fleet.helmApp.add.steps.values.label'),
          subtext:        this.t('fleet.helmApp.add.steps.values.subtext'),
          descriptionKey: 'fleet.helmApp.add.steps.values.description',
          ready:          true,
          weight:         1
        },
        {
          name:           'target',
          title:          this.t('fleet.helmApp.add.steps.targetInfo.title'),
          label:          this.t('fleet.helmApp.add.steps.targetInfo.label'),
          subtext:        this.t('fleet.helmApp.add.steps.targetInfo.subtext'),
          descriptionKey: 'fleet.helmApp.steps.add.targetInfo.description',
          ready:          true,
          weight:         1
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
        labelKey: 'fleet.helmApp.values.yaml.options.edit',
        value:    VALUES_STATE.YAML,
      }, {
        labelKey: 'fleet.helmApp.values.yaml.options.diff',
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

  created() {
  },

  mounted() {
    this.value.applyDefaults();
  },

  methods: {
    // cancel() {
    //   this.$router.push(this.value.doneOverride);
    // },

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
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :done-route="doneRoute"
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
      <h2 v-t="'fleet.helmApp.source.title'" />

      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="sourceType"
            :options="sourceOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.helmApp.source.selectLabel')"
          />
        </div>
      </div>

      <template v-if="sourceType === 'tarball'">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              label-key="fleet.helmApp.source.tarball.label"
              :placeholder="t('fleet.helmApp.source.tarball.placeholder', null, true)"
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
              :label-key="`fleet.helmApp.source.${ sourceType }.label`"
              :placeholder="t(`fleet.helmApp.source.${ sourceType }.placeholder`, null, true)"
              :required="true"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.chart"
              :mode="mode"
              label-key="fleet.helmApp.source.chart.label"
              :placeholder="t('fleet.helmApp.source.chart.placeholder', null, true)"
              :required="true"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="value.spec.helm.version"
              :mode="mode"
              label-key="fleet.helmApp.source.version.label"
              :placeholder="t('fleet.helmApp.source.version.placeholder', null, true)"
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
        label-key="fleet.helmApp.values.description"
      />

      <h2 v-t="'fleet.helmApp.values.title'" />

      <!-- <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="valuesType"
            :options="valuesTypeOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.helmApp.values.selectLabel')"
          />
        </div>
      </div> -->

      <div class="mb-15">
        <h3 v-t="'fleet.helmApp.values.values.selectLabel'" />
        <div class="yaml-form-controls">
          <ButtonGroup
            v-model:value="yamlForm"
            :options="yamlFormOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
          />
          <div class="yaml-form-controls-spacer" style="flex:1">
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

      <div class="mb-15">
        <ArrayList
          v-model:value="value.spec.helm.valuesFiles"
          :title="t('fleet.helmApp.values.valuesFiles.selectLabel')"
          :mode="mode"
          :initial-empty-row="false"
          :value-placeholder="t('fleet.helmApp.values.valuesFiles.placeholder')"
          :add-label="t('fleet.helmApp.values.valuesFiles.addLabel')"
          :a11y-label="t('fleet.helmApp.values.valuesFiles.ariaLabel')"
          :add-icon="'icon-plus'"
          :protip="t('fleet.helmApp.values.valuesFiles.empty')"
        />
      </div>

      <div class="mb-20">
        <h3 v-t="'fleet.helmApp.values.valuesFrom.selectLabel'" />
        <LabeledSelect
          v-model:value="valuesFrom"
          :options="[]"
          option-key="value"
          :mode="mode"
          :selectable="option => !option.disabled"
          :label="t('fleet.helmApp.values.valuesFrom.selectLabel')"
        />
      </div>
      
    </template>

    <template #target>
      <h2 v-t="isLocal ? 'fleet.helmApp.target.labelLocal' : 'fleet.helmApp.target.label'" />

      <template v-if="!isLocal">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="targetMode"
              :options="targetOptions"
              option-key="value"
              :mode="mode"
              :selectable="option => !option.disabled"
              :label="t('fleet.helmApp.target.selectLabel')"
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
            label-key="fleet.helmApp.serviceAccount.label"
            placeholder-key="fleet.helmApp.serviceAccount.placeholder"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.targetNamespace"
            :mode="mode"
            label-key="fleet.helmApp.targetNamespace.label"
            placeholder-key="fleet.helmApp.targetNamespace.placeholder"
            label="Target Namespace"
            placeholder="Optional: Require all resources to be in this namespace"
          />
        </div>
      </div>
    </template>

  </CruResource>
</template>

<style lang="scss" scoped>
  .yaml-form-controls {
    display: flex;
    margin-bottom: 15px;
  }
</style>
