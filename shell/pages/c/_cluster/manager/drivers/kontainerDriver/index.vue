<script>
import { NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
export default {
  name:       'KontainerDrivers',
  components: {
    ResourceTable, Loading, Masthead, AsyncButton
  },

  async fetch() {
    this.allDrivers = await this.$store.dispatch('rancher/findAll', { type: NORMAN.KONTAINER_DRIVER }, { root: true });
  },

  data() {
    return {
      allDrivers:                       null,
      canRefreshK8sMetadata:            true,
      resource:                         NORMAN.KONTAINER_DRIVER,
      schema:                           this.$store.getters['rancher/schemaFor'](NORMAN.KONTAINER_DRIVER),
      useQueryParamsForSimpleFiltering: false,
      forceUpdateLiveAndDelayed:        10
    };
  },
  computed: {
    rows() {
      return this.allDrivers || [];
    },
  },
  methods: {
    async refreshK8sMetadata(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:    '/v3/kontainerdrivers?action=refresh',
          method: 'post',
          data:   { },
        });

        buttonDone(true);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing kontainer drivers', err }, { root: true });
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('drivers.kontainer.title')"
    >
      <template #extraActions>
        <AsyncButton
          v-if="canRefreshK8sMetadata"
          mode="refresh"
          :action-label="t('drivers.actions.refresh')"
          :waiting-label="t('drivers.actions.refresh')"
          :success-label="t('drivers.actions.refresh')"
          :error-label="t('drivers.actions.refresh')"
          :data-testid="'kontainer-driver-refresh'"
          @click="refreshK8sMetadata"
        />
      </template>
    </Masthead>
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :tableActions="true"
      :data-testid="'kontainer-driver-list'"
    >
      <template #cell:name="{row}">
        <span>{{ row.nameDisplay }}</span>
        <div
          v-if="row.description"
          class="description text-muted text-small"
        >
          {{ row.description }}
        </div>
      </template>
    </ResourceTable>
  </div>
</template>
