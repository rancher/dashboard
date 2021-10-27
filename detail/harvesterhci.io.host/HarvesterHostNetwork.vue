<script>
export default {
  name: 'HarvesterHostNetwork',

  components: {},

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {},

  methods: {}
};
</script>

<template>
  <h3>Network</h3>
</template>

<style lang="scss" scoped>
#host-instances {
  ::v-deep thead th {
    vertical-align: middle;
  }

  ::v-deep .state {
    display: flex;

    .vmstate {
      margin-right: 6px;
    }
  }
}
</style>
