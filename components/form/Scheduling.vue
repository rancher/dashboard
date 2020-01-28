<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import NodeAffinity from '@/components/form/NodeAffinity';
import PodAffinity from '@/components/form/PodAffinity';
import KeyValue from '@/components/form/KeyValue';
import { mapGetters } from 'vuex';
import { isEmpty } from '@/utils/object';
import { NODE, POD } from '@/config/types';
import Tolerations from '@/components/form/Tolerations';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
    NodeAffinity,
    PodAffinity,
    KeyValue,
    Tolerations,
    LabeledInput,
    UnitInput
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
    mode: { type: String, default: 'edit' }
  },

  data() {
    const {
      affinity = {}, nodeName = '', nodeSelector = {}, tolerations
    } = this.value;
    const { nodeAffinity = {}, podAffinity = {}, podAntiAffinity = {} } = affinity;

    let selectNode = false;

    if (!this.value.affinity) {
      selectNode = true;
    }

    if (!nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
      this.$set(nodeAffinity, 'requiredDuringSchedulingIgnoredDuringExecution', { nodeSelectorTerms: [] } );
    }
    if (!nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
      this.$set(nodeAffinity, 'preferredDuringSchedulingIgnoredDuringExecution', []);
    }

    return {
      selectNode, nodeName, nodeAffinity, podAffinity, podAntiAffinity, nodeSelector, tolerations
    };
  },

  computed: {
    node() {
      return NODE;
    },

    pod() {
      return POD;
    },

    isView() {
      return this.mode === _VIEW;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    update() {
      const out = {
        ...this.value,
        tolerations: this.tolerations,
        affinity:    {
          nodeAffinity:    this.nodeAffinity,
          podAffinity:     this.podAffinity,
          podAntiAffinity: this.podAntiAffinity
        }
      };

      if (this.selectNode) {
        this.$set(out, 'nodeName', this.nodeName);
        this.$set(out, 'nodeSelector', this.nodeSelector);
      } else {
        delete out.nodeName;
        delete out.nodeSelector;
      }

      this.$emit('input', out);
    },
    isEmpty
  },
};

</script>

<template>
  <div @input="update">
    <div>
      <h3>Node Scheduling</h3>
      <h4 v-if="isView" class="mt-10 mb-10">
        {{ selectNode ? t('workload.scheduling.affinity.specificNode') : t('workload.scheduling.affinity.schedulingRules') }}
      </h4>
      <div v-else class="row">
        <RadioGroup
          v-model="selectNode"
          :options="[true,false]"
          :labels="[t('workload.scheduling.affinity.specificNode'), t('workload.scheduling.affinity.schedulingRules')]"
          :mode="mode"
        />
      </div>
      <template v-if="selectNode">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="nodeName"
              label="Node Name"
              :options="nodes"
              :mode="mode"
              option-label="id"
              :reduce="opt=>opt.id"
            />
          </div>
        </div>
        <div v-if="mode!=='view' || !isEmpty(nodeSelector)" class="row">
          <KeyValue title="Nodes with these labels" :value="nodeSelector" :mode="mode" :initial-empty-row="true" :pro-tip="false" />
        </div>
      </template>
      <template v-else>
        <NodeAffinity :type="node" :value="nodeAffinity" :mode="mode" />
      </template>
    </div>

    <div>
      <h3 class="mb-10">
        Pod Scheduling
      </h3>
      <h4 class="mb-10">
        <t k="workload.scheduling.affinity.affinityTitle" />
      </h4>
      <div class="row">
        <PodAffinity :type="pod" :value="podAffinity" :mode="mode" />
      </div>

      <h4 class="mb-10">
        <t k="workload.scheduling.affinity.antiAffinityTitle" />
      </h4>
      <div class="row">
        <PodAffinity :type="pod" :value="podAntiAffinity" :mode="mode" />
      </div>
    </div>

    <div>
      <h3 class="mb-10">
        Tolerations
      </h3>
      <div class="row">
        <Tolerations :value="value.tolerations" :mode="mode" />
      </div>
    </div>

    <div>
      <h3 class="mb-10">
        Priority
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

    <div>
      <h3 class="mb-10">
        Advanced
      </h3>
      <div class="row">
        <div class="col span-6">
          <UnitInput v-model.number="value.activeDeadlineSeconds" :mode="mode" suffix="Seconds">
            <template #label>
              <label v-tooltip="t('workload.scheduling.activeDeadlineSecondsTip')" class="label-tip">
                <t k="workload.scheduling.activeDeadlineSeconds" />
                <i class="icon icon-info" style="font-size: 12px" />
              </label>
            </template>
          </UnitInput>
        </div>
        <div class="col span-6">
          <UnitInput v-model="value.terminationGracePeriodSeconds" :mode="mode" suffix="Seconds" :label="t('workload.scheduling.terminationGracePeriodSeconds')">
            <template #label>
              <label v-tooltip="t('workload.scheduling.terminationGracePeriodSecondsTip')" class="label-tip">
                <t k="workload.scheduling.terminationGracePeriodSeconds" />
                <i class="icon icon-info" style="font-size: 12px" />
              </label>
            </template>
          </UnitInput>
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
