<script>
import { get } from '../../utils/object';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import Selectors from '@/edit/workload/Selectors';

export default {
  components: {
    RadioGroup,
    Selectors,
    LabeledSelect
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

    const required = get(nodeAffinity, 'requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms') || [];
    const preferred = get(nodeAffinity, 'preferredDuringSchedulingIgnoredDuringExecution') || [];

    let selectNode = false;

    if (nodeName.length) {
      selectNode = true;
    }

    return {
      required, preferred, selectNode, nodeName
    };
  },

  watch: {
    preferred() {
      this.update();
    },
    required() {
      this.update();
    }
  },

  methods: {
    update() {
      const out = {
        ...this.value,
        affinity: {
          nodeAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: this.preferred.map((rule) => {
              let weight = 1;

              if (!!rule.weight) {
                weight = rule.weight;
              }
              delete rule.weight;

              return { preference: { matchExpressions: [rule] }, weight };
            }),
            requiredDuringSchedulingIgnoredDuringExecution:  {
              nodeSelectorTerms: this.required.map((rule) => {
                return { matchExpressions: [rule] };
              })
            }
          }
        }

      };

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
      <div class="row">
        <div class="col span-6">
          <h5 class="mb-10">
            Require all of:
          </h5>
          <span v-if="mode==='view' && !required.length">n/a </span>
          <Selectors v-model="required" :mode="mode" />
        </div>
        <div class="col span-6">
          <h5 class="mb-10">
            Prefer any of:
          </h5>
          <span v-if="mode==='view' && !preferred.length">n/a </span>
          <Selectors v-else v-model="preferred" is-weighted :mode="mode" />
        </div>
      </div>
    </template>
  </div>
</template>
