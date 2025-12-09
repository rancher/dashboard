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
    }
  },
};
</script>

<template>
  <template v-if="row.source.value">
    <Link
      v-if="row.source.showLink"
      class="source-link"
      label-key="source.display"
      before-icon-key="source.icon"
      url-key="source.value"
      :row="row"
      :value="row.source.value"
    />
    <span v-else>
      {{ row.source.value }}
    </span>
    <div
      v-if="row.sourceSub.value"
      class="text-label"
    >
      <Shortened
        long-value-key="sourceSub.value"
        :row="row"
        :value="row.sourceSub.display"
      />
    </div>
  </template>
  <div
    v-else
    class="text-muted"
  >
    &mdash;
  </div>
</template>

<style lang="scss" scoped>
  .source-link {
    width: fit-content;
  }
</style>
