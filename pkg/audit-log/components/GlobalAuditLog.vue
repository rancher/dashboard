<script>
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import { Table as VxeTable, Column as VxeColumn } from 'vxe-table';
import { HTTP_CODE } from '@pkg/config/constants.js';
import PageTitle from './PageTitle.vue';

const DEFAULT_DATE_RANGE = '5';

export default {
  props: {
    serverAddress: {
      type:     String,
      required: true
    }
  },
  data() {
    const pagesize = parseInt(this.$store.getters['prefs/get'](ROWS_PER_PAGE), 10) || 0;

    return {
      loading:          false,
      resourcesLoading: false,
      errors:           [],
      resources:        [],
      logs:             [],
      form:             {
        field:           'requestResId',
        fieldValue:      '',
        userdisplayname: '',
        operation:       '',
        requestResType:  '',
        dateRange:       DEFAULT_DATE_RANGE,
        order:           '',
        clusterID:       'global',
      },
      queryForm:  {},
      pagination: {},
      pagesize,
      sortConfig: { remote: true },
    };
  },
  async fetch() {
    await Promise.all([this.fetchResources(), this.fetchLogs()]);
  },
  computed: {
    dateRanges() {
      const arr = [{
        label: this.t('auditLog.form.time.all'),
        value: '-1',
      },
      {
        label: this.t('auditLog.form.time.day5'),
        value: '5',
      },
      {
        label: this.t('auditLog.form.time.day10'),
        value: '10',
      },
      {
        label: this.t('auditLog.form.time.day15'),
        value: '15',
      }];

      return arr;
    },

    resourceTypes() {
      return [
        {
          label: this.t('auditLog.form.type.label'),
          value: ''
        },
        ...this.resources.map(r => ({ label: r.resourceType, value: r.resourceType }))
      ];
    },

    resourceActions() {
      const actions = [{
        label: this.t('auditLog.form.operation.all'),
        value: ''
      }];

      if (!this.form.requestResType) {
        actions.push(...[
          {
            label: this.t('auditLog.form.operation.create'),
            value: 'Create'
          },
          {
            label: this.t('auditLog.form.operation.update'),
            value: 'Update'
          },
          {
            label: this.t('auditLog.form.operation.delete'),
            value: 'Delete'
          }
        ]);

        return actions;
      }

      const r = this.resources.find(r => this.form.requestResType === r.resourceType);

      if (!r) {
        return actions;
      }

      actions.push(...r.resourceActions.map(a => ({ label: a, value: a })));

      return actions;
    }
  },
  methods: {
    async fetchResources() {
      this.resourcesLoading = true;
      try {
        const { data } = await this.$store.dispatch('management/request', {
          url:    `/meta/auditlog/${ this.serverAddress.replace('//', '/') }/v1/resources`,
          method: 'GET'
        });

        this.resources = data;
      } catch (err) {
        this.errors.push(err);
        this.$store.dispatch('growl/error', {
          title:   'Fetch Resources Error',
          message: err,
        }, { root: true });
      }
      this.resourcesLoading = false;
    },
    async loadLogs() {
      this.loading = true;
      try {
        const queryForm = { ...this.queryForm };
        const query = Object.entries(queryForm).map(e => `${ e[0] }=${ e[1] }`).join('&');
        const { data, pagination } = await this.$store.dispatch('management/request', {
          url:    `/meta/auditlog/${ this.serverAddress.replace('//', '/') }/v1/auditlogs?${ query }`,
          method: 'GET'
        });

        if (queryForm.next) {
          this.logs.push(...data);
        } else {
          this.logs = data;
        }
        this.pagination = pagination;
      } catch (err) {
        let e = err;

        if (e?._status >= 500) {
          e = this.t('auditLog.errors.requestFailed');
        }
        this.errors.push(e);
        this.$store.dispatch('growl/error', {
          title:   'Fetch Resources Error',
          message: e,
        }, { root: true });
      }
      this.loading = false;
    },
    fetchMoreLogs() {
      this.queryForm.next = this.pagination?.next;
      this.loadLogs();
    },
    fetchLogs() {
      this.syncForm();

      return this.loadLogs();
    },
    syncForm() {
      const pagesize = this.pagesize;
      const f = { ...this.form };
      const q = { pagesize };
      const keys = ['userdisplayname', 'operation', 'requestResType', 'order', 'clusterID'];

      keys.filter(k => f[k]).forEach((k) => {
        q[k] = f[k];
      });

      if (f.field && f.fieldValue) {
        q[f.field] = f.fieldValue;
      }

      const dateRange = parseInt(f.dateRange, 10);

      if (dateRange > 0) {
        const d = new Date();

        q.to = `${ d.toISOString().split('.')[0] }Z`;
        d.setDate(d.getDate() - dateRange);
        q.from = `${ d.toISOString().split('.')[0] }Z`;
      }

      this.queryForm = q;
    },
    resetForm() {
      this.form = {
        field:           'requestResId',
        fieldValue:      '',
        userdisplayname: '',
        operation:       '',
        requestResType:  '',
        dateRange:       DEFAULT_DATE_RANGE,
        order:           '',
        clusterID:       'global',
      };
    },
    clear() {
      this.resetForm();
      this.fetchLogs();
    },
    sortChange({ order }) {
      this.form.order = order;
      this.fetchLogs();
    },
    showDetail(data) {
      this.$store.dispatch('management/promptModal', {
        componentProps: { value: data },
        component:      'ViewAuditLogDialog',
        modalSticky:    true,
        modalWidth:     '80vw'
      });
    },
    responseCodeFilter(code) {
      if (!HTTP_CODE.includes(code)) {
        return code;
      }

      return `${ this.t(`auditLog.status.${ code }`) }(${ code })`;
    }
  },
  components: {
    VxeTable, VxeColumn, PageTitle
  }
};
</script>

