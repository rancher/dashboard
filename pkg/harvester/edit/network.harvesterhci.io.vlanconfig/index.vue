<script>
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import ArrayList from '@shell/components/form/ArrayList';
import Vue from 'vue';

import CreateEditView from '@shell/mixins/create-edit-view';

import { allHash } from '@shell/utils/promise';
import { NODE } from '@shell/config/types';
import { set } from '@shell/utils/object';
import { HCI } from '../../types';
import { uniq } from '@shell/utils/array';

import NodeSelector from './NodeSelector';

export default {
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    LabeledInput,
    LabeledSelect,
    Tabbed,
    Tab,
    NodeSelector,
    ArrayList,
  },

  mixins: [CreateEditView],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({ clusterNetworks: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.CLUSTER_NETWORK }) });
  },

  data() {
    return {
      createClusterNetwork: false,
      type:                 'vlan',
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.validate);
      this.registerBeforeHook(this.saveClusterNetwork);
    }
  },

  computed: {
    clusterNetworkOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const clusterNetworks = this.$store.getters[`${ inStore }/all`](HCI.CLUSTER_NETWORK) || [];

      const out = clusterNetworks.map((n) => {
        return {
          label: n.id,
          value: n.id,
        };
      });

      return [{
        label: this.t('harvester.network.clusterNetwork.create'),
        value: null,
      }, {
        label:    'divider',
        disabled: true,
        kind:     'divider'
      }, ...out];
    },

    nodeOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const nodes = this.$store.getters[`${ inStore }/all`](NODE);

      return nodes.filter(n => !n.isUnSchedulable).map((node) => {
        return {
          label: node.nameDisplay,
          value: node.id
        };
      });
    },

    mtu: {
      get() {
        return this.value?.spec?.uplink?.linkAttributes?.mtu;
      },

      set(value) {
        set(this.value, 'spec.uplink.linkAttributes.mtu', value);
      }
    },

    bondOptionMode: {
      get() {
        return this.value?.spec?.uplink?.bondOptions?.mode;
      },

      set(value) {
        set(this.value, 'spec.uplink.bondOptions.mode', value);
      },
    },

    miimon: {
      get() {
        return this.value?.spec?.uplink?.bondOptions?.miimon;
      },

      set(value) {
        set(this.value, 'spec.uplink.bondOptions.miimon', value);
      },
    },

    // TODO: It's a temporary modifications, for now only support VLAN.
    // Will be support SR-IOV in the future and feel free change the design
    typeOptions() {
      return [{
        label: 'VLAN',
        value: 'vlan',
      }];
    },

    bondOptions() {
      return [
        'balance-rr',
        'active-backup',
        'balance-xor',
        'broadcast',
        '802.3ad',
        'balance-tlb',
        'balance-alb',
      ];
    },
  },

  methods: {
    selectClusterNetwork(e) {
      if (!e || e.value === null) {
        this.createClusterNetwork = true;

        Vue.nextTick(() => this.$refs.clusterNetwork.focus());
      } else {
        this.createClusterNetwork = false;
      }
    },

    async saveClusterNetwork() {
      const clusterNetwork = this.value.spec.clusterNetwork;
      const inStore = this.$store.getters['currentProduct'].inStore;

      const found = this.$store.getters[`${ inStore }/byId`](HCI.CLUSTER_NETWORK, clusterNetwork);

      if (!found) {
        const newResource = await this.$store.dispatch(`${ inStore }/create`, {
          metadata: { name: clusterNetwork },
          type:     HCI.CLUSTER_NETWORK,
        });

        return await newResource.save();
      } else {
        return Promise.resolve();
      }
    },

    validate() {
      const errors = [];

      const nics = this.value.spec?.uplink?.nics || [];
      const nicRequired = this.t('validation.arrayCountRequired', { key: this.t('harvester.vlanConfig.uplink.nics.label'), count: 1 }, true);

      if (nics.length === 0) {
        errors.push(nicRequired);
      } else {
        nics.map((n) => {
          if (!n) {
            errors.push(nicRequired);
          }
        });
      }

      if (!this.value?.metadata?.name) {
        errors.push(this.t('validation.required', { key: this.t('generic.name') }, true));
      }

      if (!this.value?.spec?.clusterNetwork) {
        errors.push(this.t('validation.required', { key: this.t('harvester.network.clusterNetwork.label') }, true));
      }

      if (errors.length > 0) {
        return Promise.reject(uniq(errors));
      } else {
        return Promise.resolve();
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :namespaced="false"
    />

    <Tabbed
      :side-tabs="true"
    >
      <Tab
        :weight="99"
        name="basic"
        :label="t('generic.basic')"
      >
        <div class="row">
          <div
            v-if="createClusterNetwork"
            class="col span-6"
          >
            <LabeledInput
              ref="clusterNetwork"
              v-model="value.spec.clusterNetwork"
              :label="t('harvester.network.clusterNetwork.label')"
              :mode="mode"
              required
              :placeholder="t('harvester.network.clusterNetwork.createPlaceholder')"
            />
            <button
              aria="Cancel create"
              @click="() => {
                createClusterNetwork = false;
                value.spec.clusterNetwork = '';
              }"
            >
              <i
                v-tooltip="t('generic.cancel')"
                class="icon icon-lg icon-close align-value"
              />
            </button>
          </div>
          <div
            v-else
            class="col span-6"
          >
            <LabeledSelect
              v-model="value.spec.clusterNetwork"
              class="mb-20"
              :label="t('harvester.network.clusterNetwork.label')"
              required
              :options="clusterNetworkOptions"
              :mode="mode"
              :tooltip="t('harvester.network.clusterNetwork.toolTip')"
              :placeholder="t('harvester.network.clusterNetwork.selectOrCreatePlaceholder')"
              @selecting="selectClusterNetwork"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              :value="type"
              label="Type"
              :options="typeOptions"
              class="mb-20"
              :disabled="true"
            />
          </div>
        </div>
      </Tab>

      <Tab
        name="nodeSelector"
        :label="t('harvester.vlanConfig.titles.nodeSelector')"
        :weight="89"
      >
        <NodeSelector
          :mode="mode"
          :value="value.spec"
          :nodes="nodeOptions"
        />
      </Tab>

      <Tab
        name="upLink"
        :label="t('harvester.vlanConfig.titles.uplink')"
        :weight="79"
      >
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model.number="mtu"
              :label="t('harvester.vlanConfig.uplink.linkAttributes.mtu.label')"
              :mode="mode"
              type="number"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-12">
            <ArrayList
              v-model="value.spec.uplink.nics"
              :mode="mode"
              :title="t('harvester.vlanConfig.uplink.nics.label')"
              :initial-empty-row="true"
              :required="true"
              :add-label="t('harvester.vlanConfig.uplink.nics.addLabel')"
            />
          </div>
        </div>

        <h3 class="mt-20">
          {{ t('harvester.vlanConfig.titles.bondOptions') }}
        </h3>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="bondOptionMode"
              :label="t('harvester.vlanConfig.uplink.bondOptions.mode.label')"
              :mode="mode"
              :options="bondOptions"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model.number="miimon"
              :label="t('harvester.vlanConfig.uplink.bondOptions.miimon.label')"
              :mode="mode"
              type="number"
            />
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
button {
  all: unset;
  height: 0;
  position: relative;
  top: -35px;
  float: right;
  margin-right: 7px;

  cursor: pointer;

  .align-value {
    padding-top: 7px;
  }
}
</style>
