
<script>
import { haveV1Monitoring, haveV1MonitoringWorkloads } from '@shell/utils/monitoring';
import AsyncButton from '@shell/components/AsyncButton';
import IconMessage from '@shell/components/IconMessage';

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
      haveV1Monitoring: false,
      error:            null,
    };
  },

  mounted() {
    this.haveV1Monitoring = haveV1Monitoring(this.$store.getters);
    this.$emit('update', {
      loading: false,
      ready:   false,
      hidden:  !this.haveV1Monitoring,
    });
  },

  methods: {
    uninstall(buttonCb) {
      this.$store.dispatch('cluster/promptModal', {
        component: 'GenericPrompt',
        resources: {
          applyMode:   'uninstall',
          applyAction: async(buttonDone) => {
            await this.$store.getters['currentCluster'].doAction('disableMonitoring');

            for (let index = 0; index < 30; index++) {
            // Wait 30 seconds for the containers to go
              const hasV1Monitoring = haveV1Monitoring(this.$store.getters);
              const hasV1MonitoringWorkloads = await haveV1MonitoringWorkloads(this.$store);

              if ((!hasV1Monitoring && !hasV1MonitoringWorkloads)) {
                this.$emit('update', { ready: true, hidden: true });
                this.haveV1Monitoring = false;

                buttonDone(true);

                return;
              }
              await delay(1000);
            }

            throw new Error(`Failed to uninstall: timed out`);
          },
          title: this.t('promptRemove.title', {}, true),
          body:  this.t('monitoring.installSteps.uninstallV1.promptDescription', {}, true),
        },
      });
      buttonCb(true);
    },
  }
};

</script>
<template>
  <div class="v1-monitoring">
    <template v-if="haveV1Monitoring">
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
          <p
            class="mt-10"
            v-html="t('monitoring.installSteps.uninstallV1.warning2', {}, true)"
          />
        </template>
      </IconMessage>
      <AsyncButton
        mode="uninstall"
        :delay="0"
        @click="uninstall"
      />
    </template>
    <IconMessage
      v-else
      class="mt-40"
      icon="icon-checkmark"
      :vertical="true"
      icon-state="success"
    >
      <template #message>
        <p class="">
          {{ t('monitoring.installSteps.uninstallV1.success1') }}
        </p>
        <p
          class="mt-10"
          v-html="t('monitoring.installSteps.uninstallV1.success2')"
        />
      </template>
    </IconMessage>
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
