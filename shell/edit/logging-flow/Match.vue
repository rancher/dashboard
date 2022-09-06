<script>
import KeyValue from '@shell/components/form/KeyValue';
import Select from '@shell/components/form/Select';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';

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
  },

  computed: {
    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === VIRTUAL;
    },

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
    <div v-if="!isHarvester">
      <KeyValue
        v-model="value.labels"
        :title="value.select ? 'Include Pods' : 'Exclude Pods'"
        :mode="mode"
        :initial-empty-row="true"
        :read-allowed="false"
        :title-add="true"
        protip=""
        key-label="Pod Label Key"
        value-label="Pod Label Value"
        add-label="Add Pod"
      />
      <div class="spacer"></div>
    </div>

    <h3>
      Limit to specific nodes
    </h3>
    <div class="row">
      <div class="col span-12">
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
          :reduce="(e) => e.value"
        />
      </div>
    </div>
    <div v-if="!isHarvester">
      <div class="spacer"></div>
      <h3>
        Limit to specific container names
      </h3>
      <div class="row">
        <div class="col span-12">
          <Select
            v-model="value.container_names"
            class="lg"
            :options="containers"
            placeholder="Default: Any container"
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
