<script>
export default {
  props: {
    value: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    const { hostPort = '', protocol = '' } = this.value[0] || {};

    return { hostPort, protocol };
  }
};
</script>

<template>
  <div v-if="hostPort">
    {{ hostPort+'/'+protocol }}
  </div>
  <div v-else>
    —
  </div>
</template>
