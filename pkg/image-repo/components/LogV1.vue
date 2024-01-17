<template>
  <div>
    <HarborTable
      search
      paging
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :total-count="totalCount"
      :default-select-option="filterKeyOptions"
      :enableFrontendPagination="false"
      @input-search="inputSearch"
      @page-change="pageChange"
    >
      <template #name="{row}">
        <LabelItem
          :color="row.color"
          :global="true"
          :label-colors="labelColors"
        >
          {{ row.name }}
        </LabelItem>
      </template>
      <template #creation_time="{row}">
        {{ row.creation }}
      </template>
    </HarborTable>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
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
    projectId: {
      type:    Number,
      default: -1
    }

  },

  data() {
    return {
      errors:      [],
      loading:     false,
      data:        [],
      inputFilter: [],
      sort:        '',
      totalCount:  0,
      columns:     [
        {
          field:  'username',
          title:  'Username',
          search: 'username'
        },
        {
          field:  'repo_name',
          title:  'Repository Name',
          serach: 'repository'
        },
        {
          field:  'repo_tag',
          title:  'Tags',
          serach: 'tag'
        },
        {
          field:  'operation',
          title:  'Operation',
          serach: 'operation'
        },
        {
          field: 'op_time',
          title: 'Timestamp',
        },
      ],
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    params() {
      const filter = this.inputFilter.reduce((t, c) => {
        t[c.field] = c.value;

        return t;
      }, {});

      return filter;
    },
    filterKeyOptions() {
      return [
        {
          label: this.t('harborConfig.form.search.username'),
          value: 'username',
        },
        {
          label: this.t('harborConfig.form.search.store'),
          value: 'repository',
        },
        {
          label: this.t('harborConfig.form.search.tag'),
          value: 'tag',
        },
        {
          label: this.t('harborConfig.form.search.operation'),
          value: 'operation',
        },
      ];
    },
    rows() {
      return this.data.map((d) => {
        return {
          ...d,
          creation: this.liveUpdate(d.op_time),
        };
      });
    },
  },
  watch: {
    params: {
      immediate: true,
      handler() {
        this.loadData();
      }
    }
  },
  methods: {
    pageChange(record) {
      this.page = record;
    },
    fetchLogs(p) {
      if (this.projectId > -1) {
        return this.apiRequest.fetchProjectLogs(this.projectId, p);
      }

      return this.apiRequest.fetchLogs(p);
    },
    resetParams() {
      this.page = 1;
      this.page_size = 10;
      this.inputFilter = [];
    },
    async loadData() {
      this.loading = true;
      this.errors = [];
      try {
        const data = await this.fetchLogs(this.params);

        this.totalCount = this.getTotalCount(data);
        this.data = data;
      } catch (err) {
        this.errors = [err];
      }
      this.loading = false;
    },
    reloadData() {
      this.resetParams();
      this.loadData();
    },
    inputSearch(f) {
      this.page = 1;
      this.inputFilter = f;
    },
  }
};
</script>
<style scoped>
  .header {
    display: grid;
    grid-template-areas: 'title action'
                          'sub-title action';
    grid-template-columns: 1fr auto;
  }
  .title {
    grid-area: title;
  }
  .sub-title {
    grid-area: sub-title;
  }
  .action {
    grid-area: action;
  }
  .color-option {
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 24px;
    text-align: center;
    line-height: 24px;
    border: 0;
    font-size: 12px;
  }
  .color-container {
    max-width: 360px;
    display: flex;
    gap: 8px 16px;
    flex-wrap: wrap;
  }
  .color-label {
    color: var(--input-label);
  }
  .color-form {
    box-sizing: border-box;
    height: 61px;
    width: 265px;
    padding: 10px;
    background-color: var(--input-bg);
    border-radius: var(--border-radius);
    border: solid var(--border-width) var(--input-border);
    color: var(--input-text);
    display: flex;
    flex-direction: column;
  }
  .color-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    margin-top: 3px;
  }

  ::v-deep .icon-chevron-up {
    display: none;
  }
  ::v-deep .icon-chevron-down {
    display: block;
  }
  ::v-deep .open .icon-chevron-up {
    display: block;
  }
  ::v-deep .open .icon-chevron-down {
    display: none;
  }
  .label-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
