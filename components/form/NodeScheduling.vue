<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import KeyValue from '@/components/form/KeyValue';
import NodeAffinity from '@/components/form/NodeAffinity';
import { _VIEW } from '@/config/query-params';
import { isEmpty } from '@/utils/object';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
    KeyValue,
    NodeAffinity,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    nodes: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    const { affinity = {}, nodeName = '', nodeSelector = {} } = this.value;
    const { nodeAffinity = {} } = affinity;

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
      selectNode, nodeName, nodeAffinity, nodeSelector
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },
  methods: {
    update() {
      const { nodeName, nodeSelector, nodeAffinity } = this;

      if (!this.value.affinity) {
        Object.assign(this.value, { affinity: nodeAffinity });
      } else {
        Object.assign(this.value.affinity, { nodeAffinity });
      }
      if (this.selectNode) {
        Object.assign(this.value, { nodeSelector, nodeName });
      } else {
        delete this.value.nodeName;
        delete this.value.nodeSelector;
      }
    },
    isEmpty
  }
};
</script>

<template>
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
      <NodeAffinity v-model="nodeAffinity" :mode="mode" @input="update" />
    </template>
  </div>
</template>
