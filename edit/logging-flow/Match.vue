<script>
import KeyValue from '@/components/form/KeyValue';
import Select from '@/components/form/Select';

export default {
  components: { KeyValue, Select },

  props:      {
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
  },

  methods: {
    update() {
    },

    removeRule() {
      this.$emit('remove');
    },
  },
};
</script>

<template>
  <div class="rule" @input="update">
    <div class="remove-row clearfix">
      <button class="btn role-link close" @click="removeRule">
        <i class="icon icon-x icon-2x" />
      </button>
    </div>

    <KeyValue
      v-model="value.labels"
      :title="(value.select ? 'Select Pods' : 'Exclude Pods')"
      :mode="mode"
      :initial-empty-row="true"
      :read-allowed="false"
      :title-add="true"
      protip=""
      key-label="Pod Label Key"
      value-label="Pod Label Value"
    />

    <h3 class="mt-20">
      Limit to specific nodes
    </h3>
    <Select
      v-model="value.hosts"
      class="lg"
      :options="nodes"
      placeholder="Default: Any node"
      :multiple="true"
      :searchable="true"
      :taggable="true"
      :clearable="true"
      :close-on-select="false"
      :reduce="e=>e.value"
    />

    <h3 class="mt-20">
      Limit to specific container names
    </h3>
    <Select
      v-model="value.container_names"
      class="lg"
      :options="containers"
      placeholder="Default: Any container"
      :multiple="true"
      :taggable="true"
      :clearable="true"
      :close-on-select="false"
    />
  </div>
</template>

<style lang="scss" scoped>
.rule {
  border: 1px solid var(--tabbed-border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-top: 20px;
  position: relative;
}

.remove-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: auto;
}

.close {
  float: right;
  padding: 0px;
}
</style>
