<script>
import { _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import { get, isEmpty, clone } from '@shell/utils/object';
import { NODE } from '@shell/config/types';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { randomStr } from '@shell/utils/string';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';

export default {
  components: {
    ArrayListGrouped, MatchExpressions, LabeledSelect
  },

  props:      {
    // value should be NodeAffinity or VolumeNodeAffinity
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
  },

  data() {
    // VolumeNodeAffinity only has 'required' field
    if (this.value.required) {
      return { nodeSelectorTerms: this.value.required.nodeSelectorTerms };
    } else {
      const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = {} } = this.value;
      const { nodeSelectorTerms = [] } = requiredDuringSchedulingIgnoredDuringExecution;
      const allSelectorTerms = [...preferredDuringSchedulingIgnoredDuringExecution, ...nodeSelectorTerms].map((term) => {
        const neu = clone(term);

        neu._id = randomStr(4);
        if (term.preference) {
          Object.assign(neu, term.preference);
          delete neu.preference;
        }

        return neu;
      });

      return {
        allSelectorTerms,
        weightedNodeSelectorTerms: preferredDuringSchedulingIgnoredDuringExecution,
        defaultWeight:             1
      };
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    isView() {
      return this.mode === _VIEW;
    },
    hasWeighted() {
      return !!this.weightedNodeSelectorTerms;
    },
    node() {
      return NODE;
    },
    affinityOptions() {
      const out = [this.t('workload.scheduling.affinity.preferred'), this.t('workload.scheduling.affinity.required')];

      return out;
    }
  },

  mounted() {
    this.update();
  },

  methods: {
    update() {
      this.$nextTick(() => {
        const out = {};
        const requiredDuringSchedulingIgnoredDuringExecution = { nodeSelectorTerms: [] };
        const preferredDuringSchedulingIgnoredDuringExecution = [] ;

        this.allSelectorTerms.forEach((term) => {
          if (term.weight) {
            const neu = { weight: 1, preference: term };

            preferredDuringSchedulingIgnoredDuringExecution.push(neu);
          } else {
            requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.push(term);
          }
        });

        if (preferredDuringSchedulingIgnoredDuringExecution.length) {
          out.preferredDuringSchedulingIgnoredDuringExecution = preferredDuringSchedulingIgnoredDuringExecution;
        }
        if (requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.length) {
          out.requiredDuringSchedulingIgnoredDuringExecution = requiredDuringSchedulingIgnoredDuringExecution;
        }
        this.$emit('input', out);
      });
    },

    changePriority(term) {
      if (term.weight) {
        this.$delete(term, 'weight');
      } else {
        this.$set(term, 'weight', 1);
      }
      this.update();
    },

    priorityDisplay(term) {
      return term.weight ? this.t('workload.scheduling.affinity.preferred') : this.t('workload.scheduling.affinity.required');
    },

    get,

    isEmpty
  }

};
</script>

<template>
  <div class="row" @input="update">
    <div class="col span-12">
      <ArrayListGrouped v-model="allSelectorTerms" class="mt-20" :mode="mode" :default-add-value="{matchExpressions:[]}" :add-label="t('workload.scheduling.affinity.addNodeSelector')">
        <template #default="props">
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                :options="affinityOptions"
                :value="priorityDisplay(props.row.value)"
                :label="t('workload.scheduling.affinity.priority')"
                :mode="mode"
                @input="(changePriority(props.row.value))"
              />
            </div>
          </div>
          <MatchExpressions
            v-model="props.row.value.matchExpressions"
            :mode="mode"
            class="col span-12 mt-20"
            :type="node"
            :show-remove="false"
          />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style>
</style>
