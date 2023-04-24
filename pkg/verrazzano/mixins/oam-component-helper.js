// Added by Verrazzano
import BaseVerrazzanoHelper from '@pkg/mixins/base-verrazzano-helper';

export default {
  mixins:   [BaseVerrazzanoHelper],
  computed: {
    workloadField: {
      get() {
        return this.get(this.value, 'spec.workload');
      },
      set(neu) {
        this.set(this.value, 'spec.workload', neu);
      },
    },
    workloadSpec: {
      get() {
        return this.get(this.value, 'spec.workload.spec');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.spec', neu);
      },
    },
    workloadMetadata: {
      get() {
        return this.get(this.value, 'spec.workload.metadata');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.metadata', neu);
      },
    },
  },
  methods: {
    getWorkloadMetadataField(fieldName) {
      const pathName = fieldName ? `spec.workload.metadata.${ fieldName }` : 'spec.workload.metadata';

      return this.getField(pathName);
    },
    getWorkloadSpecField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      return this.getField(pathName);
    },
    getWorkloadField(fieldName) {
      const pathName = fieldName ? `spec.workload.${ fieldName }` : 'spec.workload';

      return this.getField(pathName);
    },
    getWorkloadSpecListField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      return this.getListField(pathName);
    },
    getWorkloadMetadataNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.metadata.${ fieldName }` : 'spec.workload.metadata';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getWorkloadSpecNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    setWorkloadMetadataField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.metadata.${ fieldName }` : 'spec.workload.metadata';

      this.setField(pathName, neu);
    },
    setWorkloadMetadataFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.metadata.${ fieldName }` : 'spec.workload.metadata';

      this.setFieldIfNotEmpty(pathName, neu);
    },
    setWorkloadSpecField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      this.setField(pathName, neu);
    },
    setWorkloadSpecFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      this.setFieldIfNotEmpty(pathName, neu);
    },
    setWorkloadSpecBooleanField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      this.setBooleanField(pathName, neu);
    },
    setWorkloadSpecNumberField(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.spec.${ fieldName }` : 'spec.workload.spec';

      this.setNumberField(pathName, neu);
    },
    setWorkloadFieldIfNotEmpty(fieldName, neu) {
      const pathName = fieldName ? `spec.workload.${ fieldName }` : 'spec.workload';

      this.setFieldIfNotEmpty(pathName, neu);
    }
  },
};
