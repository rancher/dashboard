<script>
import Vue from 'vue';
import { intersection } from 'lodash';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import Tip from '@/components/Tip';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import { HCI } from '@/config/types';

export default {
  name:       'EditHarvesterVlan',
  components: {
    LabeledSelect,
    RadioGroup,
    Tip
  },

  mixins: [CreateEditView],

  props:  {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({ nodeNetworks: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.NODE_NETWORK }) });

    this.nodeNetworks = hash.nodeNetworks;
  },

  data() {
    if (!this.value.config) {
      Vue.set(this.value, 'config', { defaultPhysicalNIC: '' });
    }

    return { nodeNetworks: [] };
  },

  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    },

    nicOptions() {
      if (this.nodeNetworks.length === 0) {
        return [];
      }

      const out = this.nodeNetworks.map((N) => {
        if (N?.nics?.length > 0) {
          return N.nics.filter((nic) => {
            return !(nic.masterIndex !== undefined && nic.usedByVlanNetwork === undefined);
          }).map(nic => nic.name);
        } else {
          return [];
        }
      });

      return intersection(...out);
    }
  },
};
</script>

<template>
  <div>
    <RadioGroup
      v-model="value.enable"
      class="mb-20"
      name="model"
      :options="[true,false]"
      :labels="[t('generic.enabled'), t('generic.disabled')]"
    />

    <LabeledSelect
      v-if="value.enable"
      v-model="value.config.defaultPhysicalNIC"
      :options="nicOptions"
      :label="t('harvester.setting.defaultPhysicalNIC')"
      class="mb-5"
    />

    <Tip v-if="value.enable" icon="icons icon-h-question" :text="t('harvester.setting.vlanChangeTip')" />
  </div>
</template>

<style lang="scss" scoped>
  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
</style>
