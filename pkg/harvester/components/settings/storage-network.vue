<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { RadioGroup } from '@components/Form/Radio';
import { _EDIT } from '@shell/config/query-params';
import { Banner } from '@components/Banner';
import Tip from '@shell/components/Tip';
import { HCI } from '../../types';

export default {
  name: 'HarvesterEditStorageNetwork',

  components: {
    Tip,
    Banner,
    LabeledInput,
    LabeledSelect,
    RadioGroup
  },

  props: {
    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.CLUSTER_NETWORK });
  },

  data() {
    let parsedDefaultValue = {};
    let openVlan = false;

    try {
      parsedDefaultValue = JSON.parse(this.value.value);
      openVlan = true;
    } catch (error) {
      parsedDefaultValue = {
        vlan:           '',
        clusterNetwork: '',
        range:          ''
      };
    }

    return {
      openVlan,
      errors: [],
      parsedDefaultValue
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  computed: {
    clusterNetworkOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const clusterNetworks = this.$store.getters[`${ inStore }/all`](HCI.CLUSTER_NETWORK) || [];

      return clusterNetworks.map((n) => {
        return {
          label: n.id,
          value: n.id,
        };
      });
    },
  },

  methods: {
    update() {
      const valueString = JSON.stringify(this.parsedDefaultValue);

      if (this.openVlan) {
        this.$set(this.value, 'value', valueString);
      } else {
        this.$set(this.value, 'value', '');
      }
    },

    willSave() {
      const errors = [];

      if (this.openVlan) {
        const valid = !!/^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([1-9]|[1-2]\d|3[0-2])$/.test(this.parsedDefaultValue.range);

        if (!valid) {
          errors.push(this.t('harvester.setting.storageNetwork.range.invalid', null, true));
        }

        if (!this.parsedDefaultValue.vlan) {
          errors.push(this.t('validation.required', { key: this.t('harvester.setting.storageNetwork.vlan') }, true));
        }

        if (!this.parsedDefaultValue.clusterNetwork) {
          errors.push(this.t('validation.required', { key: this.t('harvester.setting.storageNetwork.clusterNetwork') }, true));
        }
      } else {
        return Promise.resolve();
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },
  },
};
</script>

<template>
  <div
    :class="mode"
    @input="update"
  >
    <Banner color="warning">
      <t k="harvester.setting.storageNetwork.warning" :raw="true" />
    </Banner>

    <RadioGroup
      v-model="openVlan"
      class="mb-20"
      name="model"
      :options="[true,false]"
      :labels="[t('generic.enabled'), t('generic.disabled')]"
      @input="update"
    />

    <div v-if="openVlan">
      <LabeledInput
        v-model.number="parsedDefaultValue.vlan"
        class="mb-20"
        :mode="mode"
        required
        label-key="harvester.setting.storageNetwork.vlan"
      />

      <LabeledSelect
        v-model="parsedDefaultValue.clusterNetwork"
        label-key="harvester.setting.storageNetwork.clusterNetwork"
        class="mb-20"
        required
        :options="clusterNetworkOptions"
        @input="update"
      />

      <LabeledInput
        v-model="parsedDefaultValue.range"
        class="mb-5"
        :mode="mode"
        required
        :placeholder="t('harvester.setting.storageNetwork.range.placeholder')"
        label-key="harvester.setting.storageNetwork.range.label"
      />
      <Tip class="mb-20" icon="icon icon-info" :text="t('harvester.setting.storageNetwork.tip')" />
    </div>
  </div>
</template>
