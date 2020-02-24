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
    let preferred = get(nodeAffinity, 'preferredDuringSchedulingIgnoredDuringExecution') || [];

    preferred = preferred.map(rule => rule.preference);

    let selectNode = false;

    if (nodeName.length) {
      selectNode = true;
    }

    return {
      required, preferred, selectNode, nodeName
    };
  },
  methods: {
    update() {
      const out = {
        ...this.value,
        affinity: {
          nodeAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: this.preferred.map((rule) => {
              return { preference: { matchExpressions: rule } };
            }),
            requiredDuringSchedulingIgnoredDuringExecution:  {
              nodeSelectorTerms: this.required.map((rule) => {
                return { matchExpressions: rule };
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
    <div class="row">
      <RadioGroup v-model="selectNode" :row="true" :options="[true,false]" :labels="['Run pods on specific node', 'Choose node using scheduling rules']" :mode="mode" />
    </div>
    <div v-if="selectNode" class="row">
      <LabeledSelect v-model="nodeName" :options="nodes" :mode="mode" />
    </div>
    <template v-else>
      <div class="row">
        <!-- <div class="col span-6">
          <h5 class="mb-10">
            Require all of:
          </h5>
          <Selectors v-model="required" />
        </div> -->
        <div class="col span-6">
          <h5 class="mb-10">
            Require any of:
          </h5>
          <Selectors v-model="required" :mode="mode" />
        </div>
        <!-- </div>
      <div class="row"> -->
        <div class="col span-6">
          <h5 class="mb-10">
            Prefer any of:
          </h5>
          <Selectors v-model="preferred" :mode="mode" />
        </div>
      </div>
    </template>
  </div>
</template>
