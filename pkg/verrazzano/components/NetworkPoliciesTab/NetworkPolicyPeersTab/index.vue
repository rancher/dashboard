<script>
// Added by Verrazzano
import NetworkPolicyPeerTab
  from '@pkg/components/NetworkPoliciesTab/NetworkPolicyPeersTab/NetworkPolicyPeerTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'NetworkPolicyPeersTab',
  components: {
    NetworkPolicyPeerTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const networkPolicyPeers = this.value.map((peer) => {
      const newPeer = this.clone(peer);

      newPeer._id = randomStr(4);

      return newPeer;
    });

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      networkPolicyPeers,
    };
  },
  methods: {
    update() {
      const networkPolicyPeers = [];

      this.networkPolicyPeers.forEach((peer) => {
        const newPeer = this.clone(peer);

        delete newPeer._id;

        networkPolicyPeers.push(newPeer);
      });
      this.$emit('input', networkPolicyPeers);
    },
    getPeerLabel(index) {
      return `${ this.treeTabLabel } ${ index + 1 }`;
    },
    getPeerTabName(index) {
      return this.createTabName(this.treeTabName, `${ this.treeTabLabel }${ index + 1 }`);
    },
    addPeer() {
      this.networkPolicyPeers.push({ _id: randomStr(4) });
    },
    removePeer(index) {
      this.networkPolicyPeers.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyPeers');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <button
            type="button"
            class="btn role-tertiary add"
            data-testid="add-item"
            :disabled="isView"
            @click="addPeer()"
          >
            {{ t('verrazzano.common.buttons.addNetworkPolicyPeer') }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NetworkPolicyPeerTab
        v-for="(networkPolicyPeer, idx) in networkPolicyPeers"
        :key="networkPolicyPeer._id"
        :value="networkPolicyPeer"
        :mode="mode"
        :tab-label="getPeerLabel(idx)"
        :tab-name="getPeerTabName(idx)"
        @input="queueUpdate"
        @delete="removePeer(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
