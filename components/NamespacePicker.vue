<template>
  <div class="picker">
    <v-select
      v-model="value"
      multiple
      placeholder="Filter by Namespace"
      :options="namespaces"
      label="label"
      :reduce="obj => obj.id"
    />
  </div>
</template>

<script>
import { NAMESPACES } from '@/store/prefs';
import { NAMESPACE } from '@/utils/types';

export default {
  computed: {
    value: {
      get() {
        const value = this.$store.getters['prefs/get'](NAMESPACES);

        return value || [];
      },

      set(neu) {
        this.$store.dispatch('switchNamespaces', neu);
      }
    },

    namespaces() {
      const choices = this.$store.getters['v1/all'](NAMESPACE);

      return choices.map((obj) => {
        return {
          id:    obj.id,
          label: obj.displayName,
        };
      });
    }
  },
};

</script>

<style type="scss" scoped>
  .picker >>> INPUT {
    width: auto;
    padding: 0;
  }
</style>
