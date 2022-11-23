<script>
import { Checkbox } from '@components/Form/Checkbox';
import { SOME, NONE } from './selection';
import { AUTO, CENTER, fitOnScreen } from '@shell/utils/position';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: { Checkbox, LabeledSelect },
  props:      {
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
    group: {
      type:    String,
      default: ''
    },
    groupOptions: {
      type:    Array,
      default: () => []
    },
    descending: {
      type:     Boolean,
      required: true
    },
    hasAdvancedFiltering: {
      type:     Boolean,
      required: false
    },
    tableColsOptions: {
      type:    Array,
      default: () => [],
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
      type:    Number,
      default: 30,
    },
    rowActionsWidth: {
      type:     Number,
      required: true
    },
    subExpandColumn: {
      type:    Boolean,
      default: false,
    },
    expandWidth: {
      type:    Number,
      default: 30,
    },
    labelFor: {
      type:     Function,
      required: true,
    },
    noRows: {
      type:    Boolean,
      default: true,
    },
    noResults: {
      type:    Boolean,
      default: true,
    },
    loading: {
      type:     Boolean,
      required: false,
    },
  },

  data() {
    return {
      tableColsOptionsVisibility: false,
      tableColsMenuPosition:      null
    };
  },

  watch: {
    advancedFilteringValues() {
      // passing different dummy args to make sure update is triggered
      this.watcherUpdateLiveAndDelayed(true, false);
    },
    tableColsOptionsVisibility(neu) {
      if (neu) {
        // check if user clicked outside the table cols options box
        window.addEventListener('click', this.onClickOutside);

        // update filtering options and toggable cols every time dropdown is open
        this.$emit('update-cols-options');
      } else {
        // unregister click event
        window.removeEventListener('click', this.onClickOutside);
      }
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
    hasAdvGrouping() {
      return this.group?.length && this.groupOptions?.length;
    },
    advGroup: {
      get() {
        return this.group || this.advGroup;
      },

      set(val) {
        this.$emit('group-value-change', val);
      }
    },

    isIndeterminate() {
      return this.howMuchSelected === SOME;
    },
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

    tableColsOptionsClick(ev) {
      // set menu position
      const menu = document.querySelector('.table-options-container');
      const elem = document.querySelector('.table-options-btn');

      if (!this.tableColsMenuPosition) {
        this.tableColsMenuPosition = fitOnScreen(menu, ev || elem, {
          overlapX:  true,
          fudgeX:    26,
          fudgeY:    -22,
          positionX: CENTER,
          positionY: AUTO,
        });
      }

      // toggle visibility
      this.tableColsOptionsVisibility = !this.tableColsOptionsVisibility;
    },

    onClickOutside(event) {
      const tableOpts = this.$refs['table-options'];

      if (!tableOpts || tableOpts.contains(event.target)) {
        return;
      }
      this.tableColsOptionsVisibility = false;
    },

    tableOptionsCheckbox(value, label) {
      this.$emit('col-visibility-change', {
        label,
        value
      });
    },
  }

};
</script>

