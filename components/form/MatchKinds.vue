<script>
import ArrayList from '@/components/form/ArrayList';
import { _VIEW } from '@/config/query-params';

export default {
  components: { ArrayList },

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
    <ArrayList
      v-model="localValue"
      class="match-kinds-list"
      :protip="false"
      add-label="Add Kind"
      :mode="mode"
      :default-add-value="defaultAddValue"
    >
      <template v-slot:columns="scope">
        <div class="api-groups">
          <ArrayList
            v-model="scope.row.value.apiGroups"
            class="api-groups-list"
            :protip="false"
            :show-header="true"
            value-label="ApiGroups"
            add-label="Add ApiGroup"
            value-placeholder=""
            :mode="mode"
          />
        </div>
        <div class="kinds">
          <ArrayList
            v-model="scope.row.value.kinds"
            class="kinds-list"
            :protip="false"
            :show-header="true"
            value-label="Kinds"
            add-label="Add Kind"
            value-placeholder=""
            :mode="mode"
          />
        </div>
      </template>
      <template v-slot:remove-button="scope">
        <button class="btn role-link close" @click="scope.remove">
          <i class="icon icon-2x icon-x" />
        </button>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss">
.match-kinds {
  .api-groups,
  .kinds {
    vertical-align: top;
    flex: 1;
  }

  .match-kinds-list > table {
    border-collapse: separate;
    border-spacing: 0px 15px;

    & > tbody > tr {
      background: var(--default);
      border: 1px solid var(--tabbed-border);
      border-radius: var(--border-radius);
      padding: 40px;

      &:not(:last-of-type) > td {
        vertical-align: top;
        padding-bottom: 10px;
        border-radius: var(--border-radius);
        border-bottom: 1px solid var(--border);
      }

      & > td.remove {
        vertical-align: top;
      }
    }
  }
}
</style>
