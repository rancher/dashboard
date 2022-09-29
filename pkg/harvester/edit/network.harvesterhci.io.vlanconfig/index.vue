<script>
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import ArrayList from '@shell/components/form/ArrayList';
import LabelValue from '@shell/components/LabelValue';

import CreateEditView from '@shell/mixins/create-edit-view';

import { NODE } from '@shell/config/types';
import { set } from '@shell/utils/object';
import { uniq } from '@shell/utils/array';

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
    ArrayList,
    LabelValue,
  },

  mixins: [CreateEditView],

  data() {
    return { type: 'vlan' };
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
  },
};
</script>

<template>
  <CruResource
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
