<script>
import Link from '@shell/components/formatter/Link';
import Shortened from '@shell/components/formatter/Shortened';

export default {
  name: 'FleetRepo',

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
  <Link
    :row="row"
    :value="row.spec.repo || ''"
    label-key="repoDisplay"
    before-icon-key="repoIcon"
    url-key="spec.repo"
  />
  {{ row.cluster }}
  <template v-if="row.commitDisplay">
    <div class="text-muted">
      <Shortened
        long-value-key="status.commit"
        :row="row"
        :value="row.commitDisplay"
      />
    </div>
  </template>
</template>
