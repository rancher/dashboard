<script>
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import createEditView from '@shell/mixins/create-edit-view';
import Labels from '@shell/components/form/Labels';
import Taints from '@shell/components/form/Taints';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';

export default {
  emits: ['input'],

  components: {
    CruResource,
    Labels,
    NameNsDescription,
    ResourceTabs,
    Tab,
    Taints,
  },

  mixins:       [createEditView],
  inheritAttrs: false,
  props:        {
    value: {
      type:     Object,
      required: true,
    },
  },
};
</script>

<template>
  <CruResource
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :apply-hooks="applyHooks"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
    />
    <ResourceTabs
      :value="value"
      :mode="mode"
      @update:value="$emit('input', $event)"
    >
      <Tab
        name="taints"
        :label="t('node.detail.tab.taints')"
        :weight="0"
      >
        <Taints
          v-model:value="value.spec.taints"
          :mode="mode"
        />
      </Tab>
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

<style lang="scss" scoped>
</style>
