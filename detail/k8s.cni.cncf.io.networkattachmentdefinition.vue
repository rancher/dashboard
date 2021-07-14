<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabelValue from '@/components/LabelValue';

export default {
  name: 'NetworkDetail',

  components: {
    Tab,
    Tabbed,
    LabelValue
  },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    name() {
      return this.value.parseConfig.name || '-';
    },

    type() {
      return 'L2VlanNetwork';
    },

    vlanId() {
      return this.value.parseConfig.vlan || '-';
    }
  },
};
</script>

<template>
  <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
    <Tab name="basics" :label="t('harvester.network.tabs.basics')" class="bordered-table">
      <div class="row mb-15">
        <div class="col span-4">
          <LabelValue :name="t('harvester.fields.name')" :value="name" class="mb-20" />
        </div>

        <div class="col span-4">
          <LabelValue :name="t('harvester.fields.type')" :value="type" class="mb-20" />
        </div>

        <div class="col span-4">
          <LabelValue name="Vlan Id" :value="vlanId" class="mb-20" />
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>
