<script>
import Date from '@/components/formatter/Date';
import SortableTable from '@/components/SortableTable';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { CIS } from '@/config/types';
import { STATE } from '@/config/table-headers';

export default {
  components: {
    Date,
    SortableTable
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
    this.owned = await this.value.getOwned();
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, null, { hideBanner: true, hideAge: true });
  },

  data() {
    return { owned: [] };
  },

  computed: {
    clusterReport() {
      return this.owned.filter(each => each.type === CIS.REPORT)[0];
    },

    parsedData() {
      if (!this.clusterReport) {
        return null;
      }
      const { spec:{ reportJSON } } = this.clusterReport;

      return JSON.parse(reportJSON);
    },

    reportNodes() {
      return this.parsedData ? this.parsedData.nodes : {};
    },

    results() {
      return this.parsedData ? this.parsedData.results.reduce((all, result) => {
        if (result.checks) {
          result = result.checks.map((check) => {
            check.testStateSort = this.testStateSort(check.state);
            if (!!check.node_type) {
              check.nodes = check.node_type.reduce((names, type) => {
                if (this.reportNodes[type]) {
                  names.push(...this.reportNodes[type]);
                }

                return names;
              }, []);
            }

            return check;
          });
        }

        all.push(...result);

        return all;
      }, []) : [];
    },

    details() {
      if (!this.parsedData) {
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
          value: this.parsedData.total
        },
        {
          label: this.t('cis.scan.passed'),
          value: this.parsedData.pass
        },
        {
          label: this.t('cis.scan.skipped'),
          value: this.parsedData.skip
        },
        {
          label: this.t('cis.scan.failed'),
          value: this.parsedData.fail
        },
        {
          label: this.t('cis.scan.notApplicable'),
          value: this.parsedData.notApplicable
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
        },
        {
          name:      'node',
          label:     'Nodes',
          value:     'nodes',
          formatter: 'List',
          sort:      'nodes'
        }

      ];
    },
  },

  methods: {
    testStateSort(state) {
      const SORT_ORDER = {
        failed:        1,
        skipped:       2,
        notApplicable:    3,
        passed:        4,
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
    <div v-if="parsedData">
      <h3>{{ t('cis.scan.scanReport') }}</h3>
      <SortableTable
        default-sort-by="state"
        :search="false"
        :row-actions="false"
        :table-actions="false"
        :rows="results"
        :headers="reportCheckHeaders"
        key-field="id"
      />
    </div>
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
</style>
