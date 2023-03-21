<script>
import { MACVLAN_IP_PRODUCT_NAME } from '../config/macvlan-types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {
      getStartedLink: {
        name:   `${ MACVLAN_IP_PRODUCT_NAME }-c-cluster-resource-ip`,
        params: { id: this.row.metadata.name }
      },
    };
  },

  computed: {
    totalCount() {
      return this.row?.metadata?.annotations?.macvlanipCount || 0;
    }
  }
};
</script>

<template>
  <n-link
    :to="getStartedLink"
  >
    <span v-tooltip="{ content: `<div style='font-size: 12px;line-height: 20px;'>${row.nameDisplay}<br>${t('macvlan.macvlanIp.totalCount')}：${totalCount}</div>`, html: true }">{{ row.metadata.name }}</span>
  </n-link>
</template>