<template>
  <thead>
    <tr :class="{'loading': loading}">
      <th
        v-if="tableActions"
        :width="checkWidth"
        align="middle"
      >
        <Checkbox
          v-model="isAll"
          class="check"
          :indeterminate="isIndeterminate"
          :disabled="noRows || noResults"
        />
      </th>
      <th
        v-if="subExpandColumn"
        :width="expandWidth"
      />
      <th
        v-for="col in columns"
        v-show="!hasAdvancedFiltering || (hasAdvancedFiltering && col.isColVisible)"
        :key="col.name"
        :align="col.align || 'left'"
        :width="col.width"
        :class="{ sortable: col.sort, [col.breakpoint]: !!col.breakpoint}"
        @click.prevent="changeSort($event, col)"
      >
        <div
          class="table-header-container"
          :class="{ 'not-filterable': hasAdvancedFiltering && !col.isFilter }"
        >
          <span
            v-if="col.sort"
            v-tooltip="col.tooltip"
          >
            <span v-html="labelFor(col)" />
            <i
              v-show="hasAdvancedFiltering && !col.isFilter"
              v-tooltip="t('sortableTable.tableHeader.noFilter')"
              class="icon icon-info not-filter-icon"
            />
            <span class="icon-stack">
              <i class="icon icon-sort icon-stack-1x faded" />
              <i
                v-if="isCurrent(col) && !descending"
                class="icon icon-sort-down icon-stack-1x"
              />
              <i
                v-if="isCurrent(col) && descending"
                class="icon icon-sort-up icon-stack-1x"
              />
            </span>
          </span>
          <span
            v-else
            v-tooltip="col.tooltip"
          >{{ labelFor(col) }}</span>
        </div>
      </th>
      <th
        v-if="rowActions && hasAdvancedFiltering && tableColsOptions.length"
        :width="rowActionsWidth"
      >
        <div
          ref="table-options"
          class="table-options-group"
        >
          <button
            aria-haspopup="true"
            aria-expanded="false"
            type="button"
            class="btn btn-sm role-multi-action table-options-btn"
            @click="tableColsOptionsClick"
          >
            <i class="icon icon-actions" />
          </button>
          <div
            v-show="tableColsOptionsVisibility"
            class="table-options-container"
            :style="tableColsMenuPosition"
          >
            <div
              v-if="hasAdvGrouping"
              class="table-options-grouping"
            >
              <span class="table-options-col-subtitle">{{ t('sortableTable.tableHeader.groupBy') }}:</span>
              <LabeledSelect
                v-model="advGroup"
                class="table-options-grouping-select"
                :clearable="true"
                :options="groupOptions"
                :disabled="false"
                :searchable="false"
                mode="edit"
                :multiple="false"
                :taggable="false"
              />
            </div>
            <p class="table-options-col-subtitle mb-20">
              {{ t('sortableTable.tableHeader.show') }}:
            </p>
            <ul>
              <li
                v-for="(col, index) in tableColsOptions"
                v-show="col.isTableOption"
                :key="index"
                :class="{ 'visible': !col.preventColToggle }"
              >
                <Checkbox
                  v-show="!col.preventColToggle"
                  v-model="col.isColVisible"
                  class="table-options-checkbox"
                  :label="col.label"
                  @input="tableOptionsCheckbox($event, col.label)"
                />
              </li>
            </ul>
          </div>
        </div>
      </th>
      <th
        v-else-if="rowActions"
        :width="rowActionsWidth"
      />
    </tr>
  </thead>
</template>

  <style lang="scss" scoped>
    .table-options-group {

      .table-options-btn.role-multi-action {
        background-color: transparent;
        border: none;
        font-size: 18px;
        &:hover, &:focus {
          background-color: var(--accent-btn);
          box-shadow: none;
        }
      }
      .table-options-container {
        width: 320px;
        border: 1px solid var(--primary);
        background-color: var(--body-bg);
        padding: 20px;
        z-index: 1;

        .table-options-grouping {
          display: flex;
          align-items: center;
          margin-bottom: 20px;

          span {
            white-space: nowrap;
            margin-right: 10px;
          }
        }

        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;

          li {
            flex: 1 1 136px;
            margin: 0;
            padding: 0;

            &.visible {
              margin: 0 0 10px 0;
            }
          }
        }
      }
    }

    .sortable > SPAN {
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      &:hover,
      &:active {
        text-decoration: underline;
        color: var(--body-text);
      }
    }

    thead {
      tr {
        background-color: var(--sortable-table-header-bg);
        color: var(--body-text);
        text-align: left;

        &:not(.loading) {
          border-bottom: 1px solid var(--sortable-table-top-divider);
        }
      }
    }

    th {
      padding: 8px 5px;
      font-weight: normal;
      border: 0;
      color: var(--body-text);

      .table-header-container {
        display: flex;
        align-items: center;

        > span {
          display: contents;
        }

        &.not-filterable {
          margin-top: -2px;

          .icon-stack {
            margin-top: -2px;
          }
        }

        .not-filter-icon {
          font-size: 16px;
          color: var(--primary);
          vertical-align: super;
        }
      }

      &:first-child {
        padding-left: 10px;
      }

      &:last-child {
        padding-right: 10px;
      }

      &:not(.sortable) > SPAN {
        display: block;
        margin-bottom: 2px;
      }

      & A {
        color: var(--body-text);
      }

      // Aligns with COLUMN_BREAKPOINTS
      @media only screen and (max-width: map-get($breakpoints, '--viewport-4')) {
        // HIDE column on sizes below 480px
        &.tablet, &.laptop, &.desktop {
          display: none;
        }
      }
      @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
        // HIDE column on sizes below 992px
        &.laptop, &.desktop {
          display: none;
        }
      }
      @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
        // HIDE column on sizes below 1281px
        &.desktop {
          display: none;
        }
      }
    }

    .icon-stack {
      width: 12px;
    }

    .icon-sort {
      &.faded {
        opacity: .3;
      }
    }
  </style>
  <style lang="scss">
    .table-options-checkbox .checkbox-label {
      color: var(--body-text);
      text-overflow: ellipsis;
      width: 100px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
    }
  </style>
