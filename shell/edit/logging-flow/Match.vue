<script>
import KeyValue from '@shell/components/form/KeyValue';
import Select from '@shell/components/form/Select';

export default {
  components: { KeyValue, Select },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    nodes: {
      type:    Array,
      default: () => [],
    },

    containers: {
      type:    Array,
      default: () => [],
    },

    namespaces: {
      type:    Array,
      default: () => [],
    },

    isClusterFlow: {
      type:    Boolean,
      default: false
    }
  },

  methods: {
    update() {},

    removeRule() {
      this.$emit('remove');
    },
  },
};
</script>

<template>
  <div>
    <KeyValue
      v-model="value.labels"
      :title="value.select ? t('logging.flow.matches.pods.title.include') : t('logging.flow.matches.pods.title.exclude')"
      :mode="mode"
      :initial-empty-row="true"
      :read-allowed="false"
      :title-add="true"
      protip=""
      :key-label="t('logging.flow.matches.pods.keyLabel')"
      :value-label="t('logging.flow.matches.pods.valueLabel')"
      :add-label="t('logging.flow.matches.pods.addLabel')"
    />
    <div class="spacer" />
    <h3>
      {{ value.select ? t('logging.flow.matches.nodes.title.include') : t('logging.flow.matches.nodes.title.exclude') }}
    </h3>
    <div class="row">
      <div class="col span-12">
        <Select
          v-model="value.hosts"
          class="lg"
          :options="nodes"
          :placeholder="t('logging.flow.matches.nodes.placeholder')"
          :multiple="true"
          :searchable="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="(e) => e.value"
        />
      </div>
    </div>
    <div class="spacer" />
    <h3>
      {{ value.select ? t('logging.flow.matches.containerNames.title.include') : t('logging.flow.matches.containerNames.title.exclude') }}
    </h3>
    <div class="row">
      <div class="col span-12">
        <Select
          v-model="value.container_names"
          class="lg"
          :options="containers"
          :placeholder="t('logging.flow.matches.containerNames.placeholder')"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          placement="top"
        />
      </div>
    </div>
    <div v-if="isClusterFlow">
      <div class="spacer" />
      <h3>
        {{ value.select ? t('logging.flow.matches.namespaces.title.include') : t('logging.flow.matches.namespaces.title.exclude') }}
      </h3>
      <div class="row">
        <div class="col span-12">
          <Select
            v-model="value.namespaces"
            class="lg"
            :options="namespaces"
            :placeholder="t('logging.flow.matches.namespaces.placeholder')"
            :multiple="true"
            :taggable="true"
            :clearable="true"
            :close-on-select="false"
            placement="top"
          />
        </div>
      </div>
    </div>
  </div>
</template>
