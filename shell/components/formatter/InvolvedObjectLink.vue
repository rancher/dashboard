<script>

import LinkName from '@shell/components/formatter/LinkName.vue';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export default {
  components: { LinkName },

  props: {
    value: {
      type:     null,
      required: true
    },
    product: {
      type:    String,
      default: EXPLORER,
    }
  },

  computed: {
    kind() {
      const versionParts = this.value.apiVersion.split('/');

      if (versionParts.length === 1) {
        return this.value.kind.toLowerCase();
      }

      return `${ versionParts[0] }.${ this.value.kind.toLowerCase() }`;
    }
  }
};
</script>

<template>
  <span v-if="value.kind && value.name">
    <LinkName
      :type="kind"
      :value="`${value.kind} ${value.name}`"
      :object-id="value.name"
      :namespace="value.namespace"
      :product="product"
      :show-type="true"
    />
  </span>
</template>
