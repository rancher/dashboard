<script>
export default {
  props: {
    value: {
      type:     Array,
      default: () => {
        return [];
      }
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },
  computed: {
    to() {
      return this.value[0].to
        ? this.value[0].to[0] : this.value[0].redirect;
    },
    remaining() {
      return this.value[0].to
        ? this.value[0].to.length - 1 : 0;
    }
  }
};
</script>

<template>
  <span v-if="to">
    <span v-if="!value[0].redirect">{{ to.app }}{{ to.version ?`(${to.version}):` : '' }}{{ to.port }}</span>
    <span v-else>
      <span v-for="(string,key) in to" :key="string">
        {{ key }}: {{ string }}
      </span>
    </span>
    <br />
    <span v-if="remaining > 0" class="plus-more">+{{ remaining }} more</span>
  </span>
</template>

<style lang='scss'>
  .col-router-destination {
    color: var(--input-label)
  }
</style>
