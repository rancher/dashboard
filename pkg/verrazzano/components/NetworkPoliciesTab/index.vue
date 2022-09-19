<script>
// Added by Verrazzano
import NetworkPolicyTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'NetworkPoliciesTab',
  components: {
    NetworkPolicyTab,
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
    const networkPolicies = this.value.map((policy) => {
      const newPolicy = this.clone(policy);

      newPolicy._id = randomStr(4);

      return newPolicy;
    });

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      networkPolicies,
    };
  },
  methods: {
    update() {
      const networkPolicies = [];

      this.networkPolicies.forEach((peer) => {
        const newPeer = this.clone(peer);

        delete newPeer._id;

        networkPolicies.push(newPeer);
      });
      this.$emit('input', networkPolicies);
    },
    getPolicyLabel(index) {
      return `${ this.t('verrazzano.common.tabs.policy') } ${ index + 1 }`;
    },
    getPolicyTabName(index) {
      return this.createTabName(this.treeTabName, `policy${ index + 1 }`);
    },
    addPolicy() {
      this.networkPolicies.push({ _id: randomStr(4) });
    },
    removePolicy(index) {
      this.networkPolicies.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicies');
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
            @click="addPolicy()"
          >
            {{ t('verrazzano.common.buttons.addNetworkPolicy') }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NetworkPolicyTab
        v-for="(networkPolicy, idx) in networkPolicies"
        :key="networkPolicy._id"
        :value="networkPolicy"
        :mode="mode"
        :tab-name="getPolicyTabName(idx)"
        :tab-label="getPolicyLabel(idx)"
        @input="queueUpdate"
        @delete="removePolicy(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
