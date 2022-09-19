// Added by Verrazzano
import BaseVerrazzanoHelper from './base-verrazzano-helper';

export default {
  name:     'VerrazzanoHelper',
  mixins:   [BaseVerrazzanoHelper],
  computed: {
    workloadTemplate: {
      get() {
        return this.get(this.value, 'spec.workload.spec.template');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.spec.template', neu);
      },
    },
    workloadTemplateSpec: {
      get() {
        return this.get(this.value, 'spec.workload.spec.template.spec');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.spec.template.spec', neu);
      },
    },
    workloadTemplateMetadata: {
      get() {
        return this.get(this.value, 'spec.workload.spec.template.metadata');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.spec.template.metadata', neu);
      },
    },
  },
  methods: {
    getWorkloadMetadataField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.metadata.${ fieldName }` : 'spec.workload.spec.template.metadata';

      return this.getField(pathName);
    },
    getWorkloadSpecField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      return this.getField(pathName);
    },
    getWorkloadSpecListField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      return this.getListField(pathName);
    },
    getTemplateMetadataField(fieldName) {
      const pathName = fieldName ? `spec.template.metadata.${ fieldName }` : 'spec.template.metadata';

      return this.getField(pathName);
    },
    getTemplateSpecField(fieldName) {
      const pathName = fieldName ? `spec.template.spec.${ fieldName }` : 'spec.template.spec';

      return this.getField(pathName);
    },
    getTemplateSpecListField(fieldName) {
      const pathName = fieldName ? `spec.template.spec.${ fieldName }` : 'spec.template.spec';

      return this.getListField(pathName);
    },
    getWorkloadMetadataNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.metadata.${ fieldName }` : 'spec.workload.spec.template.metadata';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getWorkloadSpecNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getTemplateMetadataNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.template.metadata.${ fieldName }` : 'spec.template.metadata';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getTemplateSpecNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.template.spec.${ fieldName }` : 'spec.template.spec';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    setWorkloadMetadataField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.metadata.${ fieldName }` : 'spec.workload.spec.template.metadata';

      this.setField(pathName, neu);
    },
    setWorkloadMetadataFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.metadata.${ fieldName }` : 'spec.workload.spec.template.metadata';

      this.setFieldIfNotEmpty(pathName, neu);
    },
    setWorkloadSpecField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      this.setField(pathName, neu);
    },
    setWorkloadSpecBooleanField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      this.setBooleanField(pathName, neu);
    },
    setWorkloadSpecNumberField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      this.setNumberField(pathName, neu);
    },
    setWorkloadSpecFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      this.setFieldIfNotEmpty(pathName, neu);
      this.$emit('input', this.value);
    },
    showWorkloadSpecListRemoveButton(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.template.spec.${ fieldName }` : 'spec.workload.spec.template.spec';

      return this.showListRemoveButton(pathName);
    },
    setTemplateMetadataField(fieldName, neu) {
      const pathName = fieldName ? `spec.template.metadata.${ fieldName }` : 'spec.template.metadata';

      this.setField(pathName, neu);
    },
    setTemplateMetadataFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.template.metadata.${ fieldName }` : 'spec.template.metadata';

      this.setFieldIfNotEmpty(pathName, neu);
    },
    setTemplateSpecField(fieldName, neu) {
      const pathName = fieldName ? `spec.template.spec.${ fieldName }` : 'spec.template.spec';

      this.setField(pathName, neu);
    },
    setTemplateSpecFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.template.spec.${ fieldName }` : 'spec.template.spec';

      this.setFieldIfNotEmpty(pathName, neu);
    },
  }
};
