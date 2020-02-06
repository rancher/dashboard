<template>
  <Tabbed default-tab="labels">
    <Tab name="labels" label="Labels">
      <KeyValue key="labels" v-model="labels" mode="view" :add-allowed="false" :protip="false" />
    </Tab>
    <Tab name="annotations" label="Annotations">
      <KeyValue
        key="annotations"
        v-model="annotations"
        mode="view"
        :add-allowed="false"
        :protip="false"
      />
    </Tab>
  </Tabbed>
</template>

<script>
import KeyValue from '@/components/form/KeyValue';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';

export default {
  components: {
    KeyValue,
    Tab,
    Tabbed,
  },
  props: {
    /**
     * An object of key value pairs that represent labels.
     */
    labels: {
      type:     Object,
      required: true,
    },
    /**
     * An object of key value pairs that represent annotations.
     */
    annotations: {
      type:     Object,
      required: true,
    },
  },
};
</script>
