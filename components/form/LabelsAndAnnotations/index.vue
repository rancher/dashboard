<script>
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    Tab,
    Tabbed,
    KeyValue
  },
  props: {
    /* value is any spec object containing (or potentially containing) 'labels' and 'annotations' fields */
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    /* CRUD mode */
    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    const { labels = {}, annotations = {} } = this.value;

    return { labels, annotations };
  },

  watch: {
    labels() {
      this.update();
    },
    annotations() {
      this.update();
    }
  },

  methods: {
    update() {
      const out = {
        ...this.value,
        labels:      this.labels,
        annotations: this.annotations
      };

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <Tabbed default-tab="labels">
    <Tab name="labels" label="Labels">
      <KeyValue
        key="labels"
        v-model="labels"
        :mode="mode"
        title="Labels"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </Tab>
    <Tab name="annotations" label="Annotations">
      <KeyValue
        key="annotations"
        v-model="annotations"
        :mode="mode"
        title="Annotations"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </Tab>
  </Tabbed>
</template>
