<script>
// import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { COUNT } from '@shell/config/types';
import AsyncButton from '@shell/components/AsyncButton';
import { downloadFile } from '@shell/utils/download';

export default {
  layout:     'plain',
  components: { BackLink, AsyncButton },
  mixins:     [BackRoute],
  async fetch() {
    this.counts = await this.$store.dispatch('management/findAll', { type: COUNT });
  },

  data() {
    const systemInformation = {
      os: {
        label: 'OS',
        value: window?.navigator.platform
      },
      browserCodeName: {
        label: 'Browser code name',
        value: window?.navigator.appCodeName
      },
      browserName: {
        label: 'Browser name',
        value: window?.navigator.appName
      },
      browserVersion: {
        label: 'Browser version',
        value: window?.navigator.appVersion
      },
      browserUserAgent: {
        label: 'Browser user agent',
        value: window?.navigator.userAgent
      },
      browserLanguage: {
        label: 'Browser language',
        value: window?.navigator.language
      },
      deviceMemory: {
        label: 'Device memory',
        value: window?.navigator.deviceMemory
      },
      memJsHeapLimit: {
        label: 'Memory JS Heap Size limit',
        value: window?.performance.memory.jsHeapSizeLimit
      },
      memTotalJsHeapSize: {
        label: 'Memory Total JS Heap Size',
        value: window?.performance.memory.totalJSHeapSize
      },
      memUsedJsHeapSize: {
        label: 'Memory Used JS Heap Size',
        value: window?.performance.memory.usedJSHeapSize
      },
    };

    return {
      systemInformation,
      counts:     null,
      latestLogs: console.logs // eslint-disable-line no-console
    };
  },
  computed: {
    name() {
      return this.data;
    }
  },
  methods: {
    generateKey(data) {
      const randomize = Math.random() * 10000;

      return `key_${ randomize }_${ data }`;
    },
    downloadData(btnCb) {
      const date = new Date().toISOString().split('.')[0];
      const fileName = `diagnostic-data-${ date }`;
      const data = {
        systemInformation: this.systemInformation,
        logs:              this.latestLogs
      };

      downloadFile(fileName, JSON.stringify(data), 'application/json')
        .then(() => btnCb(true))
        .catch(() => btnCb(false));
    },
  },
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <div class="title-block">
      <h1
        v-t="'about.diagnostic.title'"
        class="mt-20 mb-40"
      />
      <AsyncButton mode="download" @click="downloadData" />
    </div>
    <div class="mb-40">
      <h2 class="mb-20">
        System information
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
        Latest logs
      </h2>
      <ul class="logs-container">
        <li
          v-for="logEntry in latestLogs"
          :key="generateKey(logEntry.timestamp)"
          :class="logEntry.type"
        >
          <span class="log-entry-type">{{ logEntry.type }}: </span>
          <span v-for="(arg, i) in logEntry.data" :key="i">{{ arg }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-block {
  display: flex;
  justify-content: space-between;
  align-items: center;

  button {
    height: 30px;
  }
}

table {
  border-collapse: collapse;
  overflow: hidden;
  border-radius: var(--border-radius);

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
  border: 1px solid #000;
  height: 300px;
  overflow-x: hidden;
  overflow-y: auto;

  li {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    margin: 0;
    padding: 10px 20px;
    border-bottom: 1px solid #ccc;

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
</style>
