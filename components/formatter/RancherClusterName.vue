<script>
import LinkDetail from '@/components/formatter/LinkDetail';

export default {
  components: { LinkDetail },
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    reference: {
      type:    String,
      default: null,
    }
  },
  computed: {
    inactiveNodes() {
      return this.row.inactiveNodes.map(n => n.nameDisplay);
    }
  }
};
</script>

<template>
  <span class="rancher-cluster-name">
    <v-popover v-if="inactiveNodes.length > 0" placement="top" trigger="hover" popover-class="tooltip-popover">
      <i class="icon icon-alert text-error" />
      <template slot="popover" class="floof">
        <div v-for="node in inactiveNodes" :key="node">
          {{ t('rancherClusterName.tooltip', { node }) }}
        </div>
      </template>
    </v-popover>
    <LinkDetail :value="value" :row="row" :reference="reference" />
  </span>
</template>

<style lang='scss' scoped>
.rancher-cluster-name {
    display: inline-flex;
    flex-direction: row;
    align-items: center;

    .text-error {
        margin-top: 4px;
        margin-right: 2px;
    }
}
</style>
