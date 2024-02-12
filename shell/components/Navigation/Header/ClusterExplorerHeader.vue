<script>
import { mapGetters } from 'vuex';
import BrandImage from '@shell/components/BrandImage';
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ClusterBadge from '@shell/components/ClusterBadge';
import NamespaceFilter from '@shell/components/nav/NamespaceFilter';
import IconOrSvg from '@shell/components/IconOrSvg';
import Actions from '@shell/components/Navigation/Header/Actions';
import User from '@shell/components/Navigation/Header/User';
import ResourceSearchActionButton from '@shell/components/Navigation/Header/Actions/ResourceSearchActionButton';
import BasicHeader from '@shell/components/Navigation/Header/BasicHeader';
import Label from '@shell/components/Navigation/Header/Label';

export default {

  components: {
    Actions,
    BasicHeader,
    NamespaceFilter,
    BrandImage,
    ClusterBadge,
    ClusterProviderIcon,
    IconOrSvg,
    Label,
    User,
    ResourceSearchActionButton
  },

  data() {
    return { navHeaderRight: null };
  },

  computed: { ...mapGetters(['clusterReady', 'currentCluster']) },

  watch: {

    // since the Header is a "persistent component" we need to update it at every route change...
    $route(nue) {
      if (nue) {
        this.navHeaderRight = this.$plugin?.getDynamic('component', 'NavHeaderRight');
      }
    }
  },

};
</script>

<template>
  <BasicHeader>
    <div class="left">
      <Label class="pl-15" />
    </div>
    <div class="right">
      <component :is="navHeaderRight" />
      <NamespaceFilter v-if="clusterReady" />
      <Actions />
      <div class="header-spacer" />
      <User class="user" />
    </div>
  </BasicHeader>
</template>

<style lang="scss" scoped>
    .left {
      flex: 1;
    }

    .right {
      display: flex;
      flex-direction: row;
      padding: 0;

      > * {
        padding: 0 5px;
      }

      .header-spacer {
        background-color: var(--header-bg);
        position: relative;
      }
    }

    .user {
      padding-top: 9.5x;
    }

</style>
