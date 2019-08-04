<script>
import { SOME, NONE } from './selection';
import { qpFor } from './query';

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
    defaultSortBy: {
      type:    String,
      default: ''
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
    howMuchSelected: {
      type:     String,
      required: true,
    },
    checkWidth: {
      type:     Number,
      default:  40,
    },
    rowActionsWidth: {
      type:     Number,
      required: true
    }
  },

  computed: {
    isAll: {
      get() {
        return this.howMuchSelected !== NONE;
      },

      set(value) {
        this.$emit('on-toggle-all', value);
      }
    },

    isIndeterminate() {
      return this.howMuchSelected === SOME;
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

    isCurrent(col) {
      return col.name === this.sortBy;
    },

    queryFor(col) {
      const query = qpFor(this.$route.query, {
        _defaultSortBy: this.defaultSortBy,
        sort:           col.name,
        desc:           this.isCurrent(col) && !this.descending,
      });

      return query;
    }
  }
};
</script>

<template>
  <thead>
    <tr>
      <th v-if="tableActions" :width="checkWidth">
        <input
          class="check"
          type="checkbox"
          :checked="isAll"
          :indeterminate.prop="isIndeterminate"
        />
      </th>
      <th
        v-for="col in columns"
        :key="col.name"
        align="left"
        :class="{ sortable: col.sort }"
        @click.prevent="changeSort($event, col)"
      >
        <nuxt-link :to="{query: queryFor(col)}">
          {{ col.label }}
          <span v-if="col.sort" class="icon-stack">
            <i class="icon icon-sort icon-stack-1x faded" />
            <i v-if="isCurrent(col) && !descending" class="icon icon-sort-down icon-stack-1x" />
            <i v-if="isCurrent(col) && descending" class="icon icon-sort-up icon-stack-1x" />
          </span>
        </nuxt-link>
      </th>
      <th v-if="rowActions" :width="rowActionsWidth">
      </th>
    </tr>
  </thead>
</template>
