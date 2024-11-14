<script>
import { mapGetters } from 'vuex';
import { _VIEW } from '@shell/config/query-params';
import { get, set, isEmpty, clone } from '@shell/utils/object';
import { POD, NODE, NAMESPACE } from '@shell/config/types';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { randomStr } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import debounce from 'lodash/debounce';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { getUniqueLabelKeys } from '@shell/utils/array';

const NAMESPACE_SELECTION_OPTION_VALUES = {
  POD:      'pod',
  ALL:      'all',
  SELECTED: 'selected',
};

export default {
  emits: ['update'],

  components: {
    ArrayListGrouped, MatchExpressions, LabeledSelect, RadioGroup, LabeledInput
  },

  props: {
    // pod template spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // Field key on the value object to store the pod affinity - typically this is 'affinity'
    // Cluster Agent Configuration uses a different field
    field: {
      type:    String,
      default: 'affinity'
    },

    mode: {
      type:    String,
      default: 'create'
    },

    nodes: {
      type:    Array,
      default: () => []
    },

    namespaces: {
      type:    Array,
      default: null
    },

    allNamespacesOptionAvailable: {
      default: false,
      type:    Boolean
    },

    forceInputNamespaceSelection: {
      default: false,
      type:    Boolean
    },

    removeLabeledInputNamespaceLabel: {
      default: false,
      type:    Boolean
    },

    overwriteLabels: {
      type:    Object,
      default: null
    },

    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    if (!this.value[this.field]) {
      this.value[this.field] = {};
    }
    const { podAffinity = {}, podAntiAffinity = {} } = this.value[this.field];
    const allAffinityTerms = [...(podAffinity.preferredDuringSchedulingIgnoredDuringExecution || []), ...(podAffinity.requiredDuringSchedulingIgnoredDuringExecution || [])].map((term) => {
      let out = clone(term);

      out._id = randomStr(4);
      out._anti = false;
      if (term.podAffinityTerm) {
        Object.assign(out, term.podAffinityTerm);
        out = this.parsePodAffinityTerm(out);

        delete out.podAffinityTerm;
      } else {
        out = this.parsePodAffinityTerm(out);
      }

      return out;
    });
    const allAntiTerms = [...(podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution || []), ...(podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution || [])].map((term) => {
      let out = clone(term);

      out._id = randomStr(4);
      out._anti = true;
      if (term.podAffinityTerm) {
        Object.assign(out, term.podAffinityTerm);
        out = this.parsePodAffinityTerm(out);

        delete out.podAffinityTerm;
      } else {
        out = this.parsePodAffinityTerm(out);
      }

      return out;
    });

    const allSelectorTerms = [...allAffinityTerms, ...allAntiTerms];

    return {
      allSelectorTerms,
      defaultWeight:   1,
      // rules in MatchExpressions.vue can not catch changes what happens on parent component
      // we need re-render it via key changing
      rerenderNums:    randomStr(4),
      NAMESPACE_SELECTION_OPTION_VALUES,
      defaultAddValue: {
        _namespaceOption: NAMESPACE_SELECTION_OPTION_VALUES.POD,
        matchExpressions: [],
        namespaces:       null,
        _namespaces:      null,
      }
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    isView() {
      return this.mode === _VIEW;
    },

    pod() {
      return POD;
    },

    node() {
      return NODE;
    },

    labeledInputNamespaceLabel() {
      return this.removeLabeledInputNamespaceLabel ? '' : this.overwriteLabels?.namespaceInputLabel || this.t('workload.scheduling.affinity.matchExpressions.inNamespaces');
    },

    allNamespacesOptions() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const choices = this.namespaces || this.$store.getters[`${ inStore }/all`](NAMESPACE);

      const out = sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');

      return out;
    },

    existingNodeLabels() {
      return getUniqueLabelKeys(this.nodes);
    },

    hasNodes() {
      return this.nodes.length;
    },

    namespaceSelectionOptions() {
      if (this.allNamespacesOptionAvailable) {
        return [
          NAMESPACE_SELECTION_OPTION_VALUES.POD,
          NAMESPACE_SELECTION_OPTION_VALUES.ALL,
          NAMESPACE_SELECTION_OPTION_VALUES.SELECTED
        ];
      }

      return [
        NAMESPACE_SELECTION_OPTION_VALUES.POD,
        NAMESPACE_SELECTION_OPTION_VALUES.SELECTED
      ];
    },

    namespaceSelectionLabels() {
      if (this.overwriteLabels?.namespaceSelectionLabels) {
        return this.overwriteLabels?.namespaceSelectionLabels;
      }

      if (this.allNamespacesOptionAvailable) {
        return [
          this.t('workload.scheduling.affinity.thisPodNamespace'),
          this.t('workload.scheduling.affinity.allNamespaces'),
          this.t('workload.scheduling.affinity.matchExpressions.inNamespaces')
        ];
      }

      return [
        this.t('workload.scheduling.affinity.thisPodNamespace'),
        this.t('workload.scheduling.affinity.matchExpressions.inNamespaces')
      ];
    },

    addLabel() {
      return this.overwriteLabels?.addLabel || this.t('podAffinity.addLabel');
    },

    topologyKeyPlaceholder() {
      return this.overwriteLabels?.topologyKeyPlaceholder || this.t('workload.scheduling.affinity.topologyKey.placeholder');
    },

    hasNamespaces() {
      return this.allNamespacesOptions.length;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    parsePodAffinityTerm(out) {
      if (out.namespaceSelector && typeof out.namespaceSelector === 'object' && !Object.keys(out.namespaceSelector).length && this.allNamespacesOptionAvailable) {
        out._namespaceOption = NAMESPACE_SELECTION_OPTION_VALUES.ALL;
      } else if (out.namespaces?.length) {
        out._namespaceOption = NAMESPACE_SELECTION_OPTION_VALUES.SELECTED;
      } else {
        out._namespaceOption = NAMESPACE_SELECTION_OPTION_VALUES.POD;
      }

      out._namespaces = (out.namespaces || []).toString();

      return out;
    },

    update() {
      const podAffinity = { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] };
      const podAntiAffinity = { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] };

      this.allSelectorTerms.forEach((term) => {
        if (term._anti) {
          if (term.weight) {
            const neu = { podAffinityTerm: { ...term }, weight: term.weight || this.defaultWeight };

            delete neu.podAffinityTerm.weight;
            podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.push(neu);
          } else {
            podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution.push(term);
          }
        } else if (term.weight) {
          const neu = { podAffinityTerm: term, weight: term.weight || this.defaultWeight };

          podAffinity.preferredDuringSchedulingIgnoredDuringExecution.push(neu);
        } else {
          podAffinity.requiredDuringSchedulingIgnoredDuringExecution.push(term);
        }
      });

      Object.assign(this.value[this.field], { podAffinity, podAntiAffinity });
      this.$emit('update', this.value);
    },

    remove() {
      this.rerenderNums = randomStr(4);
      this.queueUpdate();
    },

    changePriority(term, idx) {
      if (term.weight) {
        delete term.weight;
      } else {
        term.weight = this.defaultWeight;
      }

      this.allSelectorTerms[idx] = clone(term);
      this.queueUpdate();
    },

    priorityDisplay(term) {
      return 'weight' in term ? this.t('workload.scheduling.affinity.preferred') : this.t('workload.scheduling.affinity.required');
    },

    changeNamespaceMode(val, term, idx) {
      term['_namespaceOption'] = val;

      switch (val) {
      case NAMESPACE_SELECTION_OPTION_VALUES.POD:
        term.namespaces = null;
        term._namespaces = null;

        if (term.namespaceSelector || term.namespaceSelector === null) {
          delete term.namespaceSelector;
        }
        break;
      case NAMESPACE_SELECTION_OPTION_VALUES.ALL:
        term.namespaceSelector = {};

        if (term.namespaces || term.namespaces === null) {
          delete term.namespaces;
        }

        if (term._namespaces || term._namespaces === null) {
          delete term._namespaces;
        }
        break;

      default:
        term['namespaces'] = [];
        term['_namespaces'] = '';

        if (term.namespaceSelector || term.namespaceSelector === null) {
          delete term.namespaceSelector;
        }

        break;
      }

      this.allSelectorTerms[idx] = term;
      this.queueUpdate();
    },

    updateNamespaces(term, namespaces) {
      let nsArray = namespaces;

      // namespaces would be String if there is no namespace
      if (typeof namespaces === 'string') {
        nsArray = namespaces.split(',').map((ns) => ns.trim()).filter((ns) => ns?.length);
      }

      term['namespaces'] = nsArray;
      this.queueUpdate();
    },

    updateLabelSelector(e, props) {
      this.set(props.row.value, 'labelSelector.matchExpressions', e);
      this.queueUpdate();
    },

    isEmpty,
    get,
    set
  }

};
</script>

