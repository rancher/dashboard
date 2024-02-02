<template>
  <div class="label-container">
    <div class="label-add">
      <button
        class="btn role-primary"
        @click="showAddLabelModal"
      >
        <t k="harborConfig.formTag.btn.add" />
      </button>
    </div>
    <LabelsV1
      ref="labelRef"
      :subtractHeight="320"
      :api-request="apiRequest"
      :autoHide="false"
      :project-id="project?.project_id ? project.project_id : 0"
      :scope="scope"
    />
  </div>
</template>
<script>
import LabelsV1 from '../LabelsV1.vue';

export default {
  components: { LabelsV1 },
  props:      {
    apiRequest: {
      type:     Object,
      required: true
    },
    project: {
      type:     Object,
      required: true
    }
  },
  data() {
    return { scope: 'p' };
  },
  methods: {
    showAddLabelModal() {
      this.$refs.labelRef.showAddModal();
    },
  }
};
</script>
<style lang="scss" scoped>
  .label-container {
    position: relative;
    .label-add {
      position: absolute;
      top: -75px;
      right: 0px;
    }
  }
</style>
