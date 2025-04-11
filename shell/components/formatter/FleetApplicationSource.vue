<script>
import Link from '@shell/components/formatter/Link';
import Shortened from '@shell/components/formatter/Shortened';

export default {
  name: 'FleetApplicationSource',

  components: {
    Link,
    Shortened,
  },

  props: {
    value: {
      type:    String,
      default: ''
    },

    row: {
      type:     Object,
      required: true
    },

    col: {
      type:    Object,
      default: () => {}
    },

    rowKey: {
      type:    String,
      default: '',
    },

    getCustomDetailLink: {
      type:    Function,
      default: null
    },

  },
};
</script>

<template>
  <Link
    label-key="source.display"
    before-icon-key="source.icon"
    url-key="source.value"
    :row="row"
    :value="row.source.value"
  />
  {{ row.cluster }}
  <template v-if="row.sourceSub.value">
    <div class="text-muted">
      <Shortened
        long-value-key="sourceSub.value"
        :row="row"
        :value="row.sourceSub.display"
      />
    </div>
  </template>
</template>
