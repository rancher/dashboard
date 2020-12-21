<script>
import { _VIEW } from '@/config/query-params';
import { get, isEmpty, clone } from '@/utils/object';
import { POD, NODE, NAMESPACE } from '@/config/types';
import MatchExpressions from '@/components/form/MatchExpressions';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import InfoBox from '@/components/InfoBox';
import LabeledInput from '@/components/form/LabeledInput';
import { randomStr } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import debounce from 'lodash/debounce';

export default {
  components: {
    MatchExpressions, InfoBox, LabeledSelect, RadioGroup, LabeledInput
  },

  props:      {
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
    }
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
        delete out.podAffinityTerm;
      }

      return out;
    });

    const allSelectorTerms = [...allAffinityTerms, ...allAntiTerms];

    return {
      allSelectorTerms,
      defaultWeight: 1
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
      const inStore = this.$store.getters['currentProduct'].inStore;
      const choices = this.$store.getters[`${ inStore }/all`](NAMESPACE);
      const out = sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');

      return out;
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
            const neu = { podAffinityTerm: term, weight: 1 };

            podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.push(neu);
          } else {
            podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution.push(term);
          }
        } else if (term.weight) {
          const neu = { podAffinityTerm: term, weight: 1 };

          podAffinity.preferredDuringSchedulingIgnoredDuringExecution.push(neu);
        } else {
          podAffinity.requiredDuringSchedulingIgnoredDuringExecution.push(term);
        }
      });

      Object.assign(this.value.affinity, { podAffinity, podAntiAffinity });
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
        term.weight = 1;
      }
      this.$set(this.allSelectorTerms, idx, term);
      this.queueUpdate();
    },

    priorityDisplay(term) {
      return term.weight ? this.t('workload.scheduling.affinity.preferred') : this.t('workload.scheduling.affinity.required');
    },

    changeNamespaceMode(term, idx) {
      if (term.namespaces) {
        term.namespaces = null;
      } else {
        this.$set(term, 'namespaces', []);
      }
      this.$set(this.allSelectorTerms, idx, term);
    },

    updateNamespaces(term, namespaces) {
      this.$set(term, 'namespaces', namespaces);
    },

    isEmpty,
    get,
  }

};
</script>

<template>
  <div :style="{'width':'100%'}" class="row" @input="queueUpdate">
    <div class="col span-12">
      <template v-for="(nodeSelectorTerm, idx) in allSelectorTerms">
        <InfoBox :key="nodeSelectorTerm._id" class="node-selector">
          <div class="row mt-20 mb-20">
            <div class="col span-6">
              <LabeledSelect
                :mode="mode"
                :options="[t('workload.scheduling.affinity.affinityOption'),t('workload.scheduling.affinity.antiAffinityOption')]"
                :value="nodeSelectorTerm._anti ?t('workload.scheduling.affinity.antiAffinityOption') :t('workload.scheduling.affinity.affinityOption') "
                :label="t('workload.scheduling.affinity.type')"
                @input="$set(nodeSelectorTerm, '_anti',!nodeSelectorTerm._anti)"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                :mode="mode"
                :options="[t('workload.scheduling.affinity.preferred'),t('workload.scheduling.affinity.required')]"
                :value="priorityDisplay(nodeSelectorTerm)"
                :label="t('workload.scheduling.affinity.priority')"
                @input="changePriority(nodeSelectorTerm, idx)"
              />
            </div>
          </div>
          <div class="row">
            <RadioGroup
              :options="[false, true]"
              :labels="[t('workload.scheduling.affinity.thisPodNamespace'),t('workload.scheduling.affinity.matchExpressions.inNamespaces'),]"
              :name="`namespaces-${nodeSelectorTerm._id}`"
              :mode="mode"
              :value="!!nodeSelectorTerm.namespaces"
              @input="changeNamespaceMode(nodeSelectorTerm, idx)"
            />
          </div>
          <div class="spacer"></div>
          <div v-if="!!nodeSelectorTerm.namespaces || !!get(nodeSelectorTerm, 'podAffinityTerm.namespaces')" class="row mb-20">
            <LabeledSelect
              v-model="nodeSelectorTerm.namespaces"
              :mode="mode"
              :multiple="true"
              :taggable="true"
              :options="allNamespaces"
              :label="t('workload.scheduling.affinity.matchExpressions.inNamespaces')"
            />
          </div>
          <MatchExpressions
            :mode="mode"
            class=" col span-12"
            :type="pod"
            :value="get(nodeSelectorTerm, 'labelSelector.matchExpressions')"
            @remove="allSelectorTerms.splice(idx,1)"
            @input="e=>$set(nodeSelectorTerm.labelSelector, 'matchExpressions', e)"
          />
          <div class="spacer"></div>
          <div class="row">
            <div class="col span-12">
              <LabeledInput
                v-model="nodeSelectorTerm.topologyKey"
                :mode="mode"
                required
                :label="t('workload.scheduling.affinity.topologyKey.label')"
                :placeholder="t('workload.scheduling.affinity.topologyKey.placeholder')"
              />
            </div>
          </div>
        </InfoBox>
      </template>
      <button :disabled="isView" type="button" class="btn role-tertiary" @click="addSelector">
        {{ t('podAffinity.addLabel') }}
      </button>
    </div>
  </div>
</template>

<style>
.node-selector{
  position: relative;
}
</style>
