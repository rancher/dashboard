<script>
import { mapGetters } from 'vuex';
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ClusterBadge from '@shell/components/ClusterBadge';

export default {

  components: {
    ClusterBadge,
    ClusterProviderIcon
  },

  mixins: [],

  data() {
    return { showTooltip: false };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    nameTooltip() {
      return !this.showTooltip ? {} : {
        content: this.currentCluster?.nameDisplay,
        delay:   400,
      };
    }
  },

  watch: {
    currentCluster(nue, old) {
      if (nue && old && nue.id !== old.id) {
        this.checkClusterName();
      }
    }
  },

  mounted() {
    this.checkClusterName();
  },

  methods: {
    checkClusterName() {
      this.$nextTick(() => {
        const el = this.$refs.clusterName;

        this.showTooltip = el && (el.clientWidth < el.scrollWidth);
      });
    },
  }
};
</script>

<template>
  <div class="label">
    <div
      v-clean-tooltip="nameTooltip"
      class="cluster cluster-clipped"
    >
      <template>
        <ClusterProviderIcon
          v-if="currentCluster"
          :cluster="currentCluster"
          class="mr-10"
        />
        <div
          v-if="currentCluster"
          ref="clusterName"
          class="cluster-name"
        >
          {{ currentCluster.spec.displayName }}
        </div>
        <ClusterBadge
          v-if="currentCluster"
          :cluster="currentCluster"
          class="ml-10"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.label {
    align-items: center;
    position: relative;
    display: flex;

    .logo {
        height: 30px;
        position: absolute;
        top: 9px;
        left: 0;
        z-index: 2;

        img {
            height: 30px;
        }
    }

    .cluster {
        align-items: center;
        display: flex;
        height: 32px;
        white-space: nowrap;
        .cluster-name {
            font-size: 16px;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        &.cluster-clipped {
            overflow: hidden;
        }
    }
}
</style>
