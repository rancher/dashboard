<script>
import { createNamespacedHelpers, mapGetters } from 'vuex';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { exceptionToErrorsArray } from '@/utils/error';

const { mapState } = createNamespacedHelpers('node');

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  data() {
    return { errors: [] };
  },

  computed:   {
    ...mapState(['isShowMaintenance', 'actionResources']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    isShowMaintenance: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('maintenance-modal');
          });
        } else {
          this.$modal.hide('maintenance-modal');
        }
      },
      immediate: true
    },
  },

  methods: {
    close() {
      this.$store.commit('node/toggleMaintenanceModal');
    },

    apply(buttonDone) {
      this.errors = [];

      try {
        this.actionResources.doAction('enableMaintenanceMode', {});
        buttonDone(true);
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <modal
    class="maintenance-modal"
    name="maintenance-modal"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :scrollable="true"
    :click-to-close="false"
  >
    <Card>
      <h4 slot="title" class="text-default-text">
        {{ t('harvester.hostPage.enableMaintenance.title') }}
      </h4>

      <div slot="body" class="pl-10 pr-10">
        <Banner color="warning" :label="t('harvester.hostPage.enableMaintenance.protip')" class="mt-20" />
        <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      </div>

      <div slot="actions">
        <button class="btn role-secondary" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="apply"
          @click="apply"
        />
      </div>
    </Card>
  </modal>
</template>

<style lang='scss'>
  .maintenance-modal {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }
  }
</style>
