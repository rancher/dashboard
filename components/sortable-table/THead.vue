<script>
export const ALL = 'all';
export const SOME = 'some';
export const NONE = 'none';

export default {
  props: {
    columns: {
      type:     Array,
      required: true
    },
    sortBy: {
      type:     String,
      required: true
    },
    descending: {
      type:     Boolean,
      required: true
    },
    tableActions: {
      type:     Boolean,
      required: true,
    },
    rowActions: {
      type:     Boolean,
      required: true,
    },
    selection: {
      type:     String,
      required: true,
    },
    checkWidth: {
      type:     Number,
      required: true
    },
    rowActionsWidth: {
      type:     Number,
      required: true
    }
  },

  computed: {
    isAll() {
      return this.selection !== NONE;
    },

    isIndeterminate() {
      return this.selection === SOME;
    }
  },

  methods: {
    changeSort(e, col) {
      if ( !col.sort ) {
        return;
      }

      let desc = false;

      if ( this.sortBy === col.name ) {
        desc = !this.descending;
      }

      this.$emit('on-sort-change', col.name, desc);
    },
  }
};
</script>

<template>
  <thead>
    <tr>
      <th v-if="tableActions" :width="checkWidth">
        <input
          type="checkbox"
          :checked="isAll"
          :indeterminate.prop="isIndeterminate"
        />
      </th>
      <th
        v-for="col in columns"
        :key="col.name"
        align="left"
        @click.prevent="changeSort($event, col)"
      >
        {{ col.label }}
      </th>
      <th v-if="rowActions" :width="rowActionsWidth">
      </th>
    </tr>
    <tr>
      <td colspan="11">
        {{ sortBy }} -- {{ descending }}
      </td>
    </tr>
  </thead>
</template>
