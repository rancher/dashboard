<script>
import { CLUSTER } from '@/store/prefs';
// import { CLOUD } from '@/config/types';

export default {
  computed: {
    value: {
      get() {
        const value = this.$store.getters['prefs/get'](CLUSTER);

        return value || 'local';
      },

      set(neu) {
        this.$store.dispatch('switchClusters', neu);
      }
    },

    clusters() {
      return [
        { id: 'local', label: 'Local' },
        { id: 'c1', label: 'Cluster 1' },
        { id: 'c2', label: 'Cluster 2' },
        { id: 'c3', label: 'Cluster 3' },
        { id: 'c4', label: 'Cluster 4' },
      ];

      /*
      const choices = this.$store.getters['cluster/all'](CLOUD.CLUSTER);

      return choices.map((obj) => {
        return {
          id:    obj.id,
          label: obj.nameDisplay,
        };
      });
      */
    }
  },
};

</script>

<template>
  <div class="filter">
    <v-popover
      placement="bottom"
      offset="-10"
      trigger="click"
      :delay="{show: 0, hide: 200}"
      :popper-options="{modifiers: { flip: { enabled: false } } }"
    >
      <div class="btn cluster-dropdown bg-info">
        Cluster: Local
      </div>

      <template slot="popover">
        <ul class="list-unstyled cluster-list dropdown" style="margin: -14px;">
          <li v-for="c of clusters" :key="c.id">
            <a href="#">{{ c.label }}</a>
          </li>
        </ul>

        <div class="clearfix">
          <nuxt-link tag="button" :to="{name: 'clusters-import'}" class="btn bg-primary pull-right">
            <i class="icon icon-plus" /> Import
          </nuxt-link>
          <nuxt-link tag="button" :to="{name: 'clusters'}" class="btn bg-link">
            View All
          </nuxt-link>
        </div>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
  .cluster-dropdown {
    position: relative;
    margin: 10px;
    width: 230px;
    height: 40px;
    line-height: 24px;
    text-align: left;

    &:after {
      content: '\e908';
      right: 10px;
      font-size: 16px;
      position: absolute;
      font-family: 'icons';
    }
  }

  .cluster-list {
    padding-bottom: 30px;
    width: 210px;

    LI A {
      display: block;
      padding: 5px 0;
    }
  }
</style>
