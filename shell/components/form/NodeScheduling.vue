<script>
import { mapGetters } from 'vuex';
import RadioGroup from '@shell/components/form/RadioGroup';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import { NAME as VIRTUAL } from '@shell/config/product/harvester';
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';
import { HOSTNAME } from '@shell/config/labels-annotations';

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
    const isHarvester = this.$store.getters['currentProduct'].inStore === VIRTUAL;

    let { nodeName = '' } = this.value;
    const { affinity = {}, nodeSelector = {} } = this.value;

    const { nodeAffinity = {} } = affinity;

    let selectNode = null;

    if (this.value.nodeName) {
      selectNode = 'nodeSelector';
    } else if (isHarvester && this.value.nodeSelector) {
      selectNode = 'nodeSelector';
      nodeName = nodeSelector[HOSTNAME];
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
    ...mapGetters({ t: 'i18n/t' }),
    isView() {
      return this.mode === _VIEW;
    },

    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === VIRTUAL;
    },

    selectNodeOptions() {
      const prefix = this.isHarvester ? 'harvester.virtualMachine' : 'workload';
      const out = [{
        label: this.t(`${ prefix }.scheduling.affinity.anyNode`),
        value: null
      },
      {
        label: this.t(`${ prefix }.scheduling.affinity.specificNode`),
        value: 'nodeSelector'
      },
      {
        label: this.t(`${ prefix }.scheduling.affinity.schedulingRules`),
        value: 'affinity'
      }];

      return out;
    },

  },
  methods: {
    update() {
      const { nodeName, nodeSelector, nodeAffinity } = this;

      switch (this.selectNode) {
      case 'nodeSelector':
        if (this.isHarvester) {
          Object.assign(this.value, { nodeSelector: { [HOSTNAME]: nodeName } });
        } else {
          Object.assign(this.value, { nodeSelector, nodeName });
        }
        if (this.value?.affinity?.nodeAffinity) {
          delete this.value.affinity.nodeAffinity;
        }
        break;
      case 'affinity':
        delete this.value.nodeName;
        delete this.value.nodeSelector;
        if (!this.value.affinity) {
          Object.assign(this.value, { affinity: { nodeAffinity } });
        } else {
          Object.assign(this.value.affinity, { nodeAffinity });
        }
        break;
      default:
        delete this.value.nodeName;
        delete this.value.nodeSelector;
        if (this.value?.affinity?.nodeAffinity) {
          delete this.value.affinity.nodeAffinity;
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
        :options="selectNodeOptions"
        :mode="mode"
        @input="update"
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
