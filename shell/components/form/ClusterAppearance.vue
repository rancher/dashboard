
<script>
import ClusterIconMenu from '@shell/components/ClusterIconMenu';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { CLUSTER_BADGE } from '@shell/config/labels-annotations';
export default {
  title:      'ClusterAppearance',
  components: { ClusterIconMenu },
  props:      {
    name:           { type: String, default: '' },
    mode:           { type: String, default: _CREATE },
    currentCluster: { type: Object, default: null }
  },
  created() {
    this.$store.dispatch('customisation/setDefaultPreviewCluster');
  },

  computed: {
    disable() {
      if (this.mode === _VIEW) {
        return true;
      }

      return this.name.length <= 1;
    },
    clusterPreview() {
      if (this.mode !== _CREATE) {
        return {
          ...this.currentCluster,
          badge: {
            iconText: this.currentCluster.metadata.annotations[CLUSTER_BADGE.ICON_TEXT],
            color:    this.currentCluster.metadata.annotations[CLUSTER_BADGE.COLOR],
            text:     this.currentCluster.metadata.annotations[CLUSTER_BADGE.TEXT]
          }
        };
      }

      const obj = {
        ...this.$store.getters['customisation/getPreviewCluster'],
        label: this.name
      };

      return obj || {
        label: this.name,
        badge: { iconText: null }
      };
    },
  },

  methods: {
    customBadgeDialog() {
      this.$store.dispatch('cluster/promptModal', {
        component:      'AddCustomBadgeDialog',
        componentProps: {
          isCreate:        this.mode === _CREATE,
          mode:            this.mode,
          clusterName:     this.name,
          clusterExplorer: this.clusterPreview
        },
      });
    },
  },
};
</script>

<template>
  <div class="cluster-appearance">
    <label for="name">
      {{ t('clusterBadge.setClusterAppearance') }}
    </label>
    <div class="cluster-appearance-preview">
      <span>
        <ClusterIconMenu :cluster="clusterPreview" />
      </span>
      <button
        :disabled="disable"
        @click="customBadgeDialog"
      >
        <i class="icon icon-brush-icon" />
        <span>
          {{ t('clusterBadge.customize') }}
        </span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .cluster-appearance {
    display: flex;
    flex-direction: column;
    margin: 3px 35px 0px 0px;

    label {
      margin: 6px 0 0;
    }

    &-preview {
      display: flex;
      justify-content: center;
      align-self: start;
      gap: 10px;
      justify-content: space-between;

      span {
        display: flex;
        align-self: center;
        height: auto;
      }

      button {
        display: flex;
        align-self: center;
        height: auto;
        margin: 0;
        padding: 0;
        top: 0;
        color: var(--link);
        background: transparent;

        i {
          margin-right: 2px;
        }

        &:disabled {
          color: var(--disabled-text);
          cursor: not-allowed;
        }
      }
    }
  }
</style>
