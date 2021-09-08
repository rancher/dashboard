<script>
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import MessageLink from '@/components/MessageLink';
import ResourceTable from '@/components/ResourceTable';

import {
  NAME, NETWORK_TYPE, NETWORK_VLAN, AGE, NAMESPACE
} from '@/config/table-headers';
import { HCI } from '@/config/types';

import { findBy } from '@/utils/array';
import { allHash } from '@/utils/promise';

export default {
  name:       'LNetworks',
  components: {
    ResourceTable, Banner, Loading, MessageLink
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    const hash = await allHash({
      clusterNetworkSetting:  this.$store.dispatch('virtual/findAll', { type: HCI.CLUSTER_NETWORK }),
      hostNetworks:           this.$store.dispatch('virtual/findAll', { type: HCI.NODE_NETWORK }),
      // hosts:                  this.$store.dispatch('virtual/findAll', { type: NODE }),
      rows:                   this.$store.dispatch('virtual/findAll', { type: HCI.NETWORK_ATTACHMENT }),
    });

    this.rows = hash.rows;
    // this.hosts = hash.hosts;
    this.hostNetworks = hash.hostNetworks;
    this.clusterNetworkSetting = hash.clusterNetworkSetting;
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
        NETWORK_TYPE,
        NETWORK_VLAN,
        AGE
      ];
    },

    isVlanDisable() {
      const vlan = findBy((this.clusterNetworkSetting || []), 'metadata.name', 'vlan') || {};

      return !vlan.canUseVlan;
    },

    abnormalNetwork() {
      const notReadyCrd = this.hostNetworks.filter( O => !O.isReady);

      return notReadyCrd.map( O => O.linkMessage);
    },

    // disableCreate() {
    //   const hostsLength = this.hosts.length;
    //   const abnormalNetworkLength = this.abnormalNetwork.length;

    //   return this.isVlanDisable || !(hostsLength - abnormalNetworkLength);
    // }
  },

  // watch: {
  //   disableCreate: {
  //     handler(neu) {
  //       const type = this.$route.params.resource;

  //       this.$store.commit('virtual/setConfig', {
  //         type,
  //         data: { disableCreateButton: neu }
  //       });
  //     },
  //     immediate: true
  //   }
  // },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <template v-if="isVlanDisable">
      <Banner color="error">
        <MessageLink
          :to="to"
          prefix-label="harvester.network.message.premise.prefix"
          middle-label="harvester.network.message.premise.middle"
          suffic-label="harvester.network.message.premise.suffic"
        />
      </Banner>
    </template>

    <template v-else>
      <Banner color="info">
        <MessageLink
          :to="to"
          prefix-label="harvester.network.message.viewSetting.prefix"
          middle-label="harvester.network.message.viewSetting.middle"
          suffic-label="harvester.network.message.viewSetting.suffic"
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
