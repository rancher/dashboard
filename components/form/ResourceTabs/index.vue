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
  },
  computed: {
    hasCustomTabs() {
      return !!this.$slots['before'];
    }
  }
};
</script>

<template>
  <Tabbed v-if="!isView || hasCustomTabs" v-bind="$attrs">
    <slot name="before" />
    <Tab
      v-if="!isView"
      name="labels"
      :weight="4"
      :label="t('resourceTabs.tabs.labels')"
    >
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
    <Tab
      v-if="!isView"
      name="annotations"
      :weight="5"
      :label="t('resourceTabs.tabs.annotations')"
    >
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
