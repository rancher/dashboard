<script>
import Vue from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';
import Tip from '@shell/components/Tip';
import CreateEditView from '@shell/mixins/create-edit-view';
import { allHash } from '@shell/utils/promise';
import { HCI } from '@shell/config/types';

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
      const allNics = [];
      const out = [];

      if (this.nodeNetworks.length === 0) {
        return out;
      }

      this.nodeNetworks.map((N) => {
        if (N?.nics?.length > 0) {
          const nics = N.nics.filter((nic) => {
            return !(nic.masterIndex !== undefined && nic.usedByVlanNetwork === undefined);
          }).map(nic => nic.name);

          allNics.push(...nics);
        } else {
          return [];
        }
      });

      allNics.map((N) => {
        const index = out.findIndex(nic => nic.value === N);

        if (index > -1) {
          out[index].num = out[index].num + 1;
        } else {
          out.push({
            label: N,
            value: N,
            num:   1,
          });
        }
      });

      return out.map((option) => {
        const percent = ((option.num / this.nodeNetworks.length) * 100).toFixed(2);

        return {
          ...option,
          percent: `${ percent } %`
        };
      });
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
      :tooltip="mode === 'view' ? null : t('harvester.setting.percentTip')"
      :hover-tooltip="true"
    >
      <template v-slot:option="option">
        <template>
          <div class="nicOption">
            <span>{{ option.label }}({{ option.percent }}) </span>
          </div>
        </template>
      </template>
    </LabeledSelect>

    <Tip v-if="value.enable" icon="icons icon-info" :text="t('harvester.setting.vlanChangeTip')" />
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
