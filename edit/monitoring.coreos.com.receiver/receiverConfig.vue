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
    },
    deprecatedReceiver: {
      type:     Boolean,
      default:  false
    }
  },
  data(props) {
    let suffix;
    let expectedFields;

    if (props.deprecatedReceiver) {
      const specSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.RECEIVER_SPEC);

      expectedFields = Object.keys(specSchema.resourceFields);
      const suffix = {};

      Object.keys(this.value.spec).forEach((key) => {
        if (!expectedFields.includes(key)) {
          suffix[key] = this.value.spec[key];
        }
      });
    } else {
      const specSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.ALERTMANAGERCONFIG_RECEIVER_SPEC);

      expectedFields = Object.keys(specSchema.resourceFields);
      const suffix = {};

      Object.keys(this.value).forEach((key) => {
        if (!expectedFields.includes(key)) {
          suffix[key] = this.value[key];
        }
      });
    }

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
    removeUnexpectedFields(receiverData, value) {
      // We need this step so we don't just keep adding new keys when modifying the custom field
      Object.keys(receiverData).forEach((key) => {
        if (!this.expectedFields.includes(key)) {
          this.$delete(receiverData, key);
        }
      });

      const suffix = jsyaml.load(value);

      Object.assign(receiverData, suffix);
    }
  },
  watch: {
    suffixYaml(value) {
      try {
        if (this.value.spec) {
          // If the value has a spec, treat the value as the data
          // for a Route custom resource, which is deprecated
          // as of Rancher v2.6.5.
          this.removeUnexpectedFields(this.value.spec, value);
        } else if (this.value) {
          // If the value does not have a spec, treat the value as the
          // data for a route configuration block within an
          // AlertmanagerConfig custom resource, which is the preferred
          // way to set up routes and receivers as of Rancher v2.6.5.
          this.removeUnexpectedFields(this.value, value);
        }

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
      <component
        :is="getComponent(receiverType.banner)"
        v-if="receiverType.banner"
        :model="value.spec[receiverType.key]"
        :mode="mode"
      />
      <ArrayListGrouped
        v-model="value.spec[receiverType.key]"
        class="namespace-list"
        :mode="mode"
        :default-add-value="{}"
        :add-label="t('monitoringReceiver.addButton', { type: t(receiverType.label) })"
      >
        <template #default="props">
          <component :is="getComponent(receiverType.name)" :value="props.row.value" :mode="mode" :deprecated-reciever="deprecatedReceiver" />
        </template>
        <template v-if="receiverType.addButton" #add>
          <component :is="getComponent(receiverType.addButton)" :model="value.spec[receiverType.key]" :mode="mode" />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>
