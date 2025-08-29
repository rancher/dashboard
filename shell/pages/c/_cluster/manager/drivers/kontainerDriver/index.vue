<script>
import { NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'KontainerDrivers',
  components: {
    ResourceTable, Loading, Masthead, AsyncButton, Banner
  },

  async fetch() {
    this.allDrivers = await this.$store.dispatch('rancher/findAll', { type: NORMAN.KONTAINER_DRIVER }, { root: true });

    // Work out if the user has the admin role
    const v3User = this.$store.getters['auth/v3User'] || {};

    if (v3User?.links?.globalRoleBindings) {
      try {
        // Non-blocking fetch to get the user's global roles to see if they have the 'admin' role
        this.$store.dispatch('management/request', { url: v3User.links.globalRoleBindings }).then((response) => {
          const data = response?.data || [];
          const isAdmin = !!data.find((role) => role.globalRoleId === 'admin');

          this.showDeprecationBanner = isAdmin;
        });
      } catch {}
    }
  },

  data() {
    return {
      allDrivers:                       null,
      canRefreshK8sMetadata:            true,
      resource:                         NORMAN.KONTAINER_DRIVER,
      schema:                           this.$store.getters['rancher/schemaFor'](NORMAN.KONTAINER_DRIVER),
      useQueryParamsForSimpleFiltering: false,
      forceUpdateLiveAndDelayed:        10,
      showDeprecationBanner:            false,
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
    <Banner
      v-if="showDeprecationBanner"
      color="warning"
      label-key="drivers.kontainer.emberDeprecationMessage"
      data-testid="kontainer-driver-ember-deprecation-banner"
    />
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
