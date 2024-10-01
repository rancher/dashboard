<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { NORMAN, SECRET } from '@shell/config/types';
import {
  AGE_NORMAN,
  DESCRIPTION,
  ID_UNLINKED,
  NAME_UNLINKED,
} from '@shell/config/table-headers';
import { allHash } from 'utils/promise';
import { Banner } from '@components/Banner';

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead,
    Banner
  },

  async fetch() {
    const promises = {};

    if (this.$store.getters['management/schemaFor'](SECRET) && !this.$store.getters[`cluster/paginationEnabled`](SECRET)) {
      // Having secrets allows showing the public portion of more types but not all users can see them.
      promises.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }
    promises.allCredentials = this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

    const hash = await allHash(promises);

    this.allCredentials = hash.allCredentials;
    // This can be optimized in future to to a quick fetch for those with annotation `"provisioning.cattle.io/driver": "harvester"`
    this.hasHarvester = !!this.allCredentials.find((cc) => !!cc.harvestercredentialConfig);
  },

  data() {
    return {
      allCredentials: null,
      resource:       NORMAN.CLOUD_CREDENTIAL,
      schema:         this.$store.getters['rancher/schemaFor'](NORMAN.CLOUD_CREDENTIAL),
    };
  },

  computed: {
    rows() {
      return this.allCredentials || [];
    },

    headers() {
      const headers = [
        ID_UNLINKED,
        NAME_UNLINKED,
        {
          name:      'apikey',
          labelKey:  'tableHeaders.apikey',
          value:     'publicData',
          sort:      'publicData',
          search:    'publicData',
          formatter: 'CloudCredPublicData',
        },
        DESCRIPTION,
      ];

      if (this.hasHarvester) {
        headers.push({
          name:      'expiresDate',
          labelKey:  'tableHeaders.expires',
          value:     'expires',
          sort:      'expiresForSort',
          formatter: 'CloudCredExpired',
        });
      }

      headers.push(AGE_NORMAN);

      return headers;
    },

    createLocation() {
      return {
        name:   'c-cluster-manager-cloudCredential-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource,
        },
      };
    },

    expiredData() {
      const counts = this.allCredentials.reduce((res, cc) => {
        const expireData = cc.expireData;

        if (expireData?.expiring) {
          res.expiring++;
        }
        if (expireData?.expired) {
          res.expired++;
        }

        return res;
      }, {
        expiring: 0,
        expired:  0
      });

      return {
        expiring: counts.expiring ? this.t('manager.cloudCredentials.banners.expiring', { count: counts.expiring }) : '',
        expired:  counts.expired ? this.t('manager.cloudCredentials.banners.expired', { count: counts.expired }) : '',
      };
    }
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      :type-display="t('manager.cloudCredentials.label')"
    />
    <Banner
      v-if="expiredData.expiring"
      data-testid="cert-expiring-banner"
      color="warning"
      :label="expiredData.expiring"
    />
    <Banner
      v-if="expiredData.expired"
      color="error"
      :label="expiredData.expired"
    />

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :namespaced="false"
      group-by="providerDisplay"
    >
      <template #cell:id="{row}">
        {{ row.id.replace('cattle-global-data:', '') }}
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  margin: 0 0 10px 0
}
</style>
