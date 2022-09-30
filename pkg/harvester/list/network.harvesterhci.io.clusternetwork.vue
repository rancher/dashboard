<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';

import { allHash } from '@shell/utils/promise';
import { STATE, AGE, NAME } from '@shell/config/table-headers';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';

import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../config/harvester';
import { CLUSTER_NETWORK } from '../config/query-params';
import { HCI } from '../types';

export default {
  name: 'ListHarvesterVLANConfigs',

  components: {
    ResourceTable,
    Loading,
    Masthead,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({
      configs:         this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.VLAN_CONFIG }),
      clusterNetworks: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.CLUSTER_NETWORK }),
    });
  },

  data() {
    return { HCI };
  },

  computed: {
    groupPreference: mapPref(GROUP_RESOURCES),

    headers() {
      return [
        STATE,
        NAME,
        {
          name:     'type',
          labelKey: 'tableHeaders.type',
          value:    'typeDisplay',
          getValue: row => row.typeDisplay,
          sort:     ['typeDisplay'],
        },
        AGE,
      ];
    },

    rows() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const configs = this.$store.getters[`${ inStore }/all`](HCI.VLAN_CONFIG);

      return configs;
    },

    vlanConfigSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](HCI.VLAN_CONFIG);
    },

    clusterNetworkSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](HCI.CLUSTER_NETWORK);
    },

    isClusterNetworkCreatable() {
      return (this.clusterNetworkSchema?.collectionMethods || []).includes('POST');
    },

    createClusterNetworkLocation() {
      const location = {
        name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
        params: {
          product:  HARVESTER_PRODUCT,
          resource: HCI.CLUSTER_NETWORK,
        },
      };

      return location;
    },

    clusterNetworkWithoutConfigs() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const clusterNetworks = this.$store.getters[`${ inStore }/all`](HCI.CLUSTER_NETWORK);

      const out = clusterNetworks.filter((network) => {
        return !this.rows.find(config => config?.spec?.clusterNetwork === network.id);
      });

      return out;
    },

    rowsWithFakeClusterNetworks() {
      const fakeRows = this.clusterNetworkWithoutConfigs.map((network) => {
        return {
          groupByLabel:          network.id,
          isFake:                true,
          mainRowKey:            network.id,
          nameDisplay:           network.id,
          groupByClusterNetwork: network.id,
          availableActions:      []
        };
      });

      return [...this.rows, ...fakeRows];
    },
  },

  methods: {
    showClusterNetworkActionButton(group) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const clusterNetwork = group.key;

      const resource = this.$store.getters[`${ inStore }/byId`](HCI.CLUSTER_NETWORK, clusterNetwork);

      return !!resource;
    },

    showClusterNetworkAction(event, group) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const clusterNetwork = group.key;

      const resource = this.$store.getters[`${ inStore }/byId`](HCI.CLUSTER_NETWORK, clusterNetwork);

      this.$store.commit(`action-menu/show`, {
        resources: [resource],
        elem:      event.target
      });
    },

    createVlanConfigLocation(group) {
      const clusterNetwork = group.key;

      const location = {
        name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
        params: {
          product:  HARVESTER_PRODUCT,
          resource: HCI.VLAN_CONFIG,
        },
      };

      location.query = { [CLUSTER_NETWORK]: clusterNetwork };

      return location;
    },

    slotName(clusterNetwork) {
      return `main-row:${ clusterNetwork }`;
    },

    groupLabel(group) {
      const row = group.rows[0];

      if (row.isFake) {
        return `${ this.t('harvester.network.clusterNetwork.label') }: ${ row.nameDisplay }`;
      }

      return `${ this.t('harvester.network.clusterNetwork.label') }: ${ group.key }`;
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <Masthead
        :schema="clusterNetworkSchema"
        :type-display="t('harvester.clusterNetwork.title')"
        :resource="HCI.CLUSTER_NETWORK"
        :create-location="createClusterNetworkLocation"
        :create-button-label="t('harvester.clusterNetwork.create.button.label')"
      />
      <ResourceTable
        :rows="rowsWithFakeClusterNetworks"
        :headers="headers"
        :groupable="true"
        :schema="vlanConfigSchema"
        group-by="groupByClusterNetwork"
      >
        <template #header-middle>
          <div />
        </template>
        <template #group-by="{group}">
          <div class="group-bar">
            <div class="group-tab">
              <span>
                {{ groupLabel(group) }}
              </span>
            </div>

            <div class="right">
              <n-link
                v-if="isClusterNetworkCreatable && group.key !== 'mgmt'"
                class="btn btn-sm role-secondary mr-5"
                :to="createVlanConfigLocation(group)"
              >
                {{ t('harvester.vlanConfig.createNetworkConfig') }}
              </n-link>
              <button
                type="button"
                class="btn btn-sm role-multi-action actions mr-10"
                :class="{invisible: !showClusterNetworkActionButton(group)}"
                @click="showClusterNetworkAction($event, group)"
              >
                <i class="icon icon-actions" />
              </button>
            </div>
          </div>
        </template>
        <template v-for="clusterNetwork in clusterNetworkWithoutConfigs" v-slot:[slotName(clusterNetwork.id)]>
          <tr :key="clusterNetwork.id" class="main-row">
            <td class="empty text-center" colspan="12">
              {{ clusterNetwork.id === 'mgmt' ? t('harvester.clusterNetwork.mgmt') : t('harvester.clusterNetwork.clusterNetwork') }}
            </td>
          </tr>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  .right {
    margin-top: 5px;
    margin-bottom: 3px;
  }

  .group-tab {
    &, &::after {
        height: 50px;
    }

    &::after {
        right: -20px;
    }

    SPAN {
      color: var(--body-text) !important;
    }
  }
}
</style>
