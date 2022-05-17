<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { MONITORING } from '@shell/config/types';

export default {
  name:       'ListApps',
  components: {
    Banner, Loading, ResourceTable
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    try {
      await this.$store.dispatch('cluster/findAll', { type: MONITORING.ALERTMANAGERCONFIG });
      this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
    } catch (err) {
      throw new Error(err);
    }
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="rows.length > 0">
    <Banner color="info">
      {{ t('monitoring.alertmanagerConfig.description') }}
    </Banner>
    <ResourceTable
      :schema="schema"
      :rows="rows"
    />
  </div>

  <div
    v-else
    class="empty"
  >
    <i class="icon icon-monitoring mb-10" />
    <h2>{{ t('monitoring.alertmanagerConfig.empty') }}</h2>
    <h3 class="mb-30">
      {{ t('monitoring.alertmanagerConfig.getStarted') }}
    </h3>
  </div>
</template>

<style lang="scss" scoped>
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 6em;
  min-height: 100%;
}

i {
  font-size: 10em;
  opacity: 50%;
  margin: 0;
}

h2 {
  margin: 0;
}

h3 {
  margin-top: 2em;
}

</style>
