<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import MessageLink from '@shell/components/MessageLink';
import ResourceTable from '@shell/components/ResourceTable';

import { NAME, AGE, NAMESPACE } from '@shell/config/table-headers';
import { NETWORK_ATTACHMENT, SCHEMA } from '@shell/config/types';
import { HCI } from '../types';

import { findBy } from '@shell/utils/array';
import { allHash } from '@shell/utils/promise';

const schema = {
  id:         HCI.NETWORK_ATTACHMENT,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.NETWORK_ATTACHMENT,
    namespaced: true
  },
  metadata: { name: HCI.NETWORK_ATTACHMENT },
};

export default {
  name:       'HarvesterListNetworks',
  components: {
    ResourceTable, Banner, Loading, MessageLink
  },

  async fetch() {
    const currentCluster = this.$store.getters['currentCluster'];
    const storeName = currentCluster.isHarvester ? 'harvester' : 'cluster';

    const _hash = { rows: this.$store.dispatch(`${ storeName }/findAll`, { type: NETWORK_ATTACHMENT }) };

    if (this.$store.getters[`${ storeName }/schemaFor`](HCI.NODE_NETWORK)) {
      _hash.hostNetworks = this.$store.dispatch(`${ storeName }/findAll`, { type: HCI.NODE_NETWORK });
    }

    if (this.$store.getters[`${ storeName }/schemaFor`](HCI.CLUSTER_NETWORK)) {
      _hash.clusterNetworkSetting = this.$store.dispatch(`${ storeName }/findAll`, { type: HCI.CLUSTER_NETWORK });
    }

    const hash = await allHash(_hash);

    this.rows = hash.rows;
    this.hostNetworks = hash.hostNetworks || [];
    this.clusterNetworkSetting = hash.clusterNetworkSetting || [];
  },

  data() {
    return {
      hash:                  {},
      rows:                  [],
      hosts:                 [],
      hostNetworks:          [],
      clusterNetworkSetting: [],
      to:                    `${ HCI.CLUSTER_NETWORK }/vlan?mode=edit`
    };
  },

  computed: {
    headers() {
      return [
        NAME,
        NAMESPACE,
        {
          name:      'type',
          value:     'vlanType',
          sort:      'spec.config',
          labelKey:  'tableHeaders.networkType'
        },
        {
          name:      'vlan',
          value:     'vlanId',
          sort:      'spec.config',
          labelKey:  'tableHeaders.networkVlan'
        },
        {
          name:          'connectivity',
          value:         'connectivity',
          labelKey:      'tableHeaders.routeConnectivity',
          formatter:     'BadgeStateFormatter',
          formatterOpts: { arbitrary: true },
          width:         130,
        },
        AGE
      ];
    },

    schema() {
      return schema;
    },

    isVlanDisable() {
      const vlan = findBy((this.clusterNetworkSetting || []), 'metadata.name', 'vlan') || {};

      return !vlan.canUseVlan;
    },

    hasClusterNetwork() {
      return this.$store.getters['harvester/schemaFor'](HCI.CLUSTER_NETWORK);
    },

    abnormalNetwork() {
      const notReadyCrd = this.hostNetworks.filter( O => !O.isReady);

      return notReadyCrd.map( O => O.linkMessage);
    },

  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <template v-if="isVlanDisable && hasClusterNetwork">
      <Banner color="error">
        <MessageLink
          :to="to"
          prefix-label="harvester.network.message.premise.prefix"
          middle-label="harvester.network.message.premise.middle"
          suffix-label="harvester.network.message.premise.suffix"
        />
      </Banner>
    </template>

    <template v-else>
      <Banner v-if="hasClusterNetwork" color="info">
        <MessageLink
          :to="to"
          prefix-label="harvester.network.message.viewSetting.prefix"
          middle-label="harvester.network.message.viewSetting.middle"
          suffix-label="harvester.network.message.viewSetting.suffix"
        />
      </Banner>
    </template>

    <template v-if="abnormalNetwork.length">
      <Banner
        v-for="item in abnormalNetwork"
        :key="item.name"
        color="error"
      >
        <nuxt-link :to="item.to">
          {{ item.name }}:
        </nuxt-link>
        {{ item.message }}
      </Banner>
    </template>

    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      default-sort-by="age"
      :schema="schema"
      :groupable="true"
      :rows="rows"
      key-field="_key"
      v-on="$listeners"
    />
  </div>
</template>
