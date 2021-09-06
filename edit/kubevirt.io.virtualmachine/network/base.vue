<script>
import InputOrDisplay from '@/components/InputOrDisplay';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

import { clone } from '@/utils/object';
import { _CREATE, _VIEW } from '@/config/query-params';

const MANAGEMENT_NETWORK = 'management Network';

export const MODEL = [{
  label: 'virtio',
  value: 'virtio'
}, {
  label: 'e1000',
  value: 'e1000'
}, {
  label: 'e1000e',
  value: 'e1000e'
}, {
  label: 'ne2k_pci',
  value: 'ne2k_pci'
}, {
  label: 'pcnet',
  value: 'pcnet'
}, {
  label: 'rtl8139',
  value: 'rtl8139'
}];

export default {
  name:       'Network',
  components: {
    LabeledInput, LabeledSelect, InputOrDisplay
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    networkOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    rows: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    const isManagementNetwork = this.value.isPod;

    if (isManagementNetwork) {
      this.value.networkName = MANAGEMENT_NETWORK;
    }

    return {
      errors:               [],
      isManagementNetwork,
      isMasquerade:         false,
      hasManagementNetwork: false
    };
  },

  computed: {
    isDisabled() {
      return this.isMasquerade && !this.value.newCreateId && !this.isCreate;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    modelOption() {
      return MODEL;
    },

    allNetworkOption() {
      const out = clone(this.networkOption);

      if (!this.hasManagementNetwork) {
        out.unshift({
          label: MANAGEMENT_NETWORK,
          value: MANAGEMENT_NETWORK
        });
      }

      return out;
    },

    typeOpton() {
      const masquerade = [{
        label: 'masquerade',
        value: 'masquerade'
      }, {
        label: 'bridge',
        value: 'bridge'
      }];

      const other = [{
        label: 'bridge',
        value: 'bridge'
      },
      {
        label: 'sriov',
        value: 'sriov'
      }];

      return this.isMasquerade ? masquerade : other;
    }
  },

  watch: {
    'value.networkName': {
      handler(neu) {
        if (neu === MANAGEMENT_NETWORK) {
          this.value.isPod = true;
          this.value.macAddress = '';
        } else {
          this.value.isPod = false;
        }

        this.$set(this, 'isMasquerade', this.value.isPod);

        if (this.value.isPod) {
          this.value.type = 'masquerade';
        } else {
          this.value.type = 'bridge';
        }

        this.update();
      },
      immediate: true
    },

    rows: {
      handler(neu) {
        const hasManagementNetwork = !!neu.some(N => N.isPod);

        this.$set(this, 'hasManagementNetwork', hasManagementNetwork);
      },
      immediate: true,
      deep:      true
    }
  },

  methods: {
    update() {
      this.$emit('update');
    }
  }
};
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput v-model="value.name" :label="t('harvester.fields.name')" required :mode="mode" :disabled="isDisabled" />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.model')" :value="value.model" :mode="mode">
          <LabeledSelect
            v-model="value.model"
            :label="t('harvester.fields.model')"
            :disabled="isDisabled"
            :options="modelOption"
            :mode="mode"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.network')" :value="value.networkName" :mode="mode">
          <LabeledSelect
            v-model="value.networkName"
            :label="t('harvester.fields.network')"
            :options="allNetworkOption"
            :mode="mode"
            required
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="typeOpton"
            :mode="mode"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div v-if="!isMasquerade" class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.macAddress')" :value="value.macAddress" :mode="mode">
          <LabeledInput v-model="value.macAddress" :mode="mode">
            <template #label>
              <label class="has-tooltip">
                {{ t('harvester.fields.macAddress') }}
                <i v-tooltip="t('harvester.virtualMachine.volume.macTip')" class="icon icon-info" style="font-size: 14px" />
              </label>
            </template>
          </LabeledInput>
        </inputordisplay>
      </div>
    </div>
  </div>
</template>
