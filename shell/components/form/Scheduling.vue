<script>
import { mapGetters } from 'vuex';
import { isEmpty, get } from '@shell/utils/object';
import Tolerations from '@shell/components/form/Tolerations';
import LabeledInput from '@shell/components/form/LabeledInput';
import { _VIEW } from '@shell/config/query-params';
import PodScheduling from '@shell/components/form/PodScheduling';
import NodeScheduling from '@shell/components/form/NodeScheduling';

export default {
  components: {
    Tolerations,
    LabeledInput,
    PodScheduling,
    NodeScheduling
  },

  props:      {
    value: {
      type:     Object,
      required: true
    },
    nodes: {
      type:    Array,
      default: () => []
    },
    mode: { type: String, default: 'edit' },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    // hide affinity/anti-affinity sections on view mode if no selectors are defined
    hasPodAffinity() {
      const hasRequired = !!(get(this.podAffinity, 'requiredDuringSchedulingIgnoredDuringExecution') || []).length;
      const hasPrefered = !!(get(this.podAffinity, 'preferredDuringSchedulingIgnoredDuringExecution') || []).length;

      return (hasRequired || hasPrefered);
    },

    hasPodAntiAffinity() {
      const hasRequired = !!(get(this.podAntiAffinity, 'requiredDuringSchedulingIgnoredDuringExecution') || []).length;
      const hasPrefered = !!(get(this.podAntiAffinity, 'preferredDuringSchedulingIgnoredDuringExecution') || []).length;

      return (hasRequired || hasPrefered);
    },

    hasPodScheduling() {
      return this.hasPodAffinity || this.hasPodAntiAffinity;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: { isEmpty },
};

</script>

<template>
  <div>
    <NodeScheduling :value="value" :mode="mode" :nodes="nodes" />

    <div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.podScheduling" />
      </h3>

      <template v-if="!isView || hasPodScheduling">
        <PodScheduling :value="value" :mode="mode" />
      </template>

      <template v-else>
        <div class="row">
          <t k="workload.scheduling.affinity.noPodRules" />
        </div>
      </template>
    </div>
    <div class="spacer"></div>

    <div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.tolerations" />
      </h3>
      <div class="row">
        <Tolerations v-model="value.tolerations" :mode="mode" />
      </div>
    </div>
    <div class="spacer"></div>

    <div>
      <div class="spacer"></div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.priority" />
      </h3>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model.number="value.priority" :mode="mode" :label="t('workload.scheduling.priority.priority')" />
        </div>

        <div class="col span-6">
          <LabeledInput v-model="value.priorityClassname" :mode="mode" :label="t('workload.scheduling.priority.className')" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' >
  .label-tip {
    z-index: z-index('overContent')+1 !important;
  }
</style>
