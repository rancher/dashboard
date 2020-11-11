<script>
import { _VIEW } from '@/config/query-params';
import ArrayList from '@/components/form/ArrayList';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';

export default {
  components: { ArrayList, ArrayListGrouped },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
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
    defaultAddValue() {
      return {
        apiGroups:      [],
        kinds:     []
      };
    }
  }
};
</script>

<template>
  <div class="match-kinds">
    <ArrayListGrouped
      v-model="localValue"
      class="match-kinds-list"
      :protip="false"
      add-label="Add Kind"
      :mode="mode"
      :default-add-value="defaultAddValue"
    >
      <template #default="props">
        <div class="row">
          <div class="api-groups col span-6">
            <ArrayList
              v-model="props.row.value.apiGroups"
              :protip="false"
              :show-header="true"
              value-label="ApiGroups"
              add-label="Add ApiGroup"
              value-placeholder=""
              :mode="mode"
            />
          </div>
          <div class="kinds col span-6">
            <ArrayList
              v-model="props.row.value.kinds"
              :protip="false"
              :show-header="true"
              value-label="Kinds"
              add-label="Add Kind"
              value-placeholder=""
              :mode="mode"
            />
          </div>
        </div>
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style lang="scss">
.match-kinds {
}
</style>
