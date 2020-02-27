<script>
import { RANCHER } from '@/config/types';
import { sortBy } from '@/utils/sort';

export default {
  computed: {
    current() {
      return this.$store.getters['currentCluster'];
    },

    clusters() {
      const clusters = this.$store.getters['management/all'](RANCHER.CLUSTER);

      return sortBy(clusters, ['isReady:desc', 'nameDisplay']);
    },
  },
};

</script>

<template>
  <div class="filter">
    <v-popover
      placement="bottom"
      trigger="click"
      :hide-on-target-click="true"
      :delay="{show: 0, hide: 200}"
    >
      <div class="cluster-dropdown">
        <div v-if="current">
          {{ current.nameDisplay }}
        </div>
        <div v-else>
          None
        </div>
      </div>

      <template slot="popover">
        <ul class="list-unstyled cluster-list dropdown" style="margin: -14px;">
          <li v-for="c of clusters" :key="c.id">
            <nuxt-link v-if="c.isReady" v-close-popover class="cluster" :to="{name: 'c-cluster', params: { cluster: c.id }}">
              {{ c.nameDisplay }}
            </nuxt-link>
            <span v-else class="cluster not-ready">
              Not Ready: {{ c.nameDisplay }}
            </span>
          </li>
        </ul>

        <div class="clearfix">
          <nuxt-link tag="button" :to="{name: 'clusters'}" class="btn bg-link">
            View All
          </nuxt-link>
        </div>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
  .filter {
    position: relative;
    z-index: 1; // Above the cow so you can click there too
  }

  .cluster-dropdown {
    width: var(--nav-width);
    line-height: var(--header-height);
    cursor: pointer;
    text-align: left;
    background: var(--header-dropdown);

    > div {
      padding: 0 15px 0 40px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:after {
      position: absolute;
      top: 0;
      right: 5px;
      font-size: 18px;
      font-family: 'icons';
      content: '\e906';
    }
  }

  .cluster-list {
    padding-bottom: 30px;
    width: 210px;

    .cluster {
      display: block;
      padding: 10px;
    }

    .not-ready {
      cursor: not-allowed;
    }
  }
</style>
