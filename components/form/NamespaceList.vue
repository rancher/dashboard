<script>
import ArrayList from '@/components/form/ArrayList';
import { sortBy } from '@/utils/sort';
import { _EDIT } from '@/config/query-params';
import { NAMESPACE } from '@/config/types';
import LabeledSelect from '@/components/form/LabeledSelect';

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
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      return sortBy(
        choices.map((obj) => {
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
  <ArrayList v-model="localValue" class="namespace-list" :mode="mode" default-add-value="default">
    <template v-slot:columns="scope">
      <td>
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
      </td>
    </template>
  </ArrayList>
</template>

<style lang="scss">
.namespace-list .fixed input {
    height: initial;
}
</style>
