<template>
  <div class="filter">
    <v-select
      v-model="value"
      multiple
      placeholder="All User Namespaces"
      :options="namespaces"
      label="label"
      :reduce="obj => obj.id"
    />
  </div>
</template>

<script>
import { NAMESPACES } from '@/store/prefs';
import { NAMESPACE } from '@/config/types';
import { sortBy } from '@/utils/sort';

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
      let choices = this.$store.getters['cluster/all'](NAMESPACE);

      choices = sortBy(choices, ['isSystem', 'nameDisplay']);

      return choices.map((obj) => {
        return {
          id:    obj.id,
          label: (obj.isSystem ? `(${ obj.nameDisplay })` : obj.nameDisplay),
        };
      });
    }
  },
};

</script>

<style type="scss" scoped>
  .filter >>> .v-select {
    max-width: 100%;
    display: inline-block;
  }

  .filter >>> .v-select .vs__selected {
    margin: 2px;
    user-select: none;
    cursor: default;
  }

  .filter >>> INPUT {
    width: auto;
    background-color: transparent;
  }
</style>
