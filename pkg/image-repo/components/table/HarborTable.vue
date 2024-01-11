<script>
import { Table as VxeTable, Column as VxeColumn } from 'vxe-table';
import { addObject } from '@shell/utils/array';
import DropDownMenu from '@pkg/image-repo/components/DropDownMenu.vue';
import paging from './paging';
import filtering from './filtering';
import { find } from 'lodash';

export default {
  name:   'HarborTable',
  mixins: [
    filtering,
    paging,
  ],
  components: {
    VxeTable,
    VxeColumn,
    DropDownMenu,
  },
  props: {
    loading: {
      type:    Boolean,
      default: false,
    },
    columns: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    rows: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    defaultSelectOption: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    sortConfig: {
      type:    Object,
      default: () => {
        return {
          remote:  true,
          trigger: 'cell'
        };
      },
    },
    rowSelection: {
      staticProp: Boolean,
      type:       Boolean,
      default:    false,
    },
    paging: {
      staticProp: Boolean,
      type:       Boolean,
      default:    false,
    },
    hideSelect: {
      staticProp: Boolean,
      type:       Boolean,
      default:    false,
    },
    pagingLabel: {
      type:    String,
      default: 'sortableTable.paging.generic'
    },
    subSearch: {
      type:    String,
      default: ''
    },
    subFields: {
      type:    String,
      default: ''
    },
    rowsPerPage: {
      type:    Number,
      default: 10,
    },
    totalCount: {
      type:    Number,
      default: 0,
    },
    search: {
      staticProp: Boolean,
      type:       Boolean,
      default:    false,
    },
    enableFrontendPagination: {
      staticProp: Boolean,
      type:       Boolean,
      default:    false,
    },
  },
  data() {
    return {
      selectedRows:             [],
      defaultSelectSearchQuery: '',
      inputSearchQuery:         '',
    };
  },
  watch: {
    loading() {
      this.selectedRows = [];
    }
  },
  mounted() {
    // Set initial value;
    if (this.defaultSelectOption?.length > 0) {
      this.defaultSelectSearchQuery = this.defaultSelectOption[0].value;
    }
  },
  methods: {
    selectChangeEvent(rows) {
      this.$emit('checkbox-change', rows.records);
      this.selectedRows = rows.records;
    },
    selectAllChangeEvent(rows) {
      this.$emit('checkbox-all', rows.records);
      this.selectedRows = rows.records;
    },
    remove() {
      this.$emit('bulk-remove', this.selectedRows);
    },
    handleEnterKey() {
      if (this.enableFrontendPagination) {
        this.searchQuery = this.inputSearchQuery;
      } else {
        this.$emit('input-search', this.getCurrentFilterFields());
      }
    },
    getCurrentFilterFields(extraSearchFields) {
      const fields = [];

      (this.columns || []).forEach((column) => {
        const field = column.search;

        if ( field ) {
          if ( typeof field === 'string' ) {
            addObject(fields, field);
          }
        }
      });
      let filterFields = [];

      if (this.inputSearchQuery) {
        filterFields = fields.map((field) => {
          return {
            field,
            value: this.inputSearchQuery,
          };
        });
      }

      if (this.defaultSelectSearchQuery !== '') {
        const defaultOption = find(this.defaultSelectOption, (f) => {
          return f.value === this.defaultSelectSearchQuery;
        });

        if (defaultOption?.filterKey) {
          const filterKey = defaultOption?.filterKey;

          filterFields.push(
            {
              field: filterKey,
              value: this.defaultSelectSearchQuery
            }
          );
        }
      }

      return filterFields;
    },
    handleSelectChange() {
      this.$emit('input-search', this.getCurrentFilterFields());
    },
    sortChangeEvent(record) {
      this.$emit('sort-change', record);
    },
    clearSearch() {
      if (this.defaultSelectOption?.length > 0) {
        this.defaultSelectSearchQuery = this.defaultSelectOption[0].value;
      }
      this.inputSearchQuery = '';
      this.$emit('input-search', this.getCurrentFilterFields());
    }
  },
  computed: {
    disableBulkActions() {
      return this.selectedRows.length === 0;
    },
  }
};
</script>

