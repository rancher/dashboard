<script>
import { CAPI } from '@shell/config/types';
import AsyncButton from '@shell/components/AsyncButton';
import { downloadFile } from '@shell/utils/download';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster } from '@shell/utils/cluster';
import { sortBy } from '@shell/utils/sort';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  layout:     'plain',
  components: { AsyncButton, Checkbox },
  async fetch() {
    const provClusters = await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    const readyClusters = provClusters.filter(c => c.mgmt?.isReady);
    const clusterForCounts = filterHiddenLocalCluster(filterOnlyKubernetesClusters(readyClusters), this.$store);
    const finalCounts = [];
    const promises = [];
    let topTenForResponseTime = [];

    clusterForCounts.forEach((cluster, i) => {
      finalCounts.push({
        id:             cluster.id,
        capiId:         cluster.mgmt?.id,
        counts:         null,
        isTableVisible: i === 0
      });
      promises.push(this.$store.dispatch('management/request', { url: `/k8s/clusters/${ cluster.mgmt?.id }/v1/counts` }));
    });

    const countsPerCluster = await Promise.all(promises);

    countsPerCluster.forEach((clusterCount, index) => {
      const counts = clusterCount.data?.[0]?.counts;

      if (counts) {
        const sanitizedCount = [];

        Object.keys(counts).forEach((key) => {
          sanitizedCount[key] = counts[key].summary?.count;
          sanitizedCount.push({
            resource: key,
            count:    counts[key].summary?.count || 0,
          });
        });

        const sortedCount = sortBy(sanitizedCount, 'count:desc');

        topTenForResponseTime = topTenForResponseTime.concat(sortedCount);
        topTenForResponseTime = sortBy(topTenForResponseTime, 'count:desc');
        topTenForResponseTime = topTenForResponseTime.splice(0, 10);

        topTenForResponseTime.forEach((item, i) => {
          topTenForResponseTime[i].id = finalCounts[index].id;
          topTenForResponseTime[i].capiId = finalCounts[index].capiId;
        });

        finalCounts[index].counts = sortedCount;
      }
    });

    this.topTenForResponseTime = topTenForResponseTime;
    this.finalCounts = finalCounts;
  },

  data() {
    const systemInformation = {
      browserUserAgent: {
        label: this.t('about.diagnostic.systemInformation.browserUserAgent'),
        value: window?.navigator?.userAgent
      },
      browserLanguage: {
        label: this.t('about.diagnostic.systemInformation.browserLanguage'),
        value: window?.navigator?.language
      },
      cookieEnabled: {
        label: this.t('about.diagnostic.systemInformation.cookieEnabled'),
        value: window?.navigator?.cookieEnabled
      },
      hardwareConcurrency: {
        label: this.t('about.diagnostic.systemInformation.hardwareConcurrency'),
        value: window?.navigator?.hardwareConcurrency
      },
    };

    if (window?.navigator?.userAgentData?.platform) {
      systemInformation.os = {
        label: this.t('about.diagnostic.systemInformation.os'),
        value: window?.navigator?.userAgentData?.platform
      };
    }

    if (window?.navigator?.deviceMemory) {
      systemInformation.deviceMemory = {
        label: this.t('about.diagnostic.systemInformation.deviceMemory'),
        value: window?.navigator?.deviceMemory
      };
    }

    if (window?.performance?.memory?.jsHeapSizeLimit) {
      systemInformation.memJsHeapLimit = {
        label: this.t('about.diagnostic.systemInformation.memJsHeapLimit'),
        value: window?.performance?.memory?.jsHeapSizeLimit
      };
    }

    if (window?.performance?.memory?.totalJSHeapSize) {
      systemInformation.memTotalJsHeapSize = {
        label: this.t('about.diagnostic.systemInformation.memTotalJsHeapSize'),
        value: window?.performance?.memory?.totalJSHeapSize
      };
    }

    if (window?.performance?.memory?.usedJSHeapSize) {
      systemInformation.memUsedJsHeapSize = {
        label: this.t('about.diagnostic.systemInformation.memUsedJsHeapSize'),
        value: window?.performance?.memory?.usedJSHeapSize
      };
    }

    // scroll logs container to the bottom
    this.scrollLogsToBottom();

    return {
      systemInformation,
      topTenForResponseTime: null,
      finalCounts:           null,
      includeResponseTimes:  true,
      storeMapping:          this.$store?._modules?.root?.state,
      latestLogs:            console.logs // eslint-disable-line no-console
    };
  },
  watch: {
    latestLogs() {
      this.scrollLogsToBottom();
    }
  },
  computed: {
    name() {
      return this.data;
    }
  },
  methods: {
    scrollLogsToBottom() {
      this.$nextTick(() => {
        const logsContainer = document.querySelector('.logs-container');

        logsContainer.scrollTop = logsContainer.scrollHeight;
      });
    },
    generateKey(data) {
      const randomize = Math.random() * 10000;

      return `key_${ randomize }_${ data }`;
    },
    async downloadData(btnCb) {
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();
      const fileName = `rancher-diagnostic-data-${ date }-${ time.replaceAll(':', '_') }.json`;
      const data = {
        systemInformation: this.systemInformation,
        logs:              this.latestLogs,
        storeMapping:      this.parseStoreData(this.storeMapping),
        resourceCounts:    this.finalCounts
      };

      if (this.includeResponseTimes) {
        const responseTimes = await this.gatherResponseTimes();

        data.responseTimes = responseTimes;
      }

      downloadFile(fileName, JSON.stringify(data), 'application/json')
        .then(() => btnCb(true))
        .catch(() => btnCb(false));
    },
    toggleTable(area) {
      const itemIndex = this.finalCounts.findIndex(item => item.id === area);

      this.finalCounts[itemIndex].isTableVisible = !this.finalCounts[itemIndex].isTableVisible;
    },
    async gatherResponseTimes() {
      return await Promise.all(this.topTenForResponseTime.map((item) => {
        const t = Date.now();

        return this.$store.dispatch('management/request', { url: `/k8s/clusters/${ item.capiId }/v1/${ item.resource }` })
          .then(() => ({
            outcome: 'success', item, durationMs: Date.now() - t
          }))
          .catch(() => ({
            outcome: 'error', item, durationMs: Date.now() - t
          }));
      })).then((responseTimes) => {
        return responseTimes;
      });
    },
    parseStoreData(storeData) {
      // clear potencial sensitive data
      const disallowedDataKeys = [
        'aws',
        'digitalocean',
        'linode',
      ];

      const clearListsKeys = [
        'management',
        'rancher',
        'cluster',
        'harvester',
        'epinio',
        'elemental',
      ];

      disallowedDataKeys.forEach((key) => {
        if (storeData[key]) {
          delete storeData[key];
        }
      });

      clearListsKeys.forEach((key) => {
        if (storeData[key] && storeData[key].types && Object.keys(storeData[key].types).length) {
          Object.keys(storeData[key].types).forEach((k) => {
            if (storeData[key].types[k]?.list) {
              storeData[key].types[k].count = storeData[key].types[k]?.list.length;
              delete storeData[key].types[k]?.list;
            }
          });
        }
      });

      return storeData;
    }
  },
};
</script>

