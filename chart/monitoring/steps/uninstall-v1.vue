
<script>
import { haveV1Monitoring, haveV1MonitoringWorkloads } from '@/utils/monitoring';
import AsyncButton from '@/components/AsyncButton';
import IconMessage from '@/components/IconMessage';

function delay(t, v) {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, v), t);
  });
}

export default {

  label:   'monitoring.installSteps.uninstallV1.stepTitle',
  subtext: 'monitoring.installSteps.uninstallV1.stepSubtext',
  weight:  100,

  components: {
    AsyncButton,
    IconMessage
  },

  data() {
    return {
      uninstalled: false,
      error:       null,
    };
  },

  mounted() {
    this.$emit('update', {
      loading: false,
      ready:   false,
      hidden:  !haveV1Monitoring(this.$store.getters),
    });
  },

  methods: {
    uninstall(buttonCb) {
      Promise.resolve()
        .then(async() => {
          await this.$store.getters['currentCluster'].doAction('disableMonitoring');

          for (let index = 0; index < 30; index++) {
            // Wait 30 seconds for the containers to go
            const hasV1Monitoring = haveV1Monitoring(this.$store.getters);
            const hasV1MonitoringWorkloads = await haveV1MonitoringWorkloads(this.$store);

            if ((!hasV1Monitoring && !hasV1MonitoringWorkloads)) {
              this.$emit('update', { ready: true });
              buttonCb(true);
              this.uninstalled = true;

              return;
            }
            await delay(1000);
          }
          this.$emit('errors', [`Failed to uninstall: timed out`]);
          buttonCb(false);
        })
        .catch((e) => {
          this.$emit('errors', [`Failed to uninstall: ${ e }`]);
          buttonCb(false);
        });
    },
  }
};

</script>
<template>
  <div class="v1-monitoring">
    <IconMessage
      v-if="uninstalled"
      class="mt-40"
      icon="icon-checkmark"
      :vertical="true"
      icon-state="success"
    >
      <template #message>
        <p class="">
          {{ t('monitoring.installSteps.uninstallV1.success1') }}
        </p>
        <p class="mt-10" v-html="t('monitoring.installSteps.uninstallV1.success2')">
        </p>
      </template>
    </IconMessage>
    <template v-else>
      <IconMessage
        class="mt-40 mb-20"
        icon="icon-warning"
        :vertical="true"
        icon-state="warning"
      >
        <template #message>
          <p>
            {{ t('monitoring.installSteps.uninstallV1.warning1') }}
          </p>
          <p class="mt-10" v-html="t('monitoring.installSteps.uninstallV1.warning2', {}, true)">
          </p>
        </template>
      </IconMessage>
      <AsyncButton
        mode="uninstall"
        :delay="2000"
        :disabled="uninstalled"
        @click="uninstall"
      />
    </template>
  </div>
</template>

<style lang='scss' scoped>
.v1-monitoring {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  p {
    max-width: 900px;
  }
  .btn {
    min-width: 200px;
  }
}
</style>
