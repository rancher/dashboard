<script>
import InputOrDisplay from '@shell/components/InputOrDisplay';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { clone } from '@shell/utils/object';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { MANAGEMENT_NETWORK } from '../../mixins/harvester-vm';

const MODEL = [{
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
  name:       'HarvesterEditNetwork',
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
    const isMasquerade = this.value.isPod;

    if (isMasquerade) {
      this.value.networkName = MANAGEMENT_NETWORK;
    }

    return {
      isMasquerade,
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

    typeOption() {
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
      }
      // Temporarily Remove
      // , {
      //   label: 'sriov',
      //   value: 'sriov'
      // }
      ];

      return this.isMasquerade ? masquerade : other;
    }
  },

  watch: {
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
    /**
     * Patch k8s value based on type of network
     */
    updateNetworkName(neu) {
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

    update() {
      this.$emit('update');
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div
        data-testid="input-hen-name"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.name')"
          :value="value.name"
          :mode="mode"
        >
          <LabeledInput
            v-model="value.name"
            :label="t('harvester.fields.name')"
            required
            :mode="mode"
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hen-model"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.model')"
          :value="value.model"
          :mode="mode"
        >
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

    <div class="row" :class="{'mb-20': !isMasquerade}">
      <div
        data-testid="input-hen-networkName"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.network')"
          :value="value.networkName"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.networkName"
            :label="t('harvester.fields.network')"
            :options="allNetworkOption"
            :mode="mode"
            required
            :disabled="isDisabled"
            @input="updateNetworkName"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hen-type"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.type')"
          :value="value.type"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="typeOption"
            :mode="mode"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div v-if="!isMasquerade" class="row">
      <div
        data-testid="input-hen-macAddress"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.macAddress')"
          :value="value.macAddress"
          :mode="mode"
        >
          <LabeledInput
            v-model="value.macAddress"
            label-key="harvester.fields.macAddress"
            :mode="mode"
            :tooltip="t('harvester.virtualMachine.volume.macTip')"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
  </div>
</template>
