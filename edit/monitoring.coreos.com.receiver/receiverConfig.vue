<script>
import { MONITORING } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import ButtonDropdown from '@/components/ButtonDropdown';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import YamlEditor from '@/components/YamlEditor';
import jsyaml from 'js-yaml';

export default {
  components: {
    ArrayListGrouped,
    Banner,
    ButtonDropdown,
    LabeledInput,
    LabeledSelect,
    YamlEditor
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    receiverType: {
      type:     Object,
      required: true
    },
    editorMode: {
      type:     String,
      required: true
    }
  },
  data() {
    const specSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.RECEIVER_SPEC);
    const expectedFields = Object.keys(specSchema.resourceFields);
    const suffix = {};

    Object.keys(this.value.spec).forEach((key) => {
      if (!expectedFields.includes(key)) {
        suffix[key] = this.value.spec[key];
      }
    });

    let suffixYaml = jsyaml.dump(suffix);

    if (suffixYaml.trim() === '{}') {
      suffixYaml = '';
    }

    return { suffixYaml, expectedFields };
  },
  methods: {
    getComponent(name) {
      return require(`./types/${ name }`).default;
    },
  },
  watch: {
    suffixYaml(value) {
      try {
        // We need this step so we don't just keep adding new keys when modifying the custom field
        Object.keys(this.value.spec).forEach((key) => {
          if (!this.expectedFields.includes(key)) {
            this.$delete(this.value.spec, key);
          }
        });

        const suffix = jsyaml.load(value);

        Object.assign(this.value.spec, suffix);
        this.yamlError = '';
      } catch (ex) {
        this.yamlError = `There was a problem parsing the Custom Config: ${ ex }`;
      }
    }
  },
};
</script>

<template>
  <div>
    <YamlEditor
      v-if="receiverType.name === 'custom'"
      ref="customEditor"
      v-model="suffixYaml"
      :scrolling="false"
      :editor-mode="editorMode"
    />
    <div v-else>
      <component :is="getComponent(receiverType.banner)" v-if="receiverType.banner" :model="value.spec[receiverType.key]" :mode="mode" />
      <ArrayListGrouped
        v-model="value.spec[receiverType.key]"
        class="namespace-list"
        :mode="mode"
        :default-add-value="{}"
        :add-label="t('monitoringReceiver.addButton', { type: t(receiverType.label) })"
      >
        <template #default="props">
          <component :is="getComponent(receiverType.name)" :value="props.row.value" :mode="mode" />
        </template>
        <template v-if="receiverType.addButton" #add>
          <component :is="getComponent(receiverType.addButton)" :model="value.spec[receiverType.key]" :mode="mode" />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>
