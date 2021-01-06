<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import NodeAffinity from '@/components/form/NodeAffinity';
import { _VIEW } from '@/config/query-params';
import { isEmpty } from '@/utils/object';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
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

    let selectNode = null;

    if (this.value.nodeName) {
      selectNode = 'nodeSelector';
    } else if (!isEmpty(nodeAffinity)) {
      selectNode = 'affinity';
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
    },

  },
  methods: {
    update() {
      const { nodeName, nodeSelector, nodeAffinity } = this;

      if (this.selectNode === 'nodeSelector') {
        Object.assign(this.value, { nodeSelector, nodeName });
      } else {
        delete this.value.nodeName;
        delete this.value.nodeSelector;
        if (!this.value.affinity) {
          Object.assign(this.value, { affinity: { nodeAffinity } });
        } else {
          Object.assign(this.value.affinity, { nodeAffinity });
        }
      }
    },
    isEmpty
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <RadioGroup
        v-model="selectNode"
        name="selectNode"
        :options="[null, 'nodeSelector', 'affinity']"
        :labels="[ t('workload.scheduling.affinity.anyNode'), t('workload.scheduling.affinity.specificNode'), t('workload.scheduling.affinity.schedulingRules') ]"
        :mode="mode"
      />
    </div>
    <template v-if="selectNode === 'nodeSelector'">
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="nodeName"
            :label="t('workload.scheduling.affinity.nodeName')"
            :options="nodes || []"
            :mode="mode"
            :multiple="false"
            @input="update"
          />
        </div>
      </div>
    </template>
    <template v-else-if="selectNode === 'affinity'">
      <NodeAffinity v-model="nodeAffinity" :mode="mode" @input="update" />
    </template>
  </div>
</template>
