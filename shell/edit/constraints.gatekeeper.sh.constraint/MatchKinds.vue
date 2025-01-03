<script>
import { _VIEW } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';

export default {
  emits: ['update:value'],

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

  data() {
    return {
      defaultAddValue: {
        apiGroups: [],
        kinds:     []
      }
    };
  }
};
</script>

<template>
  <div class="match-kinds">
    <ArrayListGrouped
      :value="value"
      class="match-kinds-list"
      :protip="false"
      add-label="Add Rule"
      :mode="mode"
      :default-add-value="defaultAddValue"
      @update:value="(e) => $emit('update:value', e)"
    >
      <template #default="props">
        <div class="row">
          <div class="api-groups col span-6">
            <ArrayList
              v-model:value="props.row.value.apiGroups"
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
              v-model:value="props.row.value.kinds"
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
