<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import NodeAffinity from '@/components/form/NodeAffinity';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
    NodeAffinity
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
    const { affinity = {}, nodeName = '' } = this.value;
    const { nodeAffinity = {} } = affinity;

    if (!nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
      this.$set(nodeAffinity, 'requiredDuringSchedulingIgnoredDuringExecution', { nodeSelectorTerms: [] } );
    }
    if (!nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
      this.$set(nodeAffinity, 'preferredDuringSchedulingIgnoredDuringExecution', []);
    }
    let selectNode = false;

    if (nodeName.length) {
      selectNode = true;
    }

    return {
      selectNode, nodeName, nodeAffinity
    };
  },

  methods: {
    update() {
      const out = { ...this.value, affinity: { nodeAffinity: this.nodeAffinity } };

      if (this.selectNode) {
        this.$set(out, 'nodeName', this.nodeName);
      } else {
        delete out.nodeName;
      }

      this.$emit('input', out);
    }
  }
};

</script>

<template>
  <div @input="update">
    <h5>Node Scheduling</h5>
    <div class="row">
      <RadioGroup v-model="selectNode" :options="[true,false]" :labels="['Run pods on specific node', 'Choose node using scheduling rules']" :mode="mode" />
    </div>
    <div v-if="selectNode" class="row">
      <LabeledSelect v-model="nodeName" :options="nodes" :mode="mode" />
    </div>
    <template v-else>
      <NodeAffinity v-model="nodeAffinity" :mode="mode">
        <template #title>
          <h5 class="mb-10">
            Require all of:
          </h5>
        </template>
        <template #title-weighted>
          <h5 class="mb-10">
            Prefer any of:
          </h5>
        </template>
      </NodeAffinity>
    </template>
  </div>
</template>
