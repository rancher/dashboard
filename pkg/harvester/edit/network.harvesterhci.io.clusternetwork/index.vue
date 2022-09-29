<script>
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ResourceTabs from '@shell/components/form/ResourceTabs/index';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';

import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  name: 'EditClusterNetwork',

  components: {
    CruResource,
    NameNsDescription,
    ResourceTabs,
    Tab,
    Labels,
  },

  mixins: [CreateEditView],

  computed: {
    doneLocationOverride() {
      return this.value.doneOverride;
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.validate);
    }
  },

  methods: {
    validate() {
      const errors = [];

      const name = this.value?.metadata?.name;

      if (!name) {
        errors.push(this.t('validation.required', { key: this.t('generic.name') }, true));
      } else if (name.length > 12) {
        errors.push(this.t('validation.stringLength.max', {
          key:   this.t('generic.name'),
          count: 12,
        }, true));
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
  <CruResource
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :namespaced="false"
    />
    <ResourceTabs
      v-model="value"
      :mode="mode"
      :side-tabs="true"
    >
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
