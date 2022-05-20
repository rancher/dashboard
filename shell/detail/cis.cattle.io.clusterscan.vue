<script>
import Date from '@shell/components/formatter/Date';
import SortableTable from '@shell/components/SortableTable';
import Banner from '@shell/components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml, randomStr } from '@shell/utils/string';
import { CIS } from '@shell/config/types';
import { STATE } from '@shell/config/table-headers';
import { get } from '@shell/utils/object';

export default {
  components: {
    Date,
    SortableTable,
    Banner,
    LabeledSelect,
    Loading,
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

  data() {
    return { clusterReports: [], clusterReport: null };
  },

  computed: {
    parsedReport() {
      return this.clusterReport?.parsedReport || null;
    },

    canBeScheduled() {
      return this.value.canBeScheduled();
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

      const out = [
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
          label:     this.canBeScheduled ? this.t('cis.scan.lastScanTime') : this.t('cis.scan.scanDate'),
          value:     this.value.status.lastRunTimestamp,
          component: 'Date'
        },
      ];

      if (!this.canBeScheduled) {
        return out.filter(each => each.label !== this.t('cis.scan.warn'));
      }

      return out;
    },

    reportCheckHeaders() {
      return [
        {
          ...STATE,
          value:         'state',
          formatterOpts: { arbitrary: true },
          sort:          ['testStateSort', 'testIdSort']
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
          value: 'description',
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
      if (!this.clusterReport) {
        this.clusterReport = neu[0];
      }
    }
  },

  methods: {
    reportLabel(report = {}) {
      const { creationTimestamp } = report.metadata;
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      const name = report.id.replace(/^scan-report-/, '');

      return `${ name } ${ day(creationTimestamp).format(`${ dateFormat } ${ timeFormat }`) }`;
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

    remediationDisplay(row) {
      const { remediation } = row;

      if (!remediation) {

      } else {
        return `${ this.t('cis.scan.remediation') }: ${ remediation }`;
      }
    },
    get
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
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
        <h3>
          {{ t('cis.scan.scanReport') }}
        </h3>
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="clusterReport"
          :label="t('cis.reports')"
          :options="clusterReports"
          :get-option-label="reportLabel"
          :get-option-key="report=>report.id"
        />
      </div>
    </div>
    <div v-if="results && !!get(value, 'status.summary')">
      <SortableTable
        no-rows-key="cis.noReportFound"
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
          <tr class="sub-row">
            <td :colspan="fullColspan">
              <Banner v-if="(row.state==='fail' || row.state==='warn')&& row.remediation" class="sub-banner" :label="remediationDisplay(row)" color="warning" />
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

.sub-banner{
  margin: 0px 40px 0px 40px;
  width: auto;
}

.table-header {
  align-items: flex-end;
}
</style>
