<script>
import { mapGetters } from 'vuex';
import { NORMAN } from '@/config/types';
import Import from '@/components/Import';
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
    Import,
  },

  computed: {
    ...mapGetters(['clusterReady', 'isMultiCluster', 'currentCluster',
      'currentProduct', 'backToRancherLink', 'backToRancherGlobalLink']),

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
  },

  methods: {
    showMenu(show) {
      if (show) {
        this.$refs.popover.show();
      } else {
        this.$refs.popover.hide();
      }
    },

    openImport() {
      this.$modal.show('importModal');
    },

    closeImport() {
      this.$modal.hide('importModal');
    }
  }
};
</script>

<template>
  <header>
    <div class="product">
      <ProductSwitcher v-if="currentCluster" />
      <div alt="Logo" class="logo">
        <img src="~/assets/images/pl/half-logo.svg" />
      </div>
    </div>

    <div class="top">
      <NamespaceFilter v-if="clusterReady && currentProduct && currentProduct.showNamespaceFilter" />
      <WorkspaceSwitcher v-else-if="clusterReady && currentProduct && currentProduct.showWorkspaceSwitcher" />
    </div>

    <div class="back">
      <a v-if="currentProduct && isMultiCluster" class="btn role-tertiary" :href="(currentProduct.inStore === 'management' ? backToRancherGlobalLink : backToRancherLink)">
        {{ t('nav.backToRancher') }}
      </a>
    </div>

    <div class="import">
      <button v-if="currentProduct && currentProduct.showClusterSwitcher" :disabled="!showImport" type="button" class="btn role-tertiary" @click="openImport()">
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
    </div>

    <div class="kubectl">
      <button v-if="currentProduct && currentProduct.showClusterSwitcher" :disabled="!showShell" type="button" class="btn role-tertiary" @click="currentCluster.openShell()">
        <i v-tooltip="t('nav.shell')" class="icon icon-terminal icon-lg" />
      </button>
    </div>

    <div class="cluster">
      <ClusterSwitcher v-if="isMultiCluster && currentProduct && currentProduct.showClusterSwitcher" />
    </div>

    <div class="user" tabindex="0" @blur="showMenu(false)" @click="showMenu(true)" @focus.capture="showMenu(true)">
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
          <img v-if="principal && principal.avatarSrc" :src="principal.avatarSrc" :class="{'avatar-round': principal.roundAvatar}" width="40" height="40" />
          <i v-else class="icon icon-user icon-3x avatar" />
        </div>
        <template slot="popover">
          <ul class="list-unstyled dropdown" @click.stop="showMenu(false)">
            <li v-if="authEnabled" class="user-info">
              <div class="user-name">
                <i class="icon icon-lg icon-user" /> {{ principal.loginName }}
              </div>
              <div class="text-small pb-5">
                {{ principal.name }}
              </div>
            </li>
            <div>
              <nuxt-link tag="li" :to="{name: 'prefs'}" class="hand">
                <a>Preferences <i class="icon icon-fw icon-gear" /></a>
              </nuxt-link>
              <nuxt-link tag="li" :to="{name: 'account'}" class="hand">
                <a>Account &amp; API Keys <i class="icon icon-fw icon-user" /></a>
              </nuxt-link>
              <nuxt-link v-if="authEnabled" tag="li" :to="{name: 'auth-logout'}" class="pt-5 pb-5 hand">
                <a @blur="showMenu(false)">Log Out <i class="icon icon-fw icon-close" /></a>
              </nuxt-link>
            </div>
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

    .labeled-select,
    .unlabeled-select {
      min-height: 0;
      height: $input-height;
    }

    > * {
      display: flex;
      align-items: center;
      padding: 0 5px;
    }

    ::v-deep > div > .btn {
      border: 1px solid var(--header-btn-bg);
      background: rgba(0,0,0,.05);
      color: var(--header-btn-text);

      &[disabled=disabled] {
        background-color: var(--header-btn-bg) !important;
        color: var(--header-btn-text) !important;
        opacity: 0.7;
      }
    }

    grid-template-areas:  "product top back import kubectl cluster user";
    grid-template-columns: var(--nav-width) auto min-content min-content min-content min-content var(--header-height);
    grid-template-rows:    var(--header-height);

    > .product {
      grid-area: product;
      background-color: var(--header-btn-bg);
      position: relative;
      display: block;

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

    > .import {
      grid-area: import;
      background-color: var(--header-bg);
    }

    > .kubectl {
      grid-area: kubectl;
      background-color: var(--header-bg);
    }

    > .back,
    > .import,
    > .kubectl {
      text-align: right;

      .btn {
        text-align: center;
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
