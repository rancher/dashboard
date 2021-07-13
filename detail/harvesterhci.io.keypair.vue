<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabelValue from '@/components/LabelValue';

export default {
  name: 'ViewSSH',

  components: {
    LabelValue,
    Tab,
    Tabbed
  },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    let spec = this.value.spec;

    if ( !this.value.spec ) {
      spec = {};
      this.value.spec = spec;
      this.value.metadata = { name: '' };
    }

    return { publicKey: this.value.spec.publicKey || '' };
  },
};
</script>

<template>
  <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
    <Tab name="detail" :label="t('harvester.vmPage.detail.tabs.basics')" class="bordered-table">
      <div class="row">
        <div class="col span-12 keypair-card">
          <LabelValue name="SSH-Key" :value="publicKey" class="mb-20" />
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>

<style lang="scss">
  .keypair-card DIV {
    word-break: break-all;
  }
</style>
