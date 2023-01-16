<script>
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

export default {
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
    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    if (!this.value.affinity) {
      this.$set(this.value, 'affinity', {});
    }
    const { podAffinity = {}, podAntiAffinity = {} } = this.value.affinity;
    const allAffinityTerms = [...(podAffinity.preferredDuringSchedulingIgnoredDuringExecution || []), ...(podAffinity.requiredDuringSchedulingIgnoredDuringExecution || [])].map((term) => {
      const out = clone(term);

      out._id = randomStr(4);
      out._anti = false;
      if (term.podAffinityTerm) {
        Object.assign(out, term.podAffinityTerm);
        out._namespaces = (term.podAffinityTerm.namespaces || []).toString();
        delete out.podAffinityTerm;
      }

      return out;
    });
    const allAntiTerms = [...(podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution || []), ...(podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution || [])].map((term) => {
      const out = clone(term);

      out._id = randomStr(4);
      out._anti = true;
      if (term.podAffinityTerm) {
        Object.assign(out, term.podAffinityTerm);
        out._namespaces = (term.podAffinityTerm.namespaces || []).toString();
        delete out.podAffinityTerm;
      }

      return out;
    });

    const allSelectorTerms = [...allAffinityTerms, ...allAntiTerms];

    return {
      allSelectorTerms,
      defaultWeight: 1,
      // rules in MatchExpressions.vue can not catch changes what happens on parent component
      // we need re-render it via key changing
      rerenderNums:  randomStr(4)
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    pod() {
      return POD;
    },

    node() {
      return NODE;
    },

    allNamespaces() {
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

    hasNamespaces() {
      return this.allNamespaces.length;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    update() {
      const podAffinity = { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] };
      const podAntiAffinity = { requiredDuringSchedulingIgnoredDuringExecution: [], preferredDuringSchedulingIgnoredDuringExecution: [] };

      this.allSelectorTerms.forEach((term) => {
        if (term._anti) {
          if (term.weight) {
            const neu = { podAffinityTerm: term, weight: term.weight || this.defaultWeight };

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

      Object.assign(this.value.affinity, { podAffinity, podAntiAffinity });
      this.$emit('update', this.value);
    },

    remove() {
      this.rerenderNums = randomStr(4);
      this.queueUpdate();
    },

    addSelector() {
      const neu = {
        namespaces:    null,
        labelSelector: { matchExpressions: [] },
        topologyKey:   '',
        _id:           randomStr(4)
      };

      this.allSelectorTerms.push(neu);
    },

    changePriority(term, idx) {
      if (term.weight) {
        delete term.weight;
      } else {
        term.weight = this.defaultWeight;
      }

      this.$set(this.allSelectorTerms, idx, clone(term));
      this.queueUpdate();
    },

    priorityDisplay(term) {
      return term.weight ? this.t('workload.scheduling.affinity.preferred') : this.t('workload.scheduling.affinity.required');
    },

    changeNamespaceMode(term, idx) {
      if (term.namespaces) {
        term.namespaces = null;
        term._namespaces = null;
      } else {
        this.$set(term, 'namespaces', []);
        this.$set(term, '_namespaces', '');
      }
      this.$set(this.allSelectorTerms, idx, term);
      this.queueUpdate();
    },

    updateNamespaces(term, namespaces) {
      let nsArray = namespaces;

      // namespaces would be String if there is no namespace
      if (!this.hasNamespaces) {
        nsArray = namespaces.split(',').map(ns => ns.trim()).filter(ns => ns?.length);
      }

      this.$set(term, 'namespaces', nsArray);
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
    @input="queueUpdate"
  >
    <div class="col span-12">
      <ArrayListGrouped
        v-model="allSelectorTerms"
        class="mt-20"
        :default-add-value="{ matchExpressions: [] }"
        :mode="mode"
        :add-label="t('workload.scheduling.affinity.addNodeSelector')"
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
                @input="$set(props.row.value, '_anti',!props.row.value._anti)"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                :key="priorityDisplay(props.row.value)"
                :mode="mode"
                :options="[t('workload.scheduling.affinity.preferred'),t('workload.scheduling.affinity.required')]"
                :value="priorityDisplay(props.row.value)"
                :label="t('workload.scheduling.affinity.priority')"
                @input="changePriority(props.row.value, props.i)"
              />
            </div>
          </div>
          <div class="row">
            <RadioGroup
              :options="[false, true]"
              :labels="[t('workload.scheduling.affinity.thisPodNamespace'),t('workload.scheduling.affinity.matchExpressions.inNamespaces'),]"
              :name="`namespaces-${props.row.value._id}`"
              :mode="mode"
              :value="!!props.row.value.namespaces"
              @input="changeNamespaceMode(props.row.value, props.i)"
            />
          </div>
          <div class="spacer" />
          <div
            v-if="!!props.row.value.namespaces || !!get(props.row.value, 'podAffinityTerm.namespaces')"
            class="row mb-20"
          >
            <LabeledSelect
              v-if="hasNamespaces"
              v-model="props.row.value.namespaces"
              :mode="mode"
              :multiple="true"
              :taggable="true"
              :options="allNamespaces"
              :label="t('workload.scheduling.affinity.matchExpressions.inNamespaces')"
              @input="updateNamespaces(props.row.value, props.row.value.namespaces)"
            />
            <LabeledInput
              v-else
              v-model="props.row.value._namespaces"
              :mode="mode"
              :label="t('workload.scheduling.affinity.matchExpressions.inNamespaces')"
              :placeholder="t('cluster.credential.harvester.affinity.namespaces.placeholder')"
              @input="updateNamespaces(props.row.value, props.row.value._namespaces)"
            />
          </div>
          <MatchExpressions
            :key="rerenderNums"
            :mode="mode"
            class=" col span-12 mt-20"
            :type="pod"
            :value="get(props.row.value, 'labelSelector.matchExpressions')"
            :show-remove="false"
            @input="e=>set(props.row.value, 'labelSelector.matchExpressions', e)"
          />
          <div class="spacer" />
          <div class="row">
            <div class="col span-12">
              <LabeledSelect
                v-if="hasNodes"
                v-model="props.row.value.topologyKey"
                :taggable="true"
                :searchable="true"
                :close-on-select="false"
                :mode="mode"
                required
                :label="t('workload.scheduling.affinity.topologyKey.label')"
                :placeholder="t('workload.scheduling.affinity.topologyKey.placeholder')"
                :options="existingNodeLabels"
                :disabled="mode==='view'"
                :loading="loading"
                @input="update"
              />
              <LabeledInput
                v-else
                v-model="props.row.value.topologyKey"
                :mode="mode"
                :label="t('workload.scheduling.affinity.topologyKey.label')"
                :placeholder="t('workload.scheduling.affinity.topologyKey.placeholder')"
                required
                @input="update"
              />
            </div>
          </div>

          <div class="spacer" />
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model.number="props.row.value.weight"
                :mode="mode"
                type="number"
                min="1"
                max="100"
                :label="t('workload.scheduling.affinity.weight.label')"
                :placeholder="t('workload.scheduling.affinity.weight.placeholder')"
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
