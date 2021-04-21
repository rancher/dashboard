<script>
import { mapGetters } from 'vuex';
import { NORMAN } from '@/config/types';
import { ucFirst } from '@/utils/string';
import Import from '@/components/Import';
import NamespaceFilter from './NamespaceFilter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import TopLevelMenu from './TopLevelMenu';
import Jump from './Jump';

export default {

  components: {
    NamespaceFilter,
    WorkspaceSwitcher,
    Import,
    TopLevelMenu,
    Jump,
  },

  props: {
    simple: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { show: false };
  },

  computed: {
    ...mapGetters(['clusterReady', 'isMultiCluster', 'isRancher', 'currentCluster',
      'currentProduct', 'backToRancherLink', 'backToRancherGlobalLink']),
    ...mapGetters('type-map', ['activeProducts']),

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    showShell() {
      return !!this.currentCluster?.links?.shell;
    },

    showImport() {
      return !!this.currentCluster?.actions?.apply;
    },

    prod() {
      const name = this.currentProduct.name;

      return this.$store.getters['i18n/withFallback'](`product."${ name }"`, null, ucFirst(name));
    },

    showSearch() {
      return this.currentProduct?.inStore === 'cluster';
    },
  },

  methods: {
    showMenu(show) {
      if (this.$refs.popover) {
        if (show) {
          this.$refs.popover.show();
        } else {
          this.$refs.popover.hide();
        }
      }
    },

    openImport() {
      this.$modal.show('importModal');
    },

    closeImport() {
      this.$modal.hide('importModal');
    },

    openSearch() {
      this.$modal.show('searchModal');
    },

    hideSearch() {
      this.$modal.hide('searchModal');
    }
  }
};
</script>

