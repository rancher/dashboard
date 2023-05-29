<template>
  <div>
    <!-- <label>{{ t('clusterConnectMode.title') }}</label> -->
    <div class="connect-mode">
      <div class="column-span-2">
        <label>
          {{ t('clusterConnectMode.connectMode.label') }}:
        </label>
        <span class="column-span-3">{{ mode }}</span>
      </div>
      <div>
        <label>
          {{ t('clusterConnectMode.connectStatus.timeout') }}:
        </label>
        <span>{{ timeout }}{{ t('suffix.seconds', {count: timeout}) }}</span>
      </div>
      <div>
        <label>
          {{ t('clusterConnectMode.connectStatus.apiEndpoint') }}:
        </label>
        <span>{{ apiEndpoint }}</span>
      </div>
      <label>
        {{ t('clusterConnectMode.apiEndpoint.overrideLabel') }}:
      </label>
      <div />
      <ApiEndpoints
        class="column-span-2"
        :value="apiEndpoints"
        :status-map="statusMap"
      />
    </div>
    <div
      v-for="(err, idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        :label="err"
      />
    </div>
  </div>
</template>

<script>
import ApiEndpoints from '@shell/components/form/ApiEndpoints.vue';
import { Banner } from '@components/Banner';
import { stringify } from '@shell/utils/error';

export default {
  props: {
    cluster: {
      type:    Object,
      require: true,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      connectMode:     {},
      timer:           null,
      abortController: null,
      errors:          [],
    };
  },
  computed: {
    statusMap() {
      const apiEndpoints = this.connectMode?.apiEndpoints;
      const endpointStatus = this.connectMode?.endpointStatus;

      if (!apiEndpoints || !endpointStatus) {
        return {};
      }

      return endpointStatus.reduce((t, c, i) => {
        t[apiEndpoints[i]] = c;

        return t;
      }, {});
    },
    apiEndpoints() {
      if (!this.connectMode?.apiEndpoints) {
        return [];
      }

      return this.connectMode.apiEndpoints;
    },
    apiEndpoint() {
      return this.cluster?.status?.apiEndpoint;
    },
    timeout() {
      const timeout = this.connectMode?.timeout;

      if ([undefined, null].includes(timeout)) {
        return '';
      }

      return Math.round(timeout / 10 ** 9);
    },
    mode() {
      if (this.connectMode?.directAccess === 'true') {
        return 'Tunnel & Direct';
      }

      return 'Tunnel';
    }
  },
  methods: {
    async fetchConnectionConfig(signal) {
      if (signal?.aborted === true) {
        return;
      }
      try {
        const connectMode = await this.$store.dispatch('rancher/request', {
          url:    `/v3/clusters/${ this.cluster?.id }?action=viewConnectionConfig`,
          method: 'post',
          signal
        });

        this.connectMode = connectMode;
        this.errors = [];
      } catch (err) {
        if (err.name === 'AbortError') { // handle abort()
          return;
        }
        this.errors = [stringify(err)];
      }
      const t = setTimeout(() => {
        this.fetchConnectionConfig(signal);
      }, 5000);

      this.timer = t;
    },

    startTimer() {
      if (this.abortController) {
        this.abortController.abort();
      }
      const controller = new AbortController();

      this.abortController = controller;
      this.fetchConnectionConfig(controller.signal);
    },
    stopTimer() {
      clearTimeout(this.timer);
      this.timer = null;
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    }
  },
  mounted() {
    this.startTimer();
  },
  beforeDestroy() {
    this.stopTimer();
  },
  components: {
    ApiEndpoints,
    Banner,
  }
};
</script>
<style scoped>
.connect-mode {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 60px;
  row-gap: 10px;
}
.column-span-2 {
  grid-column: span 2;
}

</style>
