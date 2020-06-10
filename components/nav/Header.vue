<script>
import { mapState } from 'vuex';
import { NORMAN } from '@/config/types';
import ClusterSwitcher from './ClusterSwitcher';
import NamespaceFilter from './NamespaceFilter';

export default {
  components: {
    ClusterSwitcher,
    NamespaceFilter,
  },

  computed: {
    ...mapState(['managementReady', 'clusterReady', 'isRancher', 'isMultiCluster', 'currentCluster']),

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    backToRancherLink() {
      if ( !this.isRancher ) {
        return;
      }

      const cluster = this.$store.getters['currentCluster'];
      let link = '/';

      if ( cluster ) {
        link = `/c/${ escape(cluster.id) }`;
      }

      if ( process.env.dev ) {
        link = `https://localhost:8000${ link }`;
      }

      return link;
    },

  },
};
</script>

<template>
  <header :class="{'back-to-rancher': backToRancherLink}">
    <div class="cluster">
      <div class="logo" alt="Logo" />
      <ClusterSwitcher v-if="isMultiCluster" />
    </div>

    <div class="top">
      <NamespaceFilter v-if="clusterReady" />
    </div>

    <div v-if="backToRancherLink" class="back">
      <a v-t="'header.backToRancher'" :href="backToRancherLink" />
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
          <img v-if="principal && principal.avatarSrc" :src="principal.avatarSrc" width="40" height="40" />
          <i v-else class="icon icon-user icon-3x" />
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

    grid-template-areas:  "cluster  top   back user";
    grid-template-columns: var(--nav-width) auto 0px var(--header-height);
    grid-template-rows:    var(--header-height);

    &.back-to-rancher {
      grid-template-columns: var(--nav-width) auto 150px var(--header-height);
    }

    > .cluster {
      grid-area: cluster;
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

    > .top {
      grid-area: top;
      background-color: var(--header-bg);
      padding-top: 8px;

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
    }
  }
</style>
