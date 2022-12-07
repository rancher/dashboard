<script>
import { isEmpty, throttle } from 'lodash';
import Vue from 'vue';

import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import ArrayListSelect from '@shell/components/form/ArrayListSelect';
import LabelValue from '@shell/components/LabelValue';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

import CreateEditView from '@shell/mixins/create-edit-view';

import { NODE } from '@shell/config/types';
import { set, clone } from '@shell/utils/object';
import { uniq, findBy } from '@shell/utils/array';
import { HCI } from '../../types';
import { allHash } from '@shell/utils/promise';
import { HOSTNAME } from '@shell/config/labels-annotations';
import { matching } from '@shell/utils/selector';

import NodeSelector from './NodeSelector';

export default {
  components: {
    CruResource,
    NameNsDescription,
    LabeledInput,
    LabeledSelect,
    Tabbed,
    Tab,
    NodeSelector,
    ArrayListSelect,
    LabelValue,
    Loading,
    Banner,
  },

  mixins: [CreateEditView],

  data() {
    const originNics = clone(this.value?.spec?.uplink?.nics || []);

    const matchingNodes = {
      matched: 0,
      matches: [],
      none:    true,
      sample:  null,
      total:   0,
    };

    return {
      type:      'vlan',
      matchNICs: [],
      originNics,
      matchingNodes,
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.validate);
    }

    const clusterNetwork = this.$route.query.clusterNetwork;

    if (clusterNetwork) {
      set(this.value, 'spec.clusterNetwork', clusterNetwork);
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      linkMonitors: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.LINK_MONITOR }),
      nodes:        this.$store.dispatch(`${ inStore }/findAll`, { type: NODE }),
    };

    await allHash(hash);

    this.updateMatchingNICs();
    this.updateMatchingNodes();
  },

  computed: {
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

    doneLocationOverride() {
      return this.value.doneOverride;
    },

    nics() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const linkMonitor = this.$store.getters[`${ inStore }/byId`](HCI.LINK_MONITOR, 'nic') || {};
      const linkStatus = linkMonitor?.status?.linkStatus || {};

      const out = [];

      Object.keys(linkStatus).map((nodeName) => {
        const nics = linkStatus[nodeName] || [];

        nics.map((nic) => {
          out.push({
            ...nic,
            nodeName,
          });
        });
      });

      return out;
    },

    nicOptions() {
      const out = [];
      const map = {};

      (this.matchNICs || []).map((nic) => {
        if (nic.masterIndex && !this.originNics.includes(nic.name)) {
          set(map, `${ nic.name }.masterIndex`, true);
        } else if (!findBy(out, 'name', nic.name)) {
          out.push(nic);

          set(map, `${ nic.name }.total`, 1);
          set(map, `${ nic.name }.down`, nic.state === 'down' ? 1 : 0);
        } else if (findBy(out, 'name', nic.name)) {
          set(map, `${ nic.name }.total`, map[nic.name].total + 1);
          set(map, `${ nic.name }.down`, nic.state === 'down' ? map[nic.name].down + 1 : map[nic.name].down);
        }
      });

      return out.filter(o => !map[o.name].masterIndex).map((o) => {
        let label = '';

        if (map[o.name].down === 0) {
          label = `${ o.name } (Up)`;
        } else if (map[o.name].total === 1) {
          label = `${ o.name } (Down)`;
        } else {
          label = `${ o.name } (${ map[o.name].down }/${ map[o.name].total } Down)`;
        }

        return {
          label,
          value:    o.name,
          disabled: map[o.name].down > 0,
        };
      });
    },

    nodes() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const nodes = this.$store.getters[`${ inStore }/all`](NODE);

      return nodes.filter(n => !n.isUnSchedulable);
    },
  },

  methods: {
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

          const option = this.nicOptions.find(option => option.value === n);

          if (option && option?.disabled) {
            errors.push(this.t('harvester.vlanConfig.uplink.nics.validate.available', { nic: n }, true));
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
        const miimon = this.value?.spec?.uplink?.bondOptions?.miimon;

        if (!miimon && miimon !== 0) {
          delete this.value?.spec?.uplink?.bondOptions?.miimon;
        }

        const mtu = this.value?.spec?.uplink?.linkAttributes?.mtu;

        if (!mtu && mtu !== 0 ) {
          delete this.value?.spec?.uplink?.linkAttributes?.mtu;
        }

        return Promise.resolve();
      }
    },

    updateMatchingNICs: throttle(function() {
      const nodeSelector = this.value?.spec?.nodeSelector || {};

      const allNICs = this.nics || [];
      let matchNICs = [];
      let commonNodes = [];

      if (isEmpty(nodeSelector)) {
        matchNICs = clone(allNICs);
        commonNodes = (this.nodes || []).map(n => n.id);
      } else if (nodeSelector[HOSTNAME] && Object.keys(nodeSelector).length === 1) {
        matchNICs = allNICs.filter(n => n.nodeName === nodeSelector[HOSTNAME]);
        commonNodes = [nodeSelector[HOSTNAME]];
      } else {
        const matchNodes = matching(this.nodes || [], nodeSelector).map(n => n.id);

        matchNICs = allNICs.filter(n => matchNodes.includes(n.nodeName));
        commonNodes = matchNodes.map(n => n.id);
      }

      this.matchNICs = this.intersection(matchNICs, commonNodes) || [];
    }, 250, { leading: true }),

    intersection(nics = [], commonNodes = []) {
      const map = {};

      nics.map((n) => {
        map[n.name] = (map[n.name] || 0) + 1;
      });

      return nics.filter(n => map[n.name] === commonNodes.length);
    },

    updateMatchingNodes: throttle(function() {
      const selector = this.value?.spec?.nodeSelector || {};
      const allNodes = this.nodes || [];

      if (isEmpty(selector)) {
        this.matchingNodes = {
          matched: allNodes.length,
          total:   allNodes.length,
          none:    false,
          sample:  allNodes[0] ? allNodes[0].nameDisplay : null,
        };
      } else if (selector[HOSTNAME] && Object.keys(selector).length === 1) {
        const matchNode = allNodes.find(n => n.id === selector[HOSTNAME]);

        this.matchingNodes = {
          matched: 1,
          total:   allNodes.length,
          none:    false,
          sample:  matchNode ? matchNode.nameDisplay : null,
        };
      } else {
        const match = matching(allNodes, selector);

        this.matchingNodes = {
          matched: match.length,
          total:   allNodes.length,
          none:    match.length === 0,
          sample:  match[0] ? match[0].nameDisplay : null,
        };
      }
    }, 250, { leading: true }),
  },

  watch: {
    nicOptions(options) {
      const nics = this.value.spec?.uplink?.nics || [];

      nics.map((n, idx) => {
        const option = options.find(option => option.value === n);

        if ((option && option?.disabled) || !option) {
          Vue.set(nics, idx, '');
        }
      });
    },
  },
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
        name="nodeSelector"
        :label="t('harvester.vlanConfig.titles.nodeSelector')"
        :weight="99"
      >
        <div class="row">
          <div class="col span-12">
            <Banner :color="(matchingNodes.none ? 'warning' : 'success')">
              <span v-html="t('harvester.vlanConfig.nodeSelector.matchingNodes.matchesSome', matchingNodes)" />
            </Banner>
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <NodeSelector
              :mode="mode"
              :value="value.spec"
              :nodes="nodeOptions"
              @updateMatchingNICs="updateMatchingNICs"
              @updateMatchingNodes="updateMatchingNodes"
            />
          </div>
        </div>
      </Tab>

      <Tab
        name="upLink"
        :label="t('harvester.vlanConfig.titles.uplink')"
        :weight="99"
        :show-header="false"
      >
        <div class="row mt-10">
          <div class="col span-6">
            <LabelValue
              :name="t('harvester.network.clusterNetwork.label')"
              :value="value.spec.clusterNetwork"
            />
          </div>
          <div class="col span-6">
            <LabelValue
              name="Type"
              value="VLAN"
            />
          </div>
        </div>

        <div class="row mt-20">
          <div class="col span-12">
            <ArrayListSelect
              v-model="value.spec.uplink.nics"
              :mode="mode"
              :options="nicOptions"
              :array-list-props="{
                addLabel: t('harvester.vlanConfig.uplink.nics.addLabel'),
                initialEmptyRow: true,
                title: t('harvester.vlanConfig.uplink.nics.label'),
                required: true,
                protip: false,
              }"
              :select-props="{
                placeholder: t('harvester.vlanConfig.uplink.nics.placeholder'),
              }"
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

        <h3 class="mt-20">
          {{ t('harvester.vlanConfig.titles.attributes') }}
        </h3>
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
