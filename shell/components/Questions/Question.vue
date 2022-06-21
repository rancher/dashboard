<script>
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import Tolerations from '@shell/components/form/Tolerations';
import NodeAffinity from '@shell/components/form/NodeScheduling';
import YamlEditor from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { filterBy } from '@shell/utils/array';
import { NODE, PVC, STORAGE_CLASS, NORMAN } from '@shell/config/types';

// Older versions of rancher document these words as valid types
const LEGACY_MAP = {
  storageclass: STORAGE_CLASS,
  pvc:          PVC,
};

export default {
  components: {
    ArrayList,
    Checkbox,
    FileSelector,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    NodeAffinity,
    Tolerations,
    YamlEditor
  },
  props: {
    chartName: {
      type:    String,
      default: '',
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    question: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    targetNamespace: {
      type:     String,
      required: true,
    },

    value: {
      type:     null,
      required: true,
    },

  },
  fetch() {
    if (this.question.type === 'cloudcredential') {
      this.setCloudCredentialOptions();
    }

    if (this.question.type === 'affinityrules') {
      this.setNodeOptions();
    }

    // Fetch the options for the dropdown when you
    // need to select an object
    if ( this.isObjectReference && !this.typeSchema ) {
      this.setGenericObjectOptions();
    }
  },
  data(props) {
    let typeName = props.question.type?.toLowerCase() || '';

    const match = typeName.match(/^reference\[(.*)\]$/);

    if ( match ) {
      typeName = match?.[1];
    } else if (typeName.startsWith('reference')) {
      // Assume the naming convention "reference_typename"
      typeName = typeName.split('_')[1];
    } else {
      typeName = LEGACY_MAP[typeName] || typeName;
    }

    return {
      cloudCredentials:        [],
      typeName,
      typeSchema:           null,
      genericObjectOptions:    [],
      nodeOptions:          [],
      get
    };
  },
  mounted() {
    let def = this.question.default;

    if (this.question.type === 'boolean' && typeof def === 'string') {
      def = def === 'true';
    }

    if (this.value === undefined && def !== undefined) {
      this.$emit('input', def);
    }

    if ( this.question.type === 'yamlfile' ) {
      this.$nextTick(() => {
        if ( this.$refs.yaml && this.$refs.yaml.$refs) {
          this.$refs.yaml.$refs.cm.refresh();

          // this.$refs.yaml.$refs.cm.focus();
          // this.$refs.yaml.$refs.cm.updateValue(this.value);
        }
      });
      this.$forceUpdate();
    }
  },
  computed: {
    useSingleLineKeyValues() {
      return this.question.type === 'labels' ||
              this.question.type === 'nodeselectors' ||
              this.question.type === 'map[string]string';
    },
    useSingleColumn() {
      return this.question.type === 'affinityrules' ||
            this.question.type === 'tolerations' ||
            this.question.type === 'yamlfile' ||
            this.question.type === 'tmplfile' ||
            this.useSingleLineKeyValues ||
            this.useMultiLineKeyValues;
    },
    useMultiLineKeyValues() {
      return this.question.type === 'annotations' ||
              this.question.type === 'questionMap' ||
              this.question.type === 'map[string]multiline';
    },
    displayLabel() {
      const variable = this.question?.variable;
      const displayLabel = this.$store.getters['i18n/withFallback'](
        `charts.${ this.chartName }."${ variable }".label`,
        null,
        ''
      );

      return displayLabel || this.question?.label || variable || '?';
    },

    isNamespaced() {
      return !!this.typeSchema?.attributes?.namespaced;
    },

    showDescription() {
      function normalize(str) {
        return (str || '').toLowerCase().replace(/\s/g, '');
      }

      const description = normalize(this.question?.description);
      const label = normalize(this.question?.label);

      // Only include the description if it doesn't match the label.
      return description && description !== label;
    },

    showHeader() {
      return (
        this.question.variable.endsWith('labels') ||
        this.question.type === 'labels' ||
        this.question.type === 'nodeselectors' ||
        this.question.variable.endsWith('annotations') ||
        this.question.type === 'annotations' ||
        this.question.type === 'tolerations' ||
        this.question.type === 'yamlfile'
      );
    },

    displayDescription() {
      const variable = this.question?.variable;

      return this.$store.getters['i18n/withFallback'](
        `charts.${ this.chartName }."${ variable }".description`,
        null,
        this.question?.description
      );
    },
    isObjectReference() {
      // Going forward, object references should use the naming
      // convention 'reference_typename'. The type name should be singular
      // and should include the API group. For example, for Deployments, because
      // Deployments are in the 'apps' API group, it would be 'reference_apps.deployment'.

      return this.question.type.startsWith('reference') ||
              this.question.type === 'configmap' ||
              this.question.type === 'secret' ||
              this.question.type === 'storageclass' ||
              this.question.type === 'pvc';
    }
  },
  methods: {
    update(event) {
      this.$emit('input', event);
    },
    getTypeSchema() {
      if ( this.typeName ) {
        const schema = this.$store.getters[`${ this.inStore }/schemaFor`](this.typeName);

        return schema;
      }
    },
    async setCloudCredentialOptions() {
      try {
        const cloudCredentials = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

        this.cloudCredentialOptions = cloudCredentials.map((x) => {
          return {
            label: x.nameDisplay || x.name || x.metadata.name,
            value: x.id
          };
        });
      } catch {
        this.cloudCredentialOptions = [];
      }
    },
    async setNodeOptions() {
      try {
        const allNodeObjects = await this.$store.dispatch('cluster/findAll', { type: NODE });

        this.nodeOptions = allNodeObjects.map(node => node.id);
      } catch {
        this.nodeOptions = [];
      }
    },
    async setGenericObjectOptions() {
      this.typeSchema = await this.getTypeSchema();

      if (this.typeSchema) {
        let objects = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: this.typeName });

        if ( this.isNamespaced ) {
          objects = filterBy(objects, 'metadata.namespace', this.targetNamespace);
        }

        this.genericObjectOptions = objects.map((obj) => {
          return {
            label: obj.nameDisplay || obj.metadata.name,
            value: obj.metadata.name
          };
        });
      }
    },
    onFileUpload(value) {
      const component = this.$refs.file;

      if (component) {
        component.updateValue(value);
      }
    }
  },
};
</script>

