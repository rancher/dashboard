// Added by Verrazzano
import OamComponentHelper from '@pkg/mixins/oam-component-helper';

export default {
  mixins:   [OamComponentHelper],
  computed: {
    workloadDeploymentTemplate: {
      get() {
        return this.get(this.value, 'spec.workload.spec.deploymentTemplate');
      },
      set(neu) {
        this.set(this.value, 'spec.workload.spec.deploymentTemplate', neu);
      }
    },
    workloadDeploymentTemplateMetadata: {
      get() {
        return this.get(
          this.value,
          'spec.workload.spec.deploymentTemplate.metadata'
        );
      },
      set(neu) {
        this.set(
          this.value,
          'spec.workload.spec.deploymentTemplate.metadata',
          neu
        );
      }
    },
    workloadPodSpec: {
      get() {
        return this.workloadDeploymentTemplate?.podSpec;
      },
      set(neu) {
        this.set(this.workloadDeploymentTemplate, 'podSpec', neu);
      }
    }
  },
  methods: {
    getWorkloadDeploymentTemplateField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.${ fieldName }` : 'spec.workload.spec.deploymentTemplate';

      return this.getField(pathName);
    },
    getWorkloadDeploymentTemplateMetadataField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.metadata';

      return this.getField(pathName);
    },
    getWorkloadDeploymentTemplateNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.${ fieldName }` : 'spec.workload.spec.deploymentTemplate';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getWorkloadDeploymentTemplateMetadataNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.metadata';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    setWorkloadDeploymentTemplateField(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.${ fieldName }` : 'spec.workload.spec.deploymentTemplate';

      this.setField(pathName, value);
    },
    setWorkloadDeploymentTemplateFieldIfNotEmpty(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.${ fieldName }` : 'spec.workload.spec.deploymentTemplate';

      this.setFieldIfNotEmpty(pathName, value);
    },
    setWorkloadDeploymentTemplateMetadataField(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.metadata';

      this.setField(pathName, value);
    },
    setWorkloadDeploymentTemplateMetadataFieldIfNotEmpty(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.metadata';

      this.setFieldIfNotEmpty(pathName, value);
    },
    getWorkloadPodSpecField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec';

      return this.getField(pathName);
    },
    getWorkloadPodSpecMetadataField(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec.metadata';

      return this.getField(pathName);
    },
    getWorkloadPodSpecNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    getWorkloadPodSpecMetadataNotSetPlaceholder(fieldName) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec.metadata';

      return this.getNotSetPlaceholder(this.value, pathName);
    },
    setWorkloadPodSpecField(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec';

      this.setField(pathName, value);
    },
    setWorkloadPodSpecFieldIfNotEmpty(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec';

      this.setFieldIfNotEmpty(pathName, value);
    },
    setWorkloadPodSpecMetadataField(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec.metadata';

      this.setField(pathName, value);
    },
    setWorkloadPodSpecMetadataFieldIfNotEmpty(fieldName, value) {
      const pathName = fieldName ? `spec.workload.spec.deploymentTemplate.podSpec.metadata.${ fieldName }` : 'spec.workload.spec.deploymentTemplate.podSpec.metadata';

      this.setFieldIfNotEmpty(pathName, value);
    }
  }
};
