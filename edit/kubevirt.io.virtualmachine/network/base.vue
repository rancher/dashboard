<script>
import InputOrDisplay from '@/components/InputOrDisplay';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _CREATE, _VIEW } from '@/config/query-params';

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

const MANAGEMENT_NETWORK = 'management Network';

export default {
  name:       'NetworkBase',
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
    return {
      rowIndex:   0,
      errors:     [],
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

    isMasquerade() {
      return this.value.networkName === MANAGEMENT_NETWORK;
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
    },
  },

  watch: {
    'value.networkName': {
      handler(neu) {
        if (neu === MANAGEMENT_NETWORK && this.value.masquerade) {
          this.value.type = 'masquerade';
        } else {
          this.value.type = 'bridge';
        }
      },
      immediate: true
    }
  },

  methods: {
    update() {
      const networkName = this.value.networkName;

      if (networkName === MANAGEMENT_NETWORK) {
        this.value.isPod = true;
      } else {
        this.value.isPod = false;
      }
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
            :options="networkOption"
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
