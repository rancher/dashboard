<script>
import LinkDetail from '@shell/components/formatter/LinkDetail';
import { MANAGEMENT } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import { mapGetters } from 'vuex';

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
  async fetch() {
    if (this.row.isProjectScoped && this.currentCluster?.isLocal) {
      const id = this.row.projectScopedClusterId;

      if (id && !this.$store.getters[`${ STORE.MANAGEMENT }/byId`](MANAGEMENT.CLUSTER, id)) {
        try {
          await this.$store.dispatch(`${ STORE.MANAGEMENT }/find`, { type: MANAGEMENT.CLUSTER, id });
        } catch (e) {
          // Ignore error
        }
      }
    }
  },
  computed: {
    ...mapGetters(['currentCluster']),
    tooltip() {
      if (this.row.isProjectScoped) {
        const projectName = this.row.project?.nameDisplay || this.row.projectScopedProjectId;
        const clusterName = this.row.projectCluster?.nameDisplay || this.row.projectScopedClusterId;

        return this.t('secret.projectScoped.tooltip.source', { project: projectName, cluster: clusterName });
      } else if (this.row.isProjectSecretCopy) {
        const projectID = this.row.projectScopedProjectId;
        const clusterId = this.currentCluster?.id;

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
