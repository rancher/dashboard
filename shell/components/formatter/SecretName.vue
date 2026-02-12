<script>
import LinkDetail from '@shell/components/formatter/LinkDetail';
import { MANAGEMENT } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';

export default {
  components: { LinkDetail },
  props:      {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    isProjectScoped() {
      return this.row.isProjectScoped;
    },
    isProjectSecretCopy() {
      return this.row.isProjectSecretCopy;
    },
    tooltip() {
      if (this.isProjectScoped) {
        const projectName = this.row.project?.nameDisplay || this.row.projectScopedProjectId;
        const clusterName = this.row.projectCluster?.nameDisplay || this.row.projectScopedClusterId;

        return this.t('secret.projectScoped.tooltip.source', { project: projectName, cluster: clusterName });
      } else if (this.isProjectSecretCopy) {
        const projectID = this.row.projectScopedProjectId;
        const clusterId = this.$store.getters['clusterId'];

        // Try to fetch the project.
        // Note: The management store might not have the project loaded if we haven't visited the cluster list or project list.
        // However, if we are in the dashboard, we usually have projects loaded.
        const project = this.$store.getters[`${ STORE.MANAGEMENT }/byId`](MANAGEMENT.PROJECT, `${ clusterId }/${ projectID }`);
        const projectName = project?.nameDisplay || projectID;

        return this.t('secret.projectScoped.tooltip.copy', { secret: this.row.nameDisplay, project: projectName });
      }

      return null;
    }
  }
};
</script>

<template>
  <div class="secret-name">
    <LinkDetail
      :value="value"
      :row="row"
    />
    <i
      v-if="tooltip"
      v-clean-tooltip="tooltip"
      class="icon icon-info"
    />
  </div>
</template>

<style lang="scss" scoped>
  .secret-name {
    display: flex;
    align-items: center;

    .icon-info {
      margin-left: 8px;
    }
  }
</style>
