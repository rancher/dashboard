<script>
import ArrayList from '@/components/form/ArrayList';
import { sortBy } from '@/utils/sort';
import { _EDIT } from '@/config/query-params';
import { NAMESPACE } from '@/config/types';
import LabeledSelect from '@/components/form/LabeledSelect';

export const NAMESPACE_FILTERS = {
  nonSystem(namespace) {
    return !namespace.isSystem;
  }
};

export default {
  components: {
    ArrayList,
    LabeledSelect
  },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    namespaceFilter: {
      type:    Function,
      default: namespace => true
    }
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('input', localValue);
      }
    },
    namespaceOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const choices = this.$store.getters[`${ inStore }/all`](NAMESPACE);

      return sortBy(
        choices
          .filter(this.namespaceFilter)
          .map((obj) => {
            return {
              label: obj.nameDisplay,
              value: obj.id
            };
          }),
        'label'
      );
    }
  }
};
</script>

<template>
  <ArrayList v-model="localValue" class="namespace-list" :mode="mode" default-add-value="default" :protip="false">
    <template v-slot:columns="scope">
      <div class="input-container">
        <LabeledSelect
          :mode="mode"
          :value="scope.row.value"
          :options="namespaceOptions"
          label="Namespace"
          add-label="Add Namespace"
          @input="scope.row.value = $event; scope.queueUpdate()"
        />
      </div>
    </template>
  </ArrayList>
</template>

<style lang="scss">
.namespace-list {
  .fixed input {
    height: initial;
  }

  .input-container {
    flex: 1;
  }
}
</style>
