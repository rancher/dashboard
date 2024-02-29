
<script>
import IconMessage from '@shell/components/IconMessage';

export default {
  weight: 100,

  components: { IconMessage },

  data() {
    return { error: null };
  },

  mounted() {
    this.$emit('update', {
      loading: false,
      ready:   false,
      hidden:  true,
    });
  },

  methods: {
    uninstall(buttonCb) {
      this.$store.dispatch('cluster/promptModal', {
        component:      'GenericPrompt',
        componentProps: {
          applyMode:   'uninstall',
          applyAction: async(buttonDone) => {
            await this.$store.getters['currentCluster'].doAction('disableMonitoring');

            this.$emit('update', { ready: true, hidden: true });
            buttonDone(true);
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
    <IconMessage
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
          v-clean-html="t('monitoring.installSteps.uninstallV1.success2')"
          class="mt-10"
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
