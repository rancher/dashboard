<script>
import { mapGetters } from 'vuex';

export default {
  name:     'Dashboard',
  computed: { ...mapGetters({ someElementalState: 'elemental/someElementalState' }) },
  methods:  {
    toggleState() {
      this.$store.dispatch('elemental/elementalStateChange', { val: !this.someElementalState });
    }
  },
};
</script>

<template>
  <div>
    <h1>OS ELEMENTAL!!! {{ someElementalState }}</h1>
    <button type="button" @click="toggleState">
      TOGGLE STATE
    </button>
  </div>
</template>

<style lang="scss" scoped>

</style>
