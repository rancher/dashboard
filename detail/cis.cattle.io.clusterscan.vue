<script>
import Date from '@/components/formatter/Date';
import SortableTable from '@/components/SortableTable';
import Banner from '@/components/Banner';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { CIS } from '@/config/types';
import { STATE } from '@/config/table-headers';
import { randomStr } from '@/utils/string';

export default {
  components: {
    Date,
    SortableTable,
    Banner
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
    this.clusterReport = await this.value.getReport();
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, null, { hideBanner: true, hideAge: true });
  },

  data() {
    return { clusterReport: null };
  },

  computed: {
    parsedReport() {
      const report = this.clusterReport?.parsedReport;

      return report;
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
          label: this.t('cis.scan.passed'),
          value: this.parsedReport.pass
        },
        {
          label: this.t('cis.scan.skipped'),
          value: this.parsedReport.skip
        },
        {
          label: this.t('cis.scan.failed'),
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
          sort:  ['id'],
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

  methods: {

    nodeState(check, node, nodes = []) {
      if (check.state === 'mixed') {
        return nodes.includes(node) ? 'fail' : 'pass';
      }

      return check.state;
    },

    testStateSort(state) {
      const SORT_ORDER = {
        fail:          1,
        skip:          2,
        notApplicable: 3,
        pass:          4,
        other:         5,
      };

      return `${ SORT_ORDER[state] || SORT_ORDER['other'] } ${ state }`;
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
    <p>test</p>
    <div v-if="results.length">
      <h3>{{ t('cis.scan.scanReport') }}</h3>
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
</style>
