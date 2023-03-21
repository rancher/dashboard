<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {};
  },

  computed: {
    projects() {
      return this.$store.getters['management/all'](
        MANAGEMENT.PROJECT
      );
    },
    currentProjectName() {
      const projectId = this.row.metadata?.labels?.project;
      const project = projectId && this.projects.find(obj => obj.id === projectId.replace('-p-', '/p-'));

      return project?.nameDisplay || 'All';
    }
  }
};
</script>

<template>
  <span>
    {{ currentProjectName }}
  </span>
</template>
