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
