<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import NodeAffinity from '@/components/form/NodeAffinity';
import PodAffinity from '@/components/form/PodAffinity';
import KeyValue from '@/components/form/KeyValue';
import { mapGetters } from 'vuex';
import { isEmpty, cleanUp, get } from '@/utils/object';
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
    mode: { type: String, default: 'edit' },
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

      this.$emit('input', cleanUp(out));
    },
    isEmpty
  },
};

</script>

<template>
  <div @input="update">
    <div>
      <h3><t k="workload.scheduling.titles.nodeScheduling" /></h3>
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
              :label="t('workload.scheduling.affinity.nodeName')"
              :options="nodes"
              :mode="mode"
              option-label="id"
              :reduce="opt=>opt.id"
            />
          </div>
        </div>

        <div class="spacer" />

        <div v-if="mode!=='view' || !isEmpty(nodeSelector)" class="row">
          <KeyValue
            title="Nodes with these labels"
            :value="nodeSelector"
            :mode="mode"
            :initial-empty-row="true"
            :pro-tip="false"
          >
            <template #title>
              <h4>{{ t('workload.scheduling.titles.nodeSelector') }}</h4>
            </template>
          </KeyValue>
        </div>
      </template>
      <template v-else>
        <NodeAffinity v-model="nodeAffinity" :type="node" :mode="mode" @input="update" />
      </template>
    </div>

    <div class="spacer" />

    <div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.podScheduling" />
      </h3>

      <template v-if="!isView || hasPodScheduling">
        <template v-if="!isView || hasPodAffinity">
          <h4 class="mb-10">
            <t k="workload.scheduling.affinity.affinityTitle" />
          </h4>
          <PodAffinity v-model="podAffinity" :type="pod" :mode="mode" />
        </template>

        <div class="spacer" />

        <template v-if="!isView || hasPodAntiAffinity">
          <h4 class="mb-10">
            <t k="workload.scheduling.affinity.antiAffinityTitle" />
          </h4>
          <PodAffinity v-model="podAntiAffinity" :type="pod" :mode="mode" />
        </template>
      </template>

      <template v-else>
        <div class="row">
          <t k="workload.scheduling.affinity.noPodRules" />
        </div>
      </template>
    </div>

    <div class="spacer" />

    <div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.tolerations" />
      </h3>
      <div class="row">
        <Tolerations :value="value.tolerations" :mode="mode" />
      </div>
    </div>

    <div class="spacer" />

    <div>
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

    <div class="spacer" />

    <div>
      <h3 class="mb-10">
        <t k="workload.scheduling.titles.advanced" />
      </h3>
      <div class="row">
        <div class="col span-6">
          <UnitInput v-model.number="value.activeDeadlineSeconds" :label="t('workload.scheduling.activeDeadlineSeconds')" :mode="mode" suffix="Seconds">
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
