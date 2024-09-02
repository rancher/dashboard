<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import KeyValue from '@shell/components/form/KeyValue';

import CreateEditView from '@shell/mixins/create-edit-view';

import { set } from '@shell/utils/object';

export default {
  components: {
    Tab,
    Tabbed,
    CruResource,
    NameNsDescription,
    KeyValue,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave);
    }
  },

  data() {
    const config = JSON.parse(this.value?.spec?.config || '{}');

    return { config };
  },

  methods: {
    willSave() {
      set(this.value, 'spec.config', JSON.stringify(this.config));

      return Promise.resolve();
    },
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
    @finish="save"
  >
    <NameNsDescription
      ref="nd"
      v-model="value"
      :mode="mode"
    />

    <Tabbed
      v-bind="$attrs"
      class="mt-15"
      :side-tabs="true"
    >
      <Tab
        name="basics"
        :label="t('networkAttachmentDefinition.tabs.config')"
        :weight="99"
        class="bordered-table"
      >
        <KeyValue
          key="config"
          v-model="config"
          :mode="mode"
          :read-allowed="false"
          :value-multiline="false"
          :initialEmptyRow="true"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
