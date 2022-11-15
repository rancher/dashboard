<script>
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';
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
    },
    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    const isHarvester = this.$store.getters['currentProduct'].inStore === VIRTUAL;

    let { nodeName = '' } = this.value;
    const { affinity = {}, nodeSelector = {} } = this.value;

    const { nodeAffinity = {} } = affinity;

    let selectNode = null;

    if (this.value.nodeName) {
      selectNode = 'nodeSelector';
    } else if (isHarvester && this.value?.nodeSelector?.[HOSTNAME]) {
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
  },

  watch: {
    'value.nodeSelector': {
      handler(nodeSelector) {
        if (this.isHarvester && nodeSelector?.[HOSTNAME]) {
          this.selectNode = 'nodeSelector';
          const nodeName = nodeSelector[HOSTNAME];

          this.nodeName = nodeName;

          const array = this.nodes.map(n => n.value);

          if (nodeName && !array.includes(nodeName)) {
            this.$store.dispatch('growl/error', {
              title:   this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistNode.title', { name: nodeName }),
              message: this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistNode.message')
            }, { root: true });

            delete this.value.nodeSelector;
            this.$set(this, 'nodeName', '');
            this.$set(this, 'selectNode', null);
          }
        }
      },
    },
  },
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
            :loading="loading"
            @input="update"
          />
        </div>
      </div>
    </template>
    <template v-else-if="selectNode === 'affinity'">
      <NodeAffinity
        v-model="nodeAffinity"
        :mode="mode"
        @input="update"
      />
    </template>
  </div>
</template>
