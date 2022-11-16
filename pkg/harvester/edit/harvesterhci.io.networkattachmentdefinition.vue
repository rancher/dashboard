<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { HCI } from '@/pkg/harvester/config/labels-annotations';
import CreateEditView from '@shell/mixins/create-edit-view';

const AUTO = 'auto';
const MANUAL = 'manual';

export default {
  components: {
    Tab,
    Tabbed,
    CruResource,
    LabeledInput,
    NameNsDescription,
    RadioGroup,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    const config = JSON.parse(this.value.spec.config);
    const annotations = this.value?.metadata?.annotations || {};
    const layer3Network = JSON.parse(annotations[HCI.NETWORK_ROUTE] || '{}');

    return {
      config,
      type:          'L2VlanNetwork',
      layer3Network: {
        mode:         layer3Network.mode || AUTO,
        serverIPAddr: layer3Network.serverIPAddr || '',
        cidr:         layer3Network.cidr || '',
        gateway:      layer3Network.gateway || '',
      },
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateBeforeSave);
    }
  },

  computed: {
    modeOptions() {
      return [{
        label: this.t('harvester.network.layer3Network.mode.auto'),
        value: AUTO,
      }, {
        label: this.t('harvester.network.layer3Network.mode.manual'),
        value: MANUAL,
      }];
    },
  },

  methods: {
    async saveNetwork(buttonCb) {
      const errors = [];

      if (!this.config.vlan) {
        errors.push(this.$store.getters['i18n/t']('validation.required', { key: this.t('tableHeaders.networkVlan') }));
      }

      if (this.layer3Network.mode === MANUAL) {
        if (!this.layer3Network.gateway) {
          errors.push(this.$store.getters['i18n/t']('validation.required', { key: this.t('harvester.network.layer3Network.gateway.label') }));
        }
        if (!this.layer3Network.cidr) {
          errors.push(this.$store.getters['i18n/t']('validation.required', { key: this.t('harvester.network.layer3Network.cidr.label') }));
        }
      }

      if (errors.length > 0) {
        buttonCb(false);
        this.errors = errors;

        return false;
      }

      this.value.setAnnotation(HCI.NETWORK_ROUTE, JSON.stringify(this.layer3Network));

      await this.save(buttonCb);
    },

    input(neu) {
      const pattern = /^([1-9]|[1-9][0-9]{1,2}|[1-3][0-9]{3}|40[0-9][0-4])$/;

      if (!pattern.test(neu) && neu !== '') {
        this.config.vlan = neu > 4094 ? 4094 : 1;
      }
    },

    updateBeforeSave() {
      this.value.setLabel(HCI.NETWORK_TYPE, this.type);
      this.config.name = this.value.metadata.name;
      this.value.spec.config = JSON.stringify(this.config);
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="saveNetwork"
  >
    <NameNsDescription
      ref="nd"
      v-model="value"
      :mode="mode"
    />

    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
      <Tab name="basics" :label="t('harvester.network.tabs.basics')" :weight="99" class="bordered-table">
        <LabeledInput
          v-model="type"
          class="mb-20"
          :label="t('harvester.fields.type')"
          :disabled="true"
          required
        />

        <LabeledInput
          v-model.number="config.vlan"
          v-int-number
          class="mb-20"
          required
          type="number"
          placeholder="e.g. 1-4094"
          :label="t('tableHeaders.networkVlan')"
          :mode="mode"
          @input="input"
        />
      </Tab>
      <Tab
        name="layer3Network"
        :label="t('harvester.network.tabs.layer3Network')"
        :weight="98"
        class="bordered-table"
      >
        <div class="row mt-10">
          <div class="col span-6">
            <RadioGroup
              v-model="layer3Network.mode"
              name="layer3NetworkMode"
              :label="t('harvester.network.layer3Network.mode.label')"
              :mode="mode"
              :options="modeOptions"
            />
          </div>
        </div>
        <div
          v-if="layer3Network.mode === 'auto'"
          class="row mt-10"
        >
          <div class="col span-6">
            <LabeledInput
              v-model="layer3Network.serverIPAddr"
              class="mb-20"
              :label="t('harvester.network.layer3Network.serverIPAddr.label')"
              :mode="mode"
            />
          </div>
        </div>
        <div
          v-else
          class="row mt-10"
        >
          <div class="col span-6">
            <LabeledInput
              v-model="layer3Network.cidr"
              class="mb-20"
              :label="t('harvester.network.layer3Network.cidr.label')"
              :placeholder="t('harvester.network.layer3Network.cidr.placeholder')"
              :mode="mode"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="layer3Network.gateway"
              class="mb-20"
              :label="t('harvester.network.layer3Network.gateway.label')"
              :placeholder="t('harvester.network.layer3Network.gateway.placeholder')"
              :mode="mode"
              required
            />
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
