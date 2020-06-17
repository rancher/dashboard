<script>
/*
    Tab component for resource CRU pages featuring:
    Labels and Annotation tabs with content filtered by create-edit-view mixin
    Slots for more tabs, 'before' and 'after' labels and annotations
*/
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    Tabbed,
    Tab,
    KeyValue
  },

  mixins: [CreateEditView],

  props: {
    // resource instance
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    // create-edit-view mode
    mode: {
      type:    String,
      default: 'create'
    }
  }
};
</script>

<template>
  <Tabbed v-bind="$attrs">
    <slot name="before" />
    <Tab name="Labels" label="Labels">
      <KeyValue
        key="labels"
        v-model="labels"
        :mode="mode"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
        :protip="false"
      />
    </Tab>
    <Tab name="annotations" label="Annotations">
      <KeyValue
        key="annotations"
        v-model="annotations"
        :mode="mode"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
        :protip="false"
      />
    </Tab>
  </Tabbed>
</template>