<template>
  <div class="global-audit-log">
    <PageTitle />
    <div class="form-content mb-20">
      <input
        v-model="form.userdisplayname"
        :placeholder="t('auditLog.form.operator.placeholder')"
      >

      <input
        v-model="form.fieldValue"
        :placeholder="t('auditLog.form.name.label')"
      >
      <select v-model="form.requestResType">
        <option
          v-for="t in resourceTypes"
          :key="t.label"
          :value="t.value"
        >
          {{ t.label }}
        </option>
      </select>
      <select v-model="form.operation">
        <option
          v-for="a in resourceActions"
          :key="a.label"
          :value="a.value"
        >
          {{ a.label }}
        </option>
      </select>
      <select v-model="form.dateRange">
        <option
          v-for="r in dateRanges"
          :key="r.label"
          :value="r.value"
        >
          {{ r.label }}
        </option>
      </select>
      <div class="actions">
        <button
          class="btn role-secondary"
          :disabled="loading || resourcesLoading"
          @click="clear"
        >
          {{ t('auditLog.btn.clearAll') }}
        </button>
        <button
          class="btn role-primary"
          :disabled="loading || resourcesLoading"
          @click="fetchLogs"
        >
          {{ t('auditLog.btn.search') }}
        </button>
      </div>
    </div>

    <VxeTable
      round
      :empty-text="t('sortableTable.noRows')"
      :loading="loading || resourcesLoading"
      :row-config="{isHover: true}"
      :sort-config="{iconAsc: 'vxe-icon-arrow-up', iconDesc: 'vxe-icon-arrow-down'}"
      :data="logs"
      :scroll-y="{enabled: false}"
      @sort-change="sortChange"
    >
      <VxeColumn
        field="userDisplayName"
        :title="t('auditLog.table.user')"
      />
      <VxeColumn
        field="operation"
        :title="t('auditLog.table.operation')"
        width="80"
      >
        <template #default="{ row }">
          <span v-if="row.requestAction"> {{ row.requestAction }} </span> <span v-else>{{ row.operation }}</span>
        </template>
      </VxeColumn>
      <VxeColumn
        field="responseCode"
        :title="t('auditLog.table.result')"
        width="120"
      >
        <template #default="{ row }">
          <span>{{ responseCodeFilter(row.responseCode) }}</span>
        </template>
      </VxeColumn>
      <VxeColumn
        field="requestTimestamp"
        :title="t('auditLog.table.time')"
        sortable
        width="180"
      />
      <VxeColumn
        field="requestResType"
        :title="t('auditLog.table.type')"
        min-width="200"
      />
      <VxeColumn
        field="requestResId"
        :title="t('auditLog.table.name')"
      >
        <template #default="{ row }">
          <span v-if="row.requestResName">{{ row.requestResName }}</span> <span v-else> {{ row.requestResId }} </span>
        </template>
      </VxeColumn>
      <VxeColumn
        field="detail"
        :title="t('auditLog.table.detail')"
        width="60"
      >
        <template #default="{row}">
          <a
            href="javascript:void(0);"
            @click="showDetail(row)"
          >{{ t('auditLog.btn.detail') }}</a>
        </template>
      </VxeColumn>
      <template #loading>
        <t
          k="generic.loading"
          :raw="true"
        />
      </template>
    </VxeTable>
    <div
      v-if="pagination.next"
      class="mt-10 load-more"
    >
      <button
        class="btn btn-sm bg-primary"
        :disabled="loading || resourcesLoading"
        @click="fetchMoreLogs"
      >
        {{ t("auditLog.btn.loadMore") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-content {
  display: flex;
  gap: 1.75%;
}
.actions {
  display: flex;
  gap: 5px;
}
.load-more {
  display: flex;
  justify-content: center;
}

</style>