<template>
  <header :class="{'simple': simple}">
    <div class="menu-spacer"></div>
    <div v-if="!simple" class="product">
      <div v-if="currentProduct && currentProduct.showClusterSwitcher" class="cluster">
        <img v-if="currentCluster" class="cluster-os-logo" :src="currentCluster.providerLogo" />
        <div class="cluster-name">
          {{ currentCluster.spec.displayName }}
        </div>
      </div>
      <div v-if="currentProduct && !currentProduct.showClusterSwitcher" class="cluster">
        <div class="product-name">
          {{ prod }}
        </div>
      </div>
    </div>
    <div v-else class="simple-title">
      <img class="side-menu-logo" src="~/assets/images/pl/rancher-logo.svg" width="110" />
      <div class="title">
        {{ t('nav.title') }}
      </div>
    </div>

    <TopLevelMenu></TopLevelMenu>

    <div v-if="!simple" class="top">
      <NamespaceFilter v-if="clusterReady && currentProduct && currentProduct.showNamespaceFilter" />
      <WorkspaceSwitcher v-else-if="clusterReady && currentProduct && currentProduct.showWorkspaceSwitcher" />
    </div>

    <div v-if="!simple" class="header-buttons">
      <button v-if="currentProduct && currentProduct.showClusterSwitcher" :disabled="!showImport" type="button" class="btn header-btn role-tertiary" @click="openImport()">
        <i v-tooltip="t('nav.import')" class="icon icon-upload icon-lg" />
      </button>
      <modal
        class="import-modal"
        name="importModal"
        width="75%"
        height="auto"
        styles="max-height: 90vh;"
      >
        <Import :cluster="currentCluster" @close="closeImport" />
      </modal>

      <button v-if="currentProduct && currentProduct.showClusterSwitcher" :disabled="!showShell" type="button" class="btn header-btn role-tertiary" @click="currentCluster.openShell()">
        <i v-tooltip="t('nav.shell')" class="icon icon-terminal icon-lg" />
      </button>

      <button
        v-if="showSearch"
        ref="searchButton"
        v-shortkey="{windows: ['ctrl', 'k'], mac: ['meta', 'k']}"
        type="button"
        class="btn role-tertiary resource-search"
        @shortkey="openSearch()"
        @click="openSearch()"
      >
        <i v-tooltip="t('nav.resourceSearch.label')" class="icon icon-search icon-lg" />
      </button>
      <modal
        v-if="showSearch"
        class="search-modal"
        name="searchModal"
        width="50%"
        height="auto"
      >
        <Jump @closeSearch="hideSearch()" />
      </modal>
    </div>

    <div class="header-spacer"></div>

    <div class="user user-menu" tabindex="0" @blur="showMenu(false)" @click="showMenu(true)" @focus.capture="showMenu(true)">
      <v-popover
        ref="popover"
        placement="bottom-end"
        offset="-10"
        trigger="manual"
        :delay="{show: 0, hide: 0}"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
        :container="false"
      >
        <div class="user-image text-right hand">
          <img v-if="principal && principal.avatarSrc" :src="principal.avatarSrc" :class="{'avatar-round': principal.roundAvatar}" width="36" height="36" />
          <i v-else class="icon icon-user icon-3x avatar" />
        </div>
        <template slot="popover" class="user-menu">
          <ul class="list-unstyled dropdown" @click.stop="showMenu(false)">
            <li v-if="authEnabled" class="user-info">
              <div class="user-name">
                <i class="icon icon-lg icon-user" /> {{ principal.loginName }}
              </div>
              <div class="text-small pt-5 pb-5">
                {{ principal.name }}
              </div>
            </li>
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="user-menu-item">
              <a>Preferences <i class="icon icon-fw icon-gear" /></a>
            </nuxt-link>
            <nuxt-link v-if="isRancher" tag="li" :to="{name: 'account'}" class="user-menu-item">
              <a>Account &amp; API Keys <i class="icon icon-fw icon-user" /></a>
            </nuxt-link>
            <nuxt-link v-if="authEnabled" tag="li" :to="{name: 'auth-logout'}" class="user-menu-item">
              <a @blur="showMenu(false)">Log Out <i class="icon icon-fw icon-close" /></a>
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

    .title {
      border-left: 1px solid var(--header-border);
      padding-left: 10px;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .filter {
      ::v-deep .labeled-select,
      ::v-deep .unlabeled-select {
        .vs__search::placeholder {
          color: var(--body-text) !important;
        }

        .vs__dropdown-toggle .vs__actions:after {
          color: var(--body-text) !important;
          font-size: 1.5rem;
          padding-right: 4px;
        }

        .vs__dropdown-toggle {
          background: transparent;
          border: 1px solid var(--header-border);
        }
      }
    }

    > * {
      padding: 0 5px;
    }

    .back {
      padding-top: 6px;

      > *:first-child {
        height: 40px;
      }
    }

    .import, .kubectl {
      padding-top: 11.5px;
      > *:first-child {
        height: 32px;
        > i {
          line-height: 32px;
        }
      }
    }

    .simple-title {
      align-items: center;
      display: flex;

      .title {
        height: 24px;
        line-height: 24px;
      }
    }

    .user-menu {
      padding-top: 9.5px;
    }

    ::v-deep > div > .btn.role-tertiary {
      border: 1px solid var(--header-btn-bg);
      border: none;
      background: var(--header-btn-bg);
      color: var(--header-btn-text);
      padding: 0 10px;
      line-height: 32px;
      min-height: 32px;

      &:hover {
        background: var(--link-text);
        color: #fff;
      }

      &[disabled=disabled] {
        background-color: rgba(0,0,0,0.25) !important;
        color: var(--header-btn-text) !important;
        opacity: 0.7;
      }
    }

    grid-template-areas:  "menu product top buttons cluster user";
    grid-template-columns: var(--header-height) calc(var(--nav-width) - var(--header-height)) auto min-content  min-content var(--header-height);
    grid-template-rows:    var(--header-height);

    &.simple {
      grid-template-columns: var(--header-height) min-content auto min-content min-content var(--header-height);
    }

    > .menu-spacer {
      width: 65px;
    }

    .cluster {
      align-items: center;
      display: flex;
      height: 32px;
      white-space: nowrap;
      .cluster-os-logo {
        width: 32px;
        height: 32px;
        margin-right: 10px;
      }
      .cluser-name {
        font-size: 16px;
      }
    }

    > .product {
      grid-area: product;
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
    }

    .header-buttons {
      align-items: center;
      display: flex;
      grid-area: buttons;
      margin-top: 1px;

      // Spacing between header buttons
      .btn:not(:last-of-type) {
        margin-right: 10px;
      }

      .btn:focus {
        box-shadow: none;
      }
    }

    .product-name {
      font-size: 16px;
    }

    .side-menu-logo {
      margin-right: 8px;
    }

    > * {
      background-color: var(--header-bg);
      border-bottom: var(--header-border-size) solid var(--header-border);
    }

    .header-btn {
      width: 40px;
    }

    > .header-spacer {
      grid-area: cluster;
      background-color: var(--header-bg);
      position: relative;
    }

    > .top {
      grid-area: top;
      padding-top: 6px;

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

      .filter .vs__dropdown-toggle {
        background: var(--header-btn-bg);
        border-radius: var(--border-radius);
        border: none;
        margin: 0 35px 0 25px!important;
      }
    }

    > .user {
      outline: none;

      .v-popover {
        display: flex;
        ::v-deep .trigger{
        .user-image {
            display: flex;
          }
        }
      }

      .user-image {
        display: flex;
        align-items: center;
      }

      &:focus {
        .v-popover {
          ::v-deep .trigger {
            line-height: 0;
            .user-image {
              max-height: 40px;
            }
            .user-image > * {
              @include form-focus
            }
          }
        }
      }

      grid-area: user;
      background-color: var(--header-bg);

      IMG {
        //border: 1px solid var(--header-btn-bg);
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
        padding: 10px 20px;
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

  .user-menu {
    // Remove the default padding on the popup so that the hover on menu items goes full width of the menu
    ::v-deep .popover-inner {
      padding: 10px 0;
    }

    ::v-deep .v-popover {
      display: flex;
    }
  }

  .user-menu-item {
    a {
      cursor: hand;
      padding: 0px 10px;

      &:hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        text-decoration: none;
      }

      // When the menu item is focused, pop the margin and compensate the padding, so that
      // the focus border appears within the menu
      &:focus {
        margin: 0 2px;
        padding: 10px 8px;
      }
    }
  }
</style>