<template>
  <div>
    <div class="title-block mt-20 mb-40">
      <h1
        v-t="'about.diagnostic.title'"
        class="mt-20 mb-40"
      />
      <div>
        <Checkbox
          v-model="includeResponseTimes"
          v-tooltip.left="t('about.diagnostic.checkboxTooltip')"
          :label="t('about.diagnostic.checkboxLabel')"
        />
        <AsyncButton
          mode="diagnostic"
          @click="downloadData"
        />
      </div>
    </div>
    <div class="mb-40">
      <h2 class="mb-20">
        {{ t('about.diagnostic.systemInformation.subtitle') }}
      </h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, objKey) in systemInformation" :key="objKey">
            <td>{{ item.label }}</td>
            <td>{{ item.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mb-40">
      <h2 class="mb-20">
        {{ t('about.diagnostic.logs.subtitle') }}
      </h2>
      <ul class="logs-container">
        <li
          v-for="logEntry in latestLogs"
          :key="generateKey(logEntry.timestamp)"
          :class="logEntry.type"
        >
          <span class="log-entry-type">{{ logEntry.type }} :: </span>
          <span
            v-for="(arg, i) in logEntry.data"
            :key="i"
          >{{ arg }}</span>
        </li>
      </ul>
    </div>
    <div class="mb-40">
      <h2 class="mb-20">
        {{ t('about.diagnostic.resourceCounts.subtitle') }}
      </h2>
      <div class="resources-count-container">
        <table
          v-for="cluster in finalCounts"
          :key="cluster.id"
          class="full-width"
        >
          <thead @click="toggleTable(cluster.id)">
            <th colspan="2">
              <div>
                <span>{{ cluster.id }}</span>
                <i
                  class="icon"
                  :class="{
                    'icon-chevron-down': !cluster.isTableVisible,
                    'icon-chevron-up': cluster.isTableVisible
                  }"
                ></i>
              </div>
            </th>
          </thead>
          <tbody v-show="cluster.isTableVisible">
            <tr v-for="item in cluster.counts" :key="item.resource">
              <td>{{ item.resource }}</td>
              <td>{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-block {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    margin: 0 !important;
  }

  div {
    display: flex;
    align-items: center;
  }
}

table {
  border-collapse: collapse;
  overflow: hidden;
  border-radius: var(--border-radius);

  &.full-width {
    border-radius: 0 !important;
    min-width: 60%;

    thead {
      cursor: pointer;

      th div {
          display: flex;
          align-items: center;
          justify-content: space-between;
      }
    }
  }

  tr > td:first-of-type {
    width: 20%;
  }

  th, td {
    border: 1px solid var(--border);
    padding: 8px 5px;
    min-width: 150px;
    text-align: left;
  }

  th {
    background-color: var(--sortable-table-top-divider);
    border-bottom: 1px solid var(--sortable-table-top-divider);
  }

  a {
    cursor: pointer;
  }

  .os {
    display: flex;
    align-items: center;
  }
}

.logs-container {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #FFF;
  border: 1px solid var(--body-text);
  height: 300px;
  overflow-x: hidden;
  overflow-y: auto;

  li {
    font-family: $mono-font;
    font-size: 12px;
    margin: 0;
    padding: 10px 20px;
    border-bottom: 1px solid #ccc;

    &.log {
      color: #000;
    }

    &.warn {
      background-color: LightGoldenRodYellow;
      color: SaddleBrown;
    }

    &.info {
      background-color: Azure;
      color: blue;
    }

    &.error {
      background-color: MistyRose;
      color: red;
    }

    &:last-child {
      border-bottom: none;
    }

    .log-entry-type {
      font-weight: bold;
    }
  }
}

.resources-count-container {
  table:nth-child(even) {
    th {
      background-color: rgb(239, 239, 239);
      color: #000;
    }
  }
}
</style>