<template>
  <div
    :style="{'width':'100%'}"
    class="row"
    @update:value="queueUpdate"
  >
    <div class="col span-12">
      <ArrayListGrouped
        v-model:value="allSelectorTerms"
        class="mt-20"
        :default-add-value="defaultAddValue"
        :mode="mode"
        :add-label="addLabel"
        @remove="remove"
      >
        <template #default="props">
          <div class="row mt-20 mb-20">
            <div class="col span-6">
              <LabeledSelect
                :mode="mode"
                :options="[t('workload.scheduling.affinity.affinityOption'),t('workload.scheduling.affinity.antiAffinityOption')]"
                :value="props.row.value._anti ?t('workload.scheduling.affinity.antiAffinityOption') :t('workload.scheduling.affinity.affinityOption') "
                :label="t('workload.scheduling.affinity.type')"
                :data-testid="`pod-affinity-type-index${props.i}`"
                @update:value="props.row.value._anti = !props.row.value._anti"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                :mode="mode"
                :options="[t('workload.scheduling.affinity.preferred'),t('workload.scheduling.affinity.required')]"
                :value="priorityDisplay(props.row.value)"
                :label="t('workload.scheduling.affinity.priority')"
                :data-testid="`pod-affinity-priority-index${props.i}`"
                @update:value="changePriority(props.row.value, props.i)"
              />
            </div>
          </div>
          <div class="row">
            <RadioGroup
              :options="namespaceSelectionOptions"
              :labels="namespaceSelectionLabels"
              :name="`namespaces-${props.row.value._id}`"
              :mode="mode"
              :value="props.row.value._namespaceOption"
              :data-testid="`pod-affinity-namespacetype-index${props.i}`"
              @update:value="changeNamespaceMode($event, props.row.value, props.i)"
            />
          </div>
          <div
            v-if="props.row.value._namespaceOption === NAMESPACE_SELECTION_OPTION_VALUES.SELECTED"
            class="row mt-10 mb-20"
          >
            <LabeledSelect
              v-if="hasNamespaces && !forceInputNamespaceSelection"
              v-model:value="props.row.value.namespaces"
              :mode="mode"
              :multiple="true"
              :taggable="true"
              :options="allNamespacesOptions"
              :label="labeledInputNamespaceLabel"
              :data-testid="`pod-affinity-namespace-select-index${props.i}`"
              @update:value="updateNamespaces(props.row.value, props.row.value.namespaces)"
            />
            <LabeledInput
              v-else
              v-model:value="props.row.value._namespaces"
              :mode="mode"
              :label="labeledInputNamespaceLabel"
              :placeholder="t('harvesterManager.affinity.namespaces.placeholder')"
              :data-testid="`pod-affinity-namespace-input-index${props.i}`"
              @update:value="updateNamespaces(props.row.value, props.row.value._namespaces)"
            />
          </div>
          <MatchExpressions
            :mode="mode"
            class=" col span-12 mt-20"
            :type="pod"
            :value="get(props.row.value, 'labelSelector.matchExpressions')"
            :show-remove="false"
            :data-testid="`pod-affinity-expressions-index${props.i}`"
            @update:value="e=>updateLabelSelector(e, props)"
          />
          <div class="row mt-20">
            <div class="col span-9">
              <LabeledSelect
                v-if="hasNodes"
                v-model:value="props.row.value.topologyKey"
                :taggable="true"
                :searchable="true"
                :close-on-select="false"
                :mode="mode"
                required
                :label="t('workload.scheduling.affinity.topologyKey.label')"
                :placeholder="topologyKeyPlaceholder"
                :options="existingNodeLabels"
                :disabled="mode==='view'"
                :loading="loading"
                :data-testid="`pod-affinity-topology-select-index${props.i}`"
                @update:value="update"
              />
              <LabeledInput
                v-else
                v-model:value="props.row.value.topologyKey"
                :mode="mode"
                :label="t('workload.scheduling.affinity.topologyKey.label')"
                :placeholder="topologyKeyPlaceholder"
                required
                :data-testid="`pod-affinity-topology-input-index${props.i}`"
                @update:value="update"
              />
            </div>
            <div
              v-if="'weight' in props.row.value"
              class="col span-3"
            >
              <LabeledInput
                v-model:value.number="props.row.value.weight"
                :mode="mode"
                type="number"
                min="1"
                max="100"
                :label="t('workload.scheduling.affinity.weight.label')"
                :placeholder="t('workload.scheduling.affinity.weight.placeholder')"
                :data-testid="`pod-affinity-weight-index${props.i}`"
                @update:value="update"
              />
            </div>
          </div>
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style>
.node-selector{
  position: relative;
}
</style>
