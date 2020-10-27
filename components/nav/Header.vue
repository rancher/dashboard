<script>
import { mapGetters } from 'vuex';
import { NORMAN } from '@/config/types';
import ProductSwitcher from './ProductSwitcher';
import ClusterSwitcher from './ClusterSwitcher';
import NamespaceFilter from './NamespaceFilter';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default {
  components: {
    ProductSwitcher,
    ClusterSwitcher,
    NamespaceFilter,
    WorkspaceSwitcher,
  },

  computed: {
    ...mapGetters(['clusterReady', 'isMultiCluster', 'currentCluster',
      'currentProduct', 'isExplorer', 'backToRancherLink', 'backToRancherGlobalLink']),

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    showShell() {
      return !!this.currentCluster?.links?.shell;
    },
  },
};
</script>

<template>
  <header :class="{explorer: isExplorer}">
    <div class="product">
      <ProductSwitcher v-if="currentCluster" />
      <div alt="Logo" class="logo">
        <img src="~/assets/images/pl/half-logo.svg" />
      </div>
    </div>

    <div class="apps">
      <nuxt-link v-if="currentCluster" :to="{name: 'c-cluster-apps', params: { cluster: currentCluster.id }}" class="btn role-tertiary">
        <i class="icon icon-lg icon-marketplace pr-5" /> Apps
      </nuxt-link>
    </div>

    <div class="top">
      <NamespaceFilter v-if="clusterReady && currentProduct && currentProduct.showNamespaceFilter" />
      <WorkspaceSwitcher v-else-if="clusterReady && currentProduct && currentProduct.showWorkspaceSwitcher" />
    </div>

    <div class="back">
      <a v-if="currentProduct" class="btn role-tertiary" :href="(currentProduct.inStore === 'management' ? backToRancherGlobalLink : backToRancherLink)">
        {{ t('nav.backToRancher') }}
      </a>
    </div>

    <div class="kubectl">
      <button v-if="currentProduct && currentProduct.showClusterSwitcher" :disabled="!showShell" type="button" class="btn role-tertiary" @click="currentCluster.openShell()">
        <i class="icon icon-terminal icon-lg" /> {{ t('nav.shell') }}
      </button>
    </div>

    <div class="cluster">
      <ClusterSwitcher v-if="isMultiCluster && currentProduct && currentProduct.showClusterSwitcher" />
    </div>

    <div class="user">
      <v-popover
        placement="bottom"
        offset="-10"
        trigger="hover"
        :delay="{show: 0, hide: 200}"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <div class="text-right">
          <img v-if="principal && principal.avatarSrc" :src="principal.avatarSrc" :class="{'avatar-round': principal.provider === 'github'}" width="40" height="40" />
          <i v-else class="icon icon-user icon-3x avatar" />
        </div>

        <template slot="popover">
          <ul class="list-unstyled dropdown">
            <li v-if="authEnabled" class="user-info">
              <div class="user-name">
                <i class="icon icon-lg icon-user" /> {{ principal.loginName }}
              </div>
              <div class="text-small pb-5">
                {{ principal.name }}
              </div>
            </li>
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="hand">
              <a>Preferences <i class="icon icon-fw icon-gear" /></a>
            </nuxt-link>
            <nuxt-link v-if="authEnabled" tag="li" :to="{name: 'auth-logout'}" class="pt-5 pb-5 hand">
              <a>Log Out <i class="icon icon-fw icon-close" /></a>
            </nuxt-link>
          </ul>
        </template>
      </v-popover>
    </div>
  </header>
</template>

<style lang="scss" scoped>
  HEADER {
    display: grid;
    height: 100vh;

    ::v-deep .btn {
      border: 1px solid var(--header-btn-bg);
      background: rgba(0,0,0,.05);
      margin-left: 10px;
      color: var(--header-btn-text);
    }

    grid-template-areas:  "product apps top back kubectl cluster user";
    grid-template-columns: var(--nav-width) 0 auto min-content min-content min-content var(--header-height);
    grid-template-rows:    var(--header-height);

    &.explorer {
      grid-template-columns: var(--nav-width) min-content auto min-content min-content min-content var(--header-height);
    }

    > .apps {
      grid-area: apps;
      background-color: var(--header-bg);
    }

    > .product {
      grid-area: product;
      background-color: var(--header-btn-bg);
      position: relative;

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
    }

    > .back {
      grid-area: back;
      background-color: var(--header-bg);
    }

    > .kubectl {
      grid-area: kubectl;
      background-color: var(--header-bg);
    }

    > .apps,
    > .back,
    > .kubectl {
      text-align: right;
      padding: 0 5px 0 0;

      .btn {
        margin: 8px 0 0 0;
        text-align: center;
      }
    }

    > .apps {
      padding: 0 0 0 5px;
    }

    > .cluster {
      grid-area: cluster;
      background-color: var(--header-bg);
      position: relative;
    }

    > .top {
      grid-area: top;
      background-color: var(--header-bg);
      padding-top: 8px;

      INPUT[type='search']::placeholder,
      .vs__open-indicator,
      .vs__selected {
        color: var(--header-btn-bg) !important;
        background: var(--header-btn-bg);
        border-radius: var(--border-radius);
        border: none;
        margin: 0 35px 0 25px!important;
      }

      .vs__selected {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }

      .vs__deselect {
        fill: var(--header-btn-bg);
      }

      .filter {
        padding-left: 5px;
      }

      .filter .vs__dropdown-toggle {
        background: var(--header-btn-bg);
        border-radius: var(--border-radius);
        border: none;
        margin: 0 35px 0 25px!important;
      }
    }

    > .user {
      grid-area: user;
      background-color: var(--header-bg);
      padding: 5px;

      IMG {
        border: 1px solid var(--header-btn-bg);
      }

      .avatar-round {
        border: 0;
        border-radius: 50%;
      }
    }
  }

  .list-unstyled {
    li {
      a {
        display: flex;
        justify-content: space-between;
        padding: 10px;
      }

      &.user-info {
        display: block;
        margin-bottom: 10px;
        padding: 15px;
        border-bottom: solid 1px var(--border);
        min-width: 200px;
      }
    }
  }

  .popover .popover-inner {
    padding: 0;
    border-radius: 0;
  }

  .user-name {
    color: var(--secondary);
  }
</style>
