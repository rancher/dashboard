<script>
import KeyValue from '@shell/components/form/KeyValue';
import Select from '@shell/components/form/Select';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';

export default {
  emits: ['remove'],

  components: {
    KeyValue, Select, LabeledSelect
  },

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

    namespaces: {
      type:    Array,
      default: () => [],
    },

    isClusterFlow: {
      type:    Boolean,
      default: false
    }
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
    <template v-if="!isHarvester">
      <KeyValue
        v-model:value="value.labels"
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
    </template>

    <h3>
      {{ value.select ? t('logging.flow.matches.nodes.title.include') : t('logging.flow.matches.nodes.title.exclude') }}
    </h3>
    <div class="row">
      <div class="col span-12">
        <Select
          v-model:value="value.hosts"
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
    <div v-if="!isHarvester">
      <div class="spacer" />
      <h3>
        {{ value.select ? t('logging.flow.matches.containerNames.title.include') : t('logging.flow.matches.containerNames.title.exclude') }}
      </h3>
      <div class="row">
        <div class="col span-12">
          <LabeledSelect
            v-model:value="value.container_names"
            :mode="mode"
            :options="[]"
            :disabled="false"
            :placeholder="t('logging.flow.matches.containerNames.placeholder')"
            :multiple="true"
            :taggable="true"
            :clearable="true"
            :searchable="true"
            :close-on-select="false"
            no-options-label-key="logging.flow.matches.containerNames.enter"
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
              v-model:value="value.namespaces"
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
  </div>
</template>
