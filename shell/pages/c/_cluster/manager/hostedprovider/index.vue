<script>
import { MANAGEMENT, HOSTED_PROVIDER } from '@shell/config/types';
import { DEFAULT_PERF_SETTING, PerfSettings, SETTING } from '@shell/config/settings';
import {
  STATE, AGE, NAME, NS_SNAPSHOT_QUOTA, DESCRIPTION
} from '@shell/config/table-headers';
import { isAdminUser } from '@shell/store/type-map';
import ResourceTable from '@shell/components/ResourceTable';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@components/Banner/Banner.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';
import { useStore } from 'vuex';

export default {
  name:       'HostedProviders',
  components: {
    ResourceTable, Loading, Masthead, RcStatusBadge
  },
  async fetch() {
    this.allProviders = await this.$store.dispatch('rancher/findAll', { type: HOSTED_PROVIDER }, { root: true });
    console.log(this.allProviders);
    // await this.$store.dispatch('rancher/findAll', { type: HOSTED_PROVIDER }, { root: true });
  },
  data() {
    return {

      allProviders:                     null,
      resource:                         HOSTED_PROVIDER,
      schema:                           this.$store.getters['rancher/schemaFor'](HOSTED_PROVIDER),
      useQueryParamsForSimpleFiltering: false,
      settings:                         {}
    };
  },
  // computed: {
  //   allProviders() {
  //     return this.$store.getters['rancher/all'](HOSTED_PROVIDER);
  //   }
  // },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('providers.hosted.title')"
      :is-creatable="false"
    />
    <ResourceTable
      :schema="schema"
      :resource="resource"
      :rows="allProviders"
      :tableActions="true"
      :data-testid="'hosted-provider-list'"
      key-field="id"
    >
      <template #cell:name="{row}">
        <div class="col">
          <div class="row prime">
            <span class="mr-10">{{ row.name }}</span>
            <RcStatusBadge
              v-if="row.prime"
              status="success"
            >
              {{ t('providers.hosted.prime') }}
            </RcStatusBadge>
          </div>
          <div
            v-if="row.description"
            class="description text-muted text-small"
          >
            {{ row.description }}
          </div>
        </div>
      </template>
    </ResourceTable>
  </div>
</template>

<style>
.prime {
  align-items: baseline;
}
</style>