<template>
  <div>
    <div v-if="useSingleColumn" class="mb-20">
      <div class="row">
        <h3 class="mt-10">
          {{ displayLabel }}
        </h3>
      </div>
      <div class="row mb-10">
        <div class="row">
          {{ question.description }}
        </div>
      </div>
      <NodeAffinity
        v-if="question.type === 'affinityrules'"
        :value="{ affinity: value }"
        :mode="mode"
        :nodes="nodeOptions"
        @input="update($event)"
      />
      <Tolerations
        v-else-if="question.type === 'tolerations'"
        :value="value"
        :mode="mode"
        @input="update($event)"
      />
      <YamlEditor
        v-else-if="question.type === 'yamlfile'"
        ref="file"
        :value="value"
        :extra-padding="true"
        class="yaml-editor mb-5"
        @input="update($event)"
      />
      <YamlEditor
        v-else-if="question.type === 'tmplfile'"
        ref="file"
        :value="value"
        :syntax-highlighting="'go'"
        :extra-padding="true"
        class="yaml-editor mb-5"
        @input="update($event)"
      />
      <KeyValue
        v-else-if="useSingleLineKeyValues"
        :key="question.variable"
        :value="value"
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :read-allowed="true"
        :protip="t('keyValue.protip', null, true)"
        :disabled="disabled"
        :initial-empty-row="true"
        :value-multiline="false"
        @input="update($event)"
      />
      <KeyValue
        v-else-if="useMultiLineKeyValues"
        ref="multilineKeyValue"
        :key="question.variable"
        :use-code-mirror-for-value="true"
        :value="value"
        :add-label="t('labels.addAnnotation')"
        :mode="mode"
        :read-allowed="true"
        :protip="t('keyValue.protip', null, true)"
        :disabled="disabled"
        :initial-empty-row="true"
        @input="update($event)"
      />
      <FileSelector
        v-if="question.type === 'yamlfile'"
        class="btn role-secondary pull-left"
        :label="t('questions.readFromFile',{'fileType': 'YAML'})"
        @selected="onFileUpload"
      />
      <FileSelector
        v-if="question.type === 'tmplfile'"
        class="btn role-secondary pull-left"
        :label="t('questions.readFromFile',{'fileType': '.tmpl'})"
        @selected="onFileUpload"
      />
    </div>
    <div v-else class="row mb-5">
      <div class="col span-5">
        <h3 v-if="showHeader" class="mt-10">
          {{ displayLabel }}
        </h3>
        <ArrayList
          v-else-if="
            question.type === 'array[string]' ||
              question.type === 'array[multiline]' ||
              question.type === 'listofstrings'
          "
          :key="question.variable"
          :value="value"
          :title="question.label"
          :mode="mode"
          :protip="false"
          :disabled="disabled"
          @input="update($event)"
        />
        <Checkbox
          v-else-if="question.type === 'boolean'"
          :value="value"
          :mode="mode"
          :label="displayLabel"
          :disabled="disabled"
          @input="update($event)"
        />
        <LabeledSelect
          v-else-if="question.type === 'enum'"
          :value="value"
          :mode="mode"
          :label="displayLabel"
          :options="question.options"
          :placeholder="question.default"
          :required="question.required"
          :disabled="disabled"
          @input="update($event)"
        />
        <LabeledInput
          v-else-if="question.type === 'int'"
          :value="value"
          type="text"
          :mode="mode"
          :label="displayLabel"
          :placeholder="question.default"
          :required="question.required"
          :disabled="disabled"
          @input="
            val = parseInt($event, 10);
            if (!isNaN(val)) {
              update(val);
            }
          "
        />
        <LabeledInput
          v-else-if="question.type === 'float'"
          :value="value"
          type="text"
          :mode="mode"
          :label="displayLabel"
          :placeholder="question.default"
          :required="question.required"
          :disabled="disabled"
          @input="
            val = parseFloat($event);
            if (!isNaN(val)) {
              update(val);
            }
          "
        />
        <LabeledSelect
          v-else-if="question.type === 'cloudcredential'"
          :value="value"
          :mode="mode"
          :options="options"
          :disabled="$fetchState.pending || disabled"
          :label="displayLabel"
          :placeholder="question.description"
          :required="question.required"
          @input="!$fetchState.pending && update($event)"
        />
        <LabeledSelect
          v-else-if="isObjectReference && typeSchema"
          :value="value"
          :mode="mode"
          :options="genericObjectOptions"
          :disabled="$fetchState.pending || disabled"
          :label="displayLabel"
          :placeholder="question.description"
          :required="question.required"
          @input="!$fetchState.pending && update($event)"
        />
        <LabeledInput
          v-else-if="question.type === 'string'"
          :value="value"
          :mode="mode"
          :label="displayLabel"
          :placeholder="question.description"
          :required="question.required"
          :disabled="disabled"
          @input="update($event)"
        />
        <p v-else>
          {{ t('questions.noFormElement',{variable: question.variable}) }}
        </p>
      </div>
      <div v-if="showDescription" class="col span-6 mt-10">
        <div>
          {{ question.description }}
        </div>

        <div v-if="isObjectReference && typeSchema && genericObjectOptions.length > 0">
          <span v-if="isNamespaced">{{ t('questions.namespacedResource',{ targetNamespace, typeName }) }}</span>
        </div>
        <div v-else-if="isObjectReference && typeSchema && genericObjectOptions.length === 0">
          {{ t('questions.noResources', { targetNamespace, typeName }) }}
        </div>

        <div v-if="isObjectReference && !typeSchema" class="text-error">
          {{ t('questions.noPermission') }}
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.full-width {
  width: 100%;
}
</style>