<template>
  <div class="harbor-cn">
    <div class="table-content">
      <div class="table-actions">
        <button
          type="button"
          :disabled="disableBulkActions"
          class="bulk-action btn bg-primary"
          @click="remove"
        >
          <i class="icon icon-trash" />
          <span>{{ t('imageRepoSection.projectsPage.delete') }}</span>
        </button>
        <div class="table-slot">
          <slot name="default">
            <select
              v-if="!hideSelect"
              v-model="defaultSelectSearchQuery"
              @change="handleSelectChange"
            >
              <option
                v-for="t in defaultSelectOption"
                :key="t.label"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </select>
          </slot>
          <input
            v-if="search"
            ref="searchQuery"
            v-model="inputSearchQuery"
            type="search"
            class="input-sm search-box"
            :placeholder="t('sortableTable.search')"
            @keyup.enter="handleEnterKey"
          >
        </div>
      </div>
      <div v-loading="loading">
        <VxeTable
          :empty-text="t('sortableTable.noRows')"
          :row-config="{isHover: true}"
          :sort-config="sortConfig"
          :data="pagedRows"
          :scroll-y="{enabled: false}"
          @sort-change="sortChangeEvent"
          @checkbox-change="selectChangeEvent"
          @checkbox-all="selectAllChangeEvent"
        >
          <vxe-column
            v-if="rowSelection"
            type="checkbox"
            width="60"
          />
          <VxeColumn
            v-for="th in columns"
            :key="th.field"
            :field="th.field"
            :title="th.title"
            :sortable="th.sortable"
            :width="th.width"
            :min-width="th.minWidth"
          >
            <template
              v-if="th.action"
              #default="{row}"
            >
              <DropDownMenu
                :options="th.action.options"
                @custom-event="(record) => {
                  $emit('action', record, row);
                }"
              />
            </template>
            <template
              v-else-if="th.slot"
              #default="{row}"
            >
              <slot
                :name="th.field"
                :row="row"
              >
                {{ row[th.field] }}
              </slot>
            </template>
          </VxeColumn>
        </VxeTable>
      </div>
      <div
        v-if="paging"
        class="paging"
      >
        <button
          type="button"
          class="btn btn-sm role-multi-action"
          :disabled="page == 1"
          @click="goToPage('first')"
        >
          <i class="icon icon-chevron-beginning" />
        </button>
        <button
          type="button"
          class="btn btn-sm role-multi-action"
          :disabled="page == 1"
          @click="goToPage('prev')"
        >
          <i class="icon icon-chevron-left" />
        </button>
        <span>
          {{ pagingDisplay }}
        </span>
        <button
          type="button"
          class="btn btn-sm role-multi-action"
          :disabled="page == totalPages"
          @click="goToPage('next')"
        >
          <i class="icon icon-chevron-right" />
        </button>
        <button
          type="button"
          class="btn btn-sm role-multi-action"
          :disabled="page == totalPages"
          @click="goToPage('last')"
        >
          <i class="icon icon-chevron-end" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .harbor-cn {
    .table-content {
      margin-top: 10px;
      .table-actions {
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        .table-slot {
          display: flex;
          & input {
            margin-left: 10px;
          }
        }
      }
      .vxe-table--render-default {
        .vxe-cell {
          white-space: unset !important;
        }
        .vxe-header--column {
          .vxe-cell {
            min-height: 28px;
            display: flex;
            align-items: center;
          }
        }
        .vxe-body--column:not(.col--ellipsis) {
          padding: 8px 5px;
        }
        .vxe-header--column:not(.col--ellipsis) {
          padding: 8px 5px;
        }
        .vxe-checkbox--icon {
          font-size: 1.2em;
        }
      }
    }
  }
</style>
