<script>
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';

import { isEmpty } from '@shell/utils/object';
import { HOSTNAME, HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  components: {
    RadioGroup,
    LabeledSelect,
    KeyValue,
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
    const { nodeSelector = {} } = this.value;

    let selectNode = 'all';
    let nodeName = '';

    if (nodeSelector[HOSTNAME] && Object.keys(nodeSelector).length === 1) {
      selectNode = 'nodeSelector';
      nodeName = nodeSelector[HOSTNAME];
    } else if (Object.keys(nodeSelector).length > 0) {
      selectNode = 'custom';
    }

    return {
      selectNode,
      nodeName,
      nodeSelector,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    selectNodeOptions() {
      const out = [{
        label: this.t(`harvester.vlanConfig.scheduling.affinity.allNodes`),
        value: 'all'
      },
      {
        label: this.t(`harvester.vlanConfig.scheduling.affinity.specificNode`),
        value: 'nodeSelector'
      },
      {
        label: this.t(`harvester.vlanConfig.scheduling.affinity.schedulingRules`),
        value: 'custom'
      }];

      return out;
    },
  },

  methods: {
    update() {
      const { nodeName, nodeSelector } = this;

      switch (this.selectNode) {
      case 'all':
        delete this.value?.nodeSelector;

        Object.assign(this.value, { nodeSelector: { [HCI_LABELS_ANNOTATIONS.MANAGED]: 'true' } });

        break;
      case 'nodeSelector':
        delete this.value?.nodeSelector;

        Object.assign(this.value, { nodeSelector: { [HOSTNAME]: nodeName } });
        break;
      case 'custom':
        delete this.value.nodeName;
        delete this.value.nodeSelector;

        Object.assign(this.value, { nodeSelector });
        break;
      default:
        delete this.value.nodeSelector;
      }
    },
    isEmpty
  },
};
</script>

<template>
  <div>
    <div class="row">
      <RadioGroup
        v-model="selectNode"
        name="selectNode"
        :options="selectNodeOptions"
        :mode="mode"
        @input="update"
      />
    </div>
    <template v-if="selectNode === 'nodeSelector'">
      <div class="row mb-10">
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
    <template v-else-if="selectNode === 'custom'">
      <KeyValue
        v-model="nodeSelector"
        :key-label="t('generic.key')"
        :mode="mode"
        :add-label="t('workload.scheduling.affinity.addNodeSelector')"
        :read-allowed="false"
        :value-label="t('generic.value')"
        :initial-empty-row="true"
        @input="update"
      />
    </template>
  </div>
</template>
