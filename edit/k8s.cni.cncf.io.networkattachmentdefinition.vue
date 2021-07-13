<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import NameNsDescription from '@/components/form/NameNsDescription';

import { HCI } from '@/config/labels-annotations';
import CreateEditView from '@/mixins/create-edit-view';

export default {
  components: {
    Tab,
    Tabbed,
    CruResource,
    LabeledInput,
    NameNsDescription,
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

    return {
      config,
      type: 'L2VlanNetwork',
    };
  },

  methods: {
    async saveNetwork(buttonCb) {
      this.value.setLabel(HCI.NETWORK_TYPE, this.type);

      if (!this.config.vlan) {
        this.errors = [this.$store.getters['i18n/t']('validation.required', { key: 'Vlan ID' })];
        buttonCb(false);

        return false;
      }

      this.config.name = this.value.metadata.name;
      this.value.spec.config = JSON.stringify(this.config);

      await this.save(buttonCb);
    },

    input(neu) {
      const pattern = /^([1-9]|[1-9][0-9]{1,2}|[1-3][0-9]{3}|40[0-9][0-4])$/;

      if (!pattern.test(neu) && neu !== '') {
        this.config.vlan = neu > 4094 ? 4094 : 1;
      }
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
    @apply-hooks="applyHooks"
    @finish="saveNetwork"
  >
    <NameNsDescription
      ref="nd"
      v-model="value"
      :mode="mode"
    />

    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
      <Tab name="basics" :label="t('harvester.vmPage.detail.tabs.basics')" :weight="1" class="bordered-table">
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
          label="Vlan ID"
          @input="input"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
