<script>
import { mapGetters } from 'vuex';
import { NORMAN } from '@/config/types';
import ProductSwitcher from './ProductSwitcher';
import ClusterSwitcher from './ClusterSwitcher';
import NamespaceFilter from './NamespaceFilter';

export default {
  components: {
    ProductSwitcher,
    ClusterSwitcher,
    NamespaceFilter,
  },

  computed: {
    ...mapGetters(['clusterReady', 'isMultiCluster', 'currentCluster', 'currentProduct', 'isExplorer']),

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    showShell() {
      return !!this.currentCluster?.links?.shell;
    }
  },
};
</script>

<template>
  <header>
    <div class="product">
      <ProductSwitcher />
      <div class="logo" alt="Logo" />
    </div>

    <div class="kubectl">
      <button :disabled="!showShell" type="button" class="btn role-tertiary" @click="currentCluster.openShell()">
        <i class="icon icon-terminal" />
      </button>
    </div>

    <div class="cluster">
      <ClusterSwitcher v-if="isMultiCluster" />
    </div>

    <div class="top">
      <nuxt-link v-if="isExplorer" :to="{name: 'c-cluster-apps'}" class="btn role-tertiary apps-button">
        <i class="icon icon-lg icon-marketplace pr-5" /> Apps
      </nuxt-link>
      <NamespaceFilter v-if="clusterReady && currentProduct.showNamespaceFilter" />
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
          <ul class="list-unstyled dropdown" style="margin: -1px;">
            <li v-if="authEnabled">
              <div>{{ principal.loginName }}</div>
              <div class="text-small pb-10">
                {{ principal.name }}
              </div>
            </li>
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="pt-5 pb-5 hand">
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

    .apps-button {
      border: 1px solid var(--header-dropdown);
      background: rgba(0,0,0,.05);
      margin-left: 10px;
    }

    grid-template-areas:  "product top kubectl cluster user";
    grid-template-columns: var(--nav-width) auto 50px min-content var(--header-height);
    grid-template-rows:    var(--header-height);

    > .product {
      grid-area: product;
      background-color: var(--header-dropdown);
      position: relative;

      .logo {
        background-color: var(--header-logo);
        mask: url("~assets/images/logo.svg") no-repeat center;
        height: 30px;
        width: 64px;
        position: absolute;
        top: 9px;
        left: -30px;
        z-index: 2;
      }
    }

    > .kubectl {
      grid-area: kubectl;
      background-color: var(--header-bg);

      .btn {
        border: 1px solid white;
        margin: 11px 0 0 0;
      }
    }

    > .cluster {
      grid-area: cluster;
      background-color: var(--header-bg);
      position: relative;
    }

    > .top {
      grid-area: top;
      background-color: var(--header-bg);
      padding-top: 6px;

      INPUT[type='search']::placeholder,
      .vs__open-indicator,
      .vs__selected {
        color: white!important;
      }

      .vs__selected {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .vs__deselect {
        fill: white;
      }

      .vs__actions {
        background: red!important;
      }

      .filter {
        margin-left: 10px;
        display: inline-block;

        .vs__dropdown-toggle {
          background: var(--header-dropdown);
          border-radius: var(--border-radius);
          border: none;
          margin: 0 35px 0 25px!important;
        }
      }
    }

    > .back {
      grid-area: back;
      background-color: var(--header-bg);

      A {
        line-height: var(--header-height);
        display: block;
        color: white;
        padding: 0 5px;
        margin-right: 20px;
        text-align: right;
      }
    }

    > .user {
      grid-area: user;
      background-color: var(--header-bg);
      padding: 5px;

      .avatar-round {
        border: 0;
        border-radius: 50%;
      }
    }
  }
</style>
