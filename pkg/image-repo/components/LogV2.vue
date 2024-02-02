<template>
  <div
    v-loading="loading"
    class="Log"
  >
    <div class="title">
      <t k="harborConfig.log" />
    </div>
    <HarborTable
      ref="harborTableRef"
      hideSelect
      search
      paging
      :defaultSelectOption="defaultSelectOption"
      :loading="loading"
      :rows="logs"
      :columns="columns"
      :totalCount="totalCount"
      :subtractHeight="262"
      @page-change="pageChange"
      @input-search="inputSearch"
      @sort-change="sortChange"
    >
      <select
        v-model="extraSearchFields"
      >
        <option
          v-for="t in defaultSelectOption"
          :key="t.label"
          :value="t.value"
        >
          {{ t.label }}
        </option>
      </select>
    </HarborTable>
  </div>
</template>
<script>
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import util from '../mixins/util.js';

export default {
  components: { HarborTable },
  mixins:     [util],
  props:      {
    apiRequest: {
      type:     Object,
      required: true
    },
    project: {
      type:    Object,
      default: () => {},
    }
  },
  data() {
    return {
      loading:           false,
      page:              1,
      page_size:         10,
      totalCount:        0,
      inputFilter:       [],
      logs:              [],
      sortValue:         '',
      extraSearchFields: 'username'
    };
  },
  watch: {
    project: {
      immediate: true,
      async handler() {
        await this.fetchLogs();
      }
    }
  },
  computed: {
    columns() {
      return [
        {
          field:  'username',
          title:  this.t('harborConfig.table.username'),
          search: 'username',
          width:  160,
        },
        {
          field: 'resource',
          title: this.t('harborConfig.table.resource'),
        },
        {
          field: 'resource_type',
          title: this.t('harborConfig.table.type'),
        },
        {
          field: 'operation',
          title: this.t('harborConfig.table.operation'),
        },
        {
          field: 'op_time',
          title: this.t('harborConfig.table.timestamp'),
        },
      ];
    },
    defaultSelectOption() {
      return [
        {
          label: this.t('harborConfig.table.username'),
          value: 'username',
        },
        {
          label: this.t('harborConfig.table.resource'),
          value: 'resource',
        },
        {
          label: this.t('harborConfig.table.type'),
          value: 'resource_type',
        },
        {
          label: this.t('harborConfig.table.operation'),
          value: 'operation',
        },
      ];
    }
  },
  methods: {
    async fetchLogs() {
      const params = {};

      if (this.inputFilter?.length > 0 ) {
        this.inputFilter.forEach((item) => {
          params[item.field] = item.value;
        });
      }
      if (this.sortValue !== '') {
        params.sort = this.sortValue;
      }
      this.loading = true;
      try {
        const logs = await this.apiRequest.fetchLogsV2({
          page_size: this.page_size,
          page:      this.page,
          ...params
        });

        this.logs = logs;
        this.totalCount = this.getTotalCount(logs) || 0;
        this.loading = false;
      } catch (e) {
        this.loading = false;
      }
    },
    pageChange(record) {
      this.page = record;
      this.fetchLogs();
    },
    inputSearch(record, selectChange) {
      this.page = 1;
      if (record.length > 0) {
        record[0].field = this.extraSearchFields;
      }
      this.inputFilter = record;
      this.fetchLogs();
    },
    sortChange({ field, order }) {
      if (order) {
        if (order === 'desc') {
          field = `-${ field }`;
        }
        this.sortValue = field;
      } else {
        this.sortValue = '';
      }
      this.fetchLogs();
    },
  }
};
</script>
<style lang="scss" scoped>
.title {
  padding: 10px;
  font-size: 1.5em;
}
</style>
