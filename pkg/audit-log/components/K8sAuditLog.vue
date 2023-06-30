<script>
import { ROWS_PER_PAGE } from '@shell/store/prefs';
import { Table as VxeTable, Column as VxeColumn } from 'vxe-table';
import { Banner } from '@components/Banner';
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
    const clusterID = this.$route.query.cluster;

    return {
      loading:   false,
      errors:    [],
      resources: [],
      logs:      [],
      form:      {
        verb:               '',
        dateRange:          DEFAULT_DATE_RANGE,
        requestURIContains: '',
        clusterID,
      },
      queryForm:  {},
      pagination: {},
      pagesize,
      sortConfig: { remote: true },
    };
  },
  async fetch() {
    await this.fetchLogs();
  },
  computed: {
    clusterName() {
      const name = this.$route.query?.clusterName;
      const type = this.$route.query?.clusterType;

      if (name && type) {
        return `${ name }(${ type })`;
      }
      if (name) {
        return name;
      }

      return '';
    },
    dateRanges() {
      const arr = [
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
        },
        {
          label: this.t('auditLog.form.time.day20'),
          value: '20',
        },
        {
          label: this.t('auditLog.form.time.all'),
          value: '0',
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

    resourceVerbs() {
      const verbs = [
        {
          label: this.t('auditLog.form.operation.all'),
          value: ''
        },
        {
          label: 'Create',
          value: 'create'
        },
        {
          label: 'Update',
          value: 'update'
        },
        {
          label: 'List',
          value: 'list'
        },
        {
          label: 'Watch',
          value: 'watch'
        },
        {
          label: 'Post',
          value: 'post'
        },
        {
          label: 'Put',
          value: 'put'
        },
        {
          label: 'Patch',
          value: 'patch'
        },
        {
          label: 'Get',
          value: 'get'
        },
        {
          label: 'Delete',
          value: 'delete'
        },
      ];

      return verbs;
    }
  },
  methods: {
    async loadLogDetail(clusterID, auditID, stage) {
      const { data } = await this.$store.dispatch('management/request', {
        url:    `/meta/auditlog/${ this.serverAddress.replace('//', '/') }/v1/k8sauditlogs/${ auditID }?stage=${ stage }&clusterID=${ clusterID }`,
        method: 'GET',
      });

      return data;
    },
    async loadLogs() {
      this.loading = true;
      try {
        const queryForm = { ...this.queryForm };
        const query = Object.entries(queryForm).map(e => `${ e[0] }=${ e[1] }`).join('&');
        const { data, pagination } = await this.$store.dispatch('management/request', {
          url:    `/meta/auditlog/${ this.serverAddress.replace('//', '/') }/v1/k8sauditlogs?${ query }`,
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
      const keys = ['verb', 'requestURIContains', 'clusterID'];

      keys.filter(k => f[k]).forEach((k) => {
        q[k] = f[k];
      });

      const dateRange = parseInt(f.dateRange, 10);

      if (dateRange > 0) {
        const d = new Date();

        d.setDate(d.getDate() + 1);
        const to = `${ d.getFullYear() }-${ `${ d.getMonth() + 1 }`.padStart(2, '0') }-${ `${ d.getDate() }`.padStart(2, '0') }T00:00:00Z`;

        d.setDate(d.getDate() - this.form.dateRange);
        const from = `${ d.getFullYear() }-${ `${ d.getMonth() + 1 }`.padStart(2, '0') }-${ `${ d.getDate() }`.padStart(2, '0') }T00:00:00Z`;

        q.from = from;
        q.to = to;
      }
      this.queryForm = q;
    },
    resetForm() {
      this.form = {
        verb:               '',
        dateRange:          DEFAULT_DATE_RANGE,
        requestURIContains: '',
        clusterID:          this.$route.query.cluster
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
        componentProps: {
          value: data, clusterId: this.queryForm.clusterID, clusterName: this.clusterName, serverAddress: this.serverAddress
        },
        component:   'ViewK8sAuditLogDialog',
        modalSticky: true,
        modalWidth:  '80vw'
      });
    },
  },
  components: {
    VxeTable, VxeColumn, Banner, PageTitle
  }
};
</script>

<template>
  <div class="global-audit-log">
    <!-- <div class="title mb-20">
      <h1 class="m-0">
        {{ t('auditLog.k8sTitle') }} {{ clusterName ? `: ${clusterName}` : '' }}
      </h1>
    </div> -->

    <PageTitle>
      <template #title>
        <h1 class="m-0">
          {{ t('auditLog.k8sTitle') }} {{ clusterName ? `: ${clusterName}` : '' }}
        </h1>
      </template>
    </PageTitle>

    <div class="mb-20 form">
      <div class="form-content">
        <input
          v-model="form.requestURIContains"
          placeholder="Request URI"
        >

        <select v-model="form.verb">
          <option
            v-for="a in resourceVerbs"
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
      </div>
      <div class="actions">
        <button
          class="btn role-secondary"
          :disabled="loading"
          @click="clear"
        >
          {{ t('auditLog.btn.clearAll') }}
        </button>
        <button
          class="btn role-primary"
          :disabled="loading"
          @click="fetchLogs"
        >
          {{ t('auditLog.btn.search') }}
        </button>
      </div>
    </div>

    <VxeTable
      ref="table"
      round
      :empty-text="t('sortableTable.noRows')"
      :loading="loading"
      :row-config="{isHover: true}"
      :sort-config="{iconAsc: 'vxe-icon-arrow-up', iconDesc: 'vxe-icon-arrow-down'}"
      :data="logs"
      @sort-change="sortChange"
    >
      <VxeColumn
        field="auditID"
        :title="t('auditLog.table.id')"
      />
      <VxeColumn
        field="stage"
        :title="t('auditLog.table.stage')"
      />
      <VxeColumn
        field="verb"
        :title="t('auditLog.table.verb')"
      />
      <VxeColumn
        field="requestURI"
        :title="t('auditLog.table.requestURI')"
      />
      <VxeColumn
        field="requestTimestamp"
        :title="t('auditLog.table.requestTimestamp')"
      />
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
        :disabled="loading"
        @click="fetchMoreLogs"
      >
        {{ t("auditLog.btn.loadMore") }}
      </button>
    </div>

    <Banner
      v-for="(err, i) in errors"
      :key="i"
      color="error"
      :label="err"
    />
  </div>
</template>

<style scoped>
.form {
  display: flex;
  justify-content: space-between;

}
.form-content {
  display: flex;
  gap: 20px;
  align-items: center;
}
.actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.load-more {
  display: flex;
  justify-content: center;
}
</style>
