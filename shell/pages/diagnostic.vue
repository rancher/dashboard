<script>
// import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { COUNT } from '@shell/config/types';
// import { getVendor } from '@shell/config/private-label';
// import { downloadFile } from '@shell/utils/download';

export default {
  layout:     'plain',
  components: { BackLink },
  mixins:     [BackRoute],
  async fetch() {
    this.counts = await this.$store.dispatch('management/findAll', { type: COUNT });
  },
  data() {
    return {
      windowObj:  window,
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
    }
  },
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1
      v-t="'about.diagnostic.title'"
      class="mt-20 mb-40"
    />
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
          <tr>
            <td>OS</td>
            <td>{{ windowObj.navigator.platform }}</td>
          </tr>
          <tr>
            <td>Browser code name</td>
            <td>{{ windowObj.navigator.appCodeName }}</td>
          </tr>
          <tr>
            <td>Browser name</td>
            <td>{{ windowObj.navigator.appName }}</td>
          </tr>
          <tr>
            <td>Browser version</td>
            <td>{{ windowObj.navigator.appVersion }}</td>
          </tr>
          <tr>
            <td>Browser user agent</td>
            <td>{{ windowObj.navigator.userAgent }}</td>
          </tr>
          <tr>
            <td>Browser language</td>
            <td>{{ windowObj.navigator.language }}</td>
          </tr>
          <tr>
            <td>Device memory</td>
            <td>{{ windowObj.navigator.deviceMemory }}</td>
          </tr>
          <tr>
            <td>Memory JS Heap Size limit</td>
            <td>{{ windowObj.performance.memory.jsHeapSizeLimit }}</td>
          </tr>
          <tr>
            <td>Memory Total JS Heap Size</td>
            <td>{{ windowObj.performance.memory.totalJSHeapSize }}</td>
          </tr>
          <tr>
            <td>Memory Used JS Heap Size</td>
            <td>{{ windowObj.performance.memory.usedJSHeapSize }}</td>
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
