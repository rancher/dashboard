<script>
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

export default {
  components: {
    CruResource,
    Loading,
    Tab,
    Tabbed,
    LabeledInput
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      name:    '',
      loading: true
    };
  },

  methods: {
    async actuallySave(url) {
      this.value.norman.name = this.name;
      // this.value.spec.displayName = this.name;

      await this.value.save({ url, redirectUnauthorized: false });
    },
  },

  created() {
    this.name = this.value.spec.displayName;
  }
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
  >
    <Tabbed :side-tabs="true">
      <Tab
        name="basic"
        :label="t('cluster.machinePool.tabs.basics')"
        :weight="1"
      >
        <LabeledInput
          v-model="name"
          :label="t('cluster.machinePool.customName')"
          :mode="mode"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
