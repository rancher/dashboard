<script>
import Date from '@/components/formatter/Date';
import SortableTable from '@/components/SortableTable';
import Banner from '@/components/Banner';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml, randomStr } from '@/utils/string';
import { CIS } from '@/config/types';
import { STATE } from '@/config/table-headers';

export default {
  components: {
    Date,
    SortableTable,
    Banner,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    this.clusterReports = await this.value.getReports();
  },

  parentOverride: {
    hideBanner: true,
    hideAge:    true
  },

  data() {
    return { clusterReports: [], clusterReport: null };
  },

  computed: {
    parsedReport() {
      return this.clusterReport?.parsedReport || null;
    },

    reportNodes() {
      return this.clusterReport?.nodes || null;
    },

    results() {
      if (!this.clusterReport || !this.clusterReport.aggregatedTests) {
        return [];
      }

      return this.clusterReport.aggregatedTests.map((check) => {
        check.testStateSort = this.testStateSort(check.state);
        check.testIdSort = this.testIdSort(check);
        if (!!check.node_type) {
          const nodeRows = check.node_type.reduce((nodes, type) => {
            if (this.reportNodes[type]) {
              this.reportNodes[type].forEach(name => nodes.push({
                type, name, id: randomStr(4), state: this.nodeState(check, name, check.nodes), testStateSort: this.testStateSort(this.nodeState(check, name, check.nodes))
              })
              );
            }

            return nodes;
          }, []);

          check.nodeRows = nodeRows;
        }

        return check;
      });
    },

    details() {
      if (!this.parsedReport) {
        return [];
      }

      return [
        {
          label: this.t('cis.profile'),
          value: this.value.status.lastRunScanProfileName,
          to:    {
            name:   'c-cluster-product-resource-id',
            params: {
              ...this.$route.params,
              resource: CIS.CLUSTER_SCAN_PROFILE,
              id:       this.value.status.lastRunScanProfileName
            }
          }
        },
        {
          label: this.t('cis.scan.total'),
          value: this.parsedReport.total
        },
        {
          label: this.t('cis.scan.pass'),
          value: this.parsedReport.pass
        },
        {
          label: this.t('cis.scan.warn'),
          value: this.parsedReport.warn
        },
        {
          label: this.t('cis.scan.skip'),
          value: this.parsedReport.skip
        },
        {
          label: this.t('cis.scan.fail'),
          value: this.parsedReport.fail
        },
        {
          label: this.t('cis.scan.notApplicable'),
          value: this.parsedReport.notApplicable
        },
        {
          label:     this.t('cis.scan.lastScanTime'),
          value:     this.value.status.lastRunTimestamp,
          component: 'Date'
        },
      ];
    },

    reportCheckHeaders() {
      return [
        {
          ...STATE,
          value:         'state',
          formatterOpts: { arbitrary: true },
          sort:          'testStateSort'
        },
        {
          name:  'number',
          label: this.t('cis.scan.number'),
          value: 'id',
          sort:  'testIdSort',
          width: 100
        },
        {
          name:  'description',
          label: this.t('cis.scan.description'),
          value: 'description'
        }
      ];
    },

    nodeTableHeaders() {
      return [
        {
          ...STATE,
          value:         'state',
          formatterOpts: { arbitrary: true },
          sort:          'testStateSort'
        },
        {
          name:      'node',
          label:     this.t('tableHeaders.name'),
          value:     'name',
        },
        {
          name:      'type',
          label:     this.t('tableHeaders.type'),
          value:     'type',
        },

      ];
    },
  },

  watch: {
    value(neu) {
      try {
        neu.getReports().then((reports) => {
          this.clusterReports = reports;
        });
      } catch {}
    },

    clusterReports(neu) {
      this.clusterReport = neu[0];
    }
  },

  methods: {
    reportLabel(report = {}) {
      const { creationTimestamp } = report.metadata;
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return day(creationTimestamp).format(`${ dateFormat } ${ timeFormat }`);
    },

    nodeState(check, node, nodes = []) {
      if (check.state === 'mixed') {
        return nodes.includes(node) ? 'fail' : 'pass';
      }

      return check.state;
    },

    testStateSort(state) {
      const SORT_ORDER = {
        other:         7,
        notApplicable: 6,
        skip:          5,
        pass:          4,
        warn:          3,
        mixed:         2,
        fail:          1,
      };

      return `${ SORT_ORDER[state] || SORT_ORDER['other'] } ${ state }`;
    },

    testIdSort(test) {
      const { id = '' } = test;

      return id.split('.').map(n => +n + 1000).join('.');
    },
  }
};
</script>

<template>
  <div>
    <div class="detail mb-20">
      <div v-for="item in details" :key="item.label">
        <span class="text-label">{{ item.label }}</span>:
        <component :is="item.component" v-if="item.component" :value="item.value" />
        <nuxt-link v-else-if="item.to" :to="item.to">
          {{ item.value }}
        </nuxt-link>
        <span v-else>{{ item.value }}</span>
      </div>
    </div>
    <div v-if="clusterReports.length > 1" class="table-header row mb-20">
      <div class="col span-8">
        <h3 class="mb-0">
          {{ t('cis.scan.scanReport') }}
        </h3>
      </div>
      <div class="col span-4">
        <v-select v-model="clusterReport" class="inline" :options="clusterReports" :get-option-label="reportLabel" :get-option-key="report=>report.id" />
      </div>
    </div>
    <div v-if="results.length">
      <SortableTable
        default-sort-by="state"
        :search="false"
        :row-actions="false"
        :table-actions="false"
        :rows="results"
        :sub-rows="true"
        :sub-expandable="true"
        :sub-expand-column="true"
        :headers="reportCheckHeaders"
        key-field="id"
      >
        <template #sub-row="{row, fullColspan}">
          <tr>
            <td :colspan="fullColspan">
              <SortableTable
                class="sub-table"
                :rows="row.nodeRows"
                :headers="nodeTableHeaders"
                :search="false"
                :row-actions="false"
                :table-actions="false"
                key-field="id"
              />
            </td>
          </tr>
        </template>
      </SortableTable>
    </div>
    <Banner v-else color="error" :label="value.metadata.state.message" />
  </div>
</template>

<style lang='scss' scoped>
.detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--border);

    & .div {
        padding: 0px 10px 0px 10px;
    }
}

.sub-table {
  padding: 0px 40px 0px 40px;
}

.table-header {
  align-items: flex-end;
}
</style>
