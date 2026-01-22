<script lang="ts">
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import NodeAffinity from '@shell/components/form/NodeAffinity.vue';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';
import { HOSTNAME } from '@shell/config/labels-annotations';
import myLogger from '@shell/utils/my-logger';
import { ResourceLabeledSelectPaginateSettings, ResourceLabeledSelectSettings } from '@shell/types/components/resourceLabeledSelect';
import { NODE } from '@shell/config/types';
import { LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { KubeNode, KubeNodeTaint } from '@shell/types/resources/node';

export default {
  components: {
    RadioGroup,
    ResourceLabeledSelect,
    NodeAffinity,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
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

  data(): {
    selectNode: string | null;
    nodeName: string;
    nodeAffinity: any;
    nodeSelector: any;
    nodeSchedulingAllSettings: ResourceLabeledSelectSettings;
    nodeSchedulingPaginationSettings: ResourceLabeledSelectPaginateSettings;
    NODE: string;
    } {
    const keys = [
      `node-role.kubernetes.io/control-plane`,
      `node-role.kubernetes.io/etcd`
    ];

    const nodeSchedulingAllSettings: ResourceLabeledSelectSettings = {
      updateResources(nodes: KubeNode[]) {
        return nodes
          .filter((node) => {
            const taints = node?.spec?.taints || [];

            return taints.every((taint: KubeNodeTaint) => !keys.includes(taint.key));
          })
          .map((node) => node.id);
      },
    };
    const nodeSchedulingPaginationSettings: ResourceLabeledSelectPaginateSettings = {
      updateResources(nodes) {
        return nodes.map((node) => node.id);
      },
      requestSettings: (opts: LabelSelectPaginationFunctionOptions) => {
        const { filter } = opts.opts;
        const filters = !!filter ? [
          PaginationParamFilter.createSingleField({
            field: 'metadata.name', value: filter, exact: false
          })
        ] : [];

        // TODO: RC test once https://github.com/rancher/rancher/issues/53459 merges
        // filter=spec.taints.key!=node-role.kubernetes.io/control-plane&filter=spec.taints.key!=node-role.kubernetes.io/etcd
        // filters.push(...keys.map((k) => PaginationParamFilter.createSingleField( ({
        //   field: 'spec.taints.key', value: k, exact: true, exists: false
        // })))); // TODO: RC exact and exist --> equality PaginationFilterEquality

        opts.filters = filters;
        opts.groupByNamespace = false;
        opts.sort = [{ asc: true, field: 'metadata.name' }];

        return opts;
      }
    };

    return {
      selectNode:   null,
      nodeName:     '',
      nodeAffinity: {},
      nodeSelector: {},
      nodeSchedulingAllSettings,
      nodeSchedulingPaginationSettings,
      NODE
    };
  },

  created() {
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
      nodeAffinity['requiredDuringSchedulingIgnoredDuringExecution'] = { nodeSelectorTerms: [] };
    }
    if (!nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
      nodeAffinity['preferredDuringSchedulingIgnoredDuringExecution'] = [];
    }

    this.selectNode = selectNode;
    this.nodeName = nodeName;
    this.nodeAffinity = nodeAffinity;
    this.nodeSelector = nodeSelector;
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

      // TODO: RC fix create (button disabled)
      myLogger.warn('ns', 'update', nodeName, nodeSelector, nodeAffinity); // TODO: RC remove

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

          const array = this.nodes.map((n) => n.value); // TODO: RC nodes is an array if id's....?!

          if (nodeName && !array.includes(nodeName)) {
            this.$store.dispatch('growl/error', {
              title:   this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistNode.title', { name: nodeName }),
              message: this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistNode.message')
            }, { root: true });

            delete this.value.nodeSelector;
            this['nodeName'] = '';
            this['selectNode'] = null;
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
        v-model:value="selectNode"
        name="selectNode"
        :options="selectNodeOptions"
        :mode="mode"
        :data-testid="'node-scheduling-selectNode'"
        @update:value="update"
      />
    </div>
    <template v-if="selectNode === 'nodeSelector'">
      <div class="row">
        <div class="col span-6">
          <ResourceLabeledSelect
            v-model:value="nodeName"
            :label="t('workload.scheduling.affinity.nodeName')"
            :resource-type="NODE"
            :mode="mode"
            :multiple="false"
            :loading="loading"
            :data-testid="'node-scheduling-nodeSelector'"
            :allResourcesSettings="nodeSchedulingAllSettings"
            :paginatedResourceSettings="nodeSchedulingPaginationSettings"
            @update:value="update"
          />
        </div>
      </div>
    </template>
    <template v-else-if="selectNode === 'affinity'">
      <NodeAffinity
        v-model:value="nodeAffinity"
        :mode="mode"
        :data-testid="'node-scheduling-nodeAffinity'"
        @update:value="update"
      />
    </template>
  </div>
</template>
