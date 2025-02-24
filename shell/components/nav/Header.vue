<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { MANAGEMENT, NORMAN, STEVE } from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { ucFirst } from '@shell/utils/string';
import { isAlternate, isMac } from '@shell/utils/platform';
import Import from '@shell/components/Import';
import BrandImage from '@shell/components/BrandImage';
import { getProduct, getVendor } from '@shell/config/private-label';
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ClusterBadge from '@shell/components/ClusterBadge';
import AppModal from '@shell/components/AppModal';
import { LOGGED_OUT, IS_SSO } from '@shell/config/query-params';
import NamespaceFilter from './NamespaceFilter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import TopLevelMenu from './TopLevelMenu';

import Jump from './Jump';
import { allHash } from '@shell/utils/promise';
import { ActionLocation, ExtensionPoint } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import IconOrSvg from '@shell/components/IconOrSvg';
import { wait } from '@shell/utils/async';
import { configType } from '@shell/models/management.cattle.io.authconfig';
import HeaderPageActionMenu from './HeaderPageActionMenu.vue';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

export default {

  components: {
    NamespaceFilter,
    WorkspaceSwitcher,
    Import,
    TopLevelMenu,
    Jump,
    BrandImage,
    ClusterBadge,
    ClusterProviderIcon,
    IconOrSvg,
    AppModal,
    HeaderPageActionMenu,
    RcDropdown,
    RcDropdownItem,
    RcDropdownSeparator,
    RcDropdownTrigger,
  },

  props: {
    simple: {
      type:    Boolean,
      default: false
    }
  },

  fetch() {
    // fetch needed data to check if any auth provider is enabled
    this.$store.dispatch('auth/getAuthProviders');
  },

  data() {
    const searchShortcut = isMac ? '(\u2318-K)' : '(Ctrl+K)';
    const shellShortcut = '(Ctrl+`)';

    return {
      authInfo:               {},
      show:                   false,
      showTooltip:            false,
      isUserMenuOpen:         false,
      isPageActionMenuOpen:   false,
      kubeConfigCopying:      false,
      searchShortcut,
      shellShortcut,
      LOGGED_OUT,
      navHeaderRight:         null,
      extensionHeaderActions: getApplicableExtensionEnhancements(this, ExtensionPoint.ACTION, ActionLocation.HEADER, this.$route),
      ctx:                    this,
      showImportModal:        false,
      showSearchModal:        false
    };
  },

  computed: {
    ...mapGetters([
      'clusterReady',
      'isExplorer',
      'isRancher',
      'currentCluster',
      'currentProduct',
      'rootProduct',
      'backToRancherLink',
      'backToRancherGlobalLink',
      'pageActions',
      'isSingleProduct',
      'isRancherInHarvester',
      'showTopLevelMenu',
      'isMultiCluster'
    ]),

    samlAuthProviderEnabled() {
      const publicAuthProviders = this.$store.getters['rancher/all']('authProvider');

      return publicAuthProviders.find((authProvider) => configType[authProvider.id] === 'saml') || {};
    },

    shouldShowSloLogoutModal() {
      if (this.isAuthLocalProvider) {
        // If the user logged in as a local user... they cannot log out as if they were an auth config user
        return false;
      }

      const { logoutAllSupported, logoutAllEnabled, logoutAllForced } = this.samlAuthProviderEnabled;

      return logoutAllSupported && logoutAllEnabled && !logoutAllForced;
    },

    appName() {
      return getProduct();
    },

    vendor() {
      this.$store.getters['management/all'](MANAGEMENT.SETTING)?.find((setting) => setting.id === 'ui-pl');

      return getVendor();
    },

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    isAuthLocalProvider() {
      return this.principal && this.principal.provider === 'local';
    },

    generateLogoutRoute() {
      return this.isAuthLocalProvider ? { name: 'auth-logout', query: { [LOGGED_OUT]: true } } : { name: 'auth-logout', query: { [LOGGED_OUT]: true, [IS_SSO]: true } };
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    kubeConfigEnabled() {
      return true;
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    },

    showKubeShell() {
      return !this.rootProduct?.hideKubeShell;
    },

    showKubeConfig() {
      return !this.rootProduct?.hideKubeConfig;
    },

    showCopyConfig() {
      return !this.rootProduct?.hideCopyConfig;
    },

    showPreferencesLink() {
      return (this.$store.getters['management/schemaFor'](STEVE.PREFERENCE, false, false)?.resourceMethods || []).includes('PUT');
    },

    showAccountAndApiKeyLink() {
      // Keep this simple for the moment and only check if the user can see tokens... plus the usual isRancher/isSingleProduct
      const canSeeTokens = this.$store.getters['rancher/schemaFor'](NORMAN.TOKEN, false, false);

      return canSeeTokens && (this.isRancher || this.isSingleProduct);
    },

    showPageActions() {
      return !this.featureRancherDesktop && this.pageActions && this.pageActions.length;
    },

    showUserMenu() {
      return !this.featureRancherDesktop;
    },

    showFilter() {
      // Some products won't have a current cluster
      const validClusterOrProduct = this.currentCluster ||
                 (this.currentProduct && this.currentProduct.customNamespaceFilter) ||
                 (this.currentProduct && this.currentProduct.showWorkspaceSwitcher);
      // Don't show if the header is in 'simple' mode
      const notSimple = !this.simple;
      // One of these must be enabled, otherwise t here's no component to show
      const validFilterSettings = this.currentProduct?.showNamespaceFilter || this.currentProduct?.showWorkspaceSwitcher;

      return validClusterOrProduct && notSimple && validFilterSettings;
    },

    featureRancherDesktop() {
      return this.$config.rancherEnv === 'desktop';
    },

    importEnabled() {
      return !!this.currentCluster?.actions?.apply;
    },

    prod() {
      const name = this.rootProduct.name;

      return this.$store.getters['i18n/withFallback'](`product."${ name }"`, null, ucFirst(name));
    },

    showSearch() {
      return this.rootProduct?.inStore === 'cluster';
    },

    showImportYaml() {
      return this.rootProduct?.inStore !== 'harvester';
    },

    nameTooltip() {
      return !this.showTooltip ? {} : {
        content: this.currentCluster?.nameDisplay,
        delay:   400,
      };
    },

    singleProductLogoRoute() {
      const cluster = this.$store.getters.defaultClusterId;

      return {
        ...this.isSingleProduct.logoRoute,
        params: {
          cluster,
          ...this.isSingleProduct.logoRoute.params,
        }
      };
    },

    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
  },

  watch: {
    currentCluster(nue, old) {
      if (nue && old && nue.id !== old.id) {
        this.checkClusterName();
      }
    },
    // since the Header is a "persistent component" we need to update it at every route change...
    $route: {
      handler(nue) {
        if (nue) {
          this.extensionHeaderActions = getApplicableExtensionEnhancements(this, ExtensionPoint.ACTION, ActionLocation.HEADER, nue);

          this.navHeaderRight = this.$plugin?.getDynamic('component', 'NavHeaderRight');
        }
      },
      immediate: true,
      deep:      true,
    }
  },

  mounted() {
    this.checkClusterName();
    this.debouncedLayoutHeader = debounce(this.layoutHeader, 400);
    window.addEventListener('resize', this.debouncedLayoutHeader);

    this.$nextTick(() => this.layoutHeader(null, true));
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.debouncedLayoutHeader);
  },

  methods: {
    showSloModal() {
      this.$store.dispatch('management/promptModal', {
        component:      'SloDialog',
        componentProps: { authProvider: this.samlAuthProviderEnabled },
        modalWidth:     '500px'
      });
    },
    // Sizes the product area of the header such that it shrinks to ensure the whole header bar can be shown
    // where possible - we use a minimum width of 32px which is enough to just show the product icon
    layoutHeader() {
      const header = this.$refs.header;
      const product = this.$refs.product;

      if (!header || !product) {
        return;
      }

      // If the product element has an exact size, remove it and then recalculate
      if (product.style.width) {
        product.style.width = '';

        this.$nextTick(() => this.layoutHeader());

        return;
      }

      const overflow = header.scrollWidth - window.innerWidth;

      if (overflow > 0) {
        const w = Math.max(32, product.offsetWidth - overflow);

        // Set exact width on the product div so that the content in it fits that available space
        product.style.width = `${ w }px`;
      }
    },
    showMenu(show) {
      this.isUserMenuOpen = show;
    },

    openImport() {
      this.showImportModal = true;
    },

    closeImport() {
      this.showImportModal = false;
    },

    openSearch() {
      this.showSearchModal = true;
    },

    hideSearch() {
      this.showSearchModal = false;
    },

    checkClusterName() {
      this.$nextTick(() => {
        const el = this.$refs.clusterName;

        this.showTooltip = el && (el.clientWidth < el.scrollWidth);
      });
    },

    copyKubeConfig(event) {
      const button = event.target?.parentElement;

      if (this.kubeConfigCopying) {
        return;
      }

      this.kubeConfigCopying = true;

      if (button) {
        button.classList.add('header-btn-active');
      }

      // Make sure we wait at least 1 second so that the user can see the visual indication that the config has been copied
      allHash({
        copy:     this.currentCluster.copyKubeConfig(),
        minDelay: wait(1000),
      }).finally(() => {
        this.kubeConfigCopying = false;

        if (button) {
          button.classList.remove('header-btn-active');
        }
      });
    },

    handleExtensionAction(action, event) {
      const fn = action.invoke;
      const opts = {
        event,
        action,
        isAlt:   isAlternate(event),
        product: this.currentProduct.name,
        cluster: this.currentCluster,
      };
      const enabled = action.enabled ? action.enabled.apply(this, [this.ctx]) : true;

      if (fn && enabled) {
        fn.apply(this, [opts, [], { $route: this.$route }]);
      }
    },

    handleExtensionTooltip(action) {
      if (action.tooltipKey || action.tooltip) {
        const tooltip = action.tooltipKey ? this.t(action.tooltipKey) : action.tooltip;
        const shortcut = action.shortcutLabel ? action.shortcutLabel() : '';

        return `${ tooltip } ${ shortcut }`;
      }

      return null;
    }
  }
};
</script>

<template>
  <header
    ref="header"
    data-testid="header"
  >
    <div>
      <TopLevelMenu v-if="isRancherInHarvester || isMultiCluster || !isSingleProduct" />
    </div>

    <div
      class="menu-spacer"
      :class="{'isSingleProduct': isSingleProduct }"
    >
      <router-link
        v-if="isSingleProduct && !isRancherInHarvester"
        :to="singleProductLogoRoute"
        role="link"
        :alt="t('branding.logos.home')"
      >
        <BrandImage
          v-if="isSingleProduct.supportCustomLogo && isHarvester"
          class="side-menu-logo"
          file-name="harvester.svg"
          :support-custom-logo="true"
          :alt="t('branding.logos.label')"
        />
        <img
          v-else
          class="side-menu-logo"
          :src="isSingleProduct.logo"
          :alt="t('branding.logos.label')"
        >
      </router-link>
    </div>

    <div
      v-if="!simple"
      ref="product"
      class="product"
    >
      <div
        v-if="currentProduct && currentProduct.showClusterSwitcher"
        v-clean-tooltip="nameTooltip"
        class="cluster cluster-clipped"
      >
        <div
          v-if="isSingleProduct && !isRancherInHarvester"
          class="product-name"
        >
          <template v-if="isSingleProduct.supportCustomLogo">
            {{ vendor }}
          </template>
          <template v-else>
            {{ t(isSingleProduct.productNameKey) }}
          </template>
        </div>
        <template v-else>
          <ClusterProviderIcon
            v-if="currentCluster"
            :cluster="currentCluster"
            class="mr-10"
            :alt="t('branding.logos.label')"
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
            :alt="t('branding.logos.label')"
          />
          <div
            v-if="!currentCluster"
            class="simple-title"
          >
            <BrandImage
              class="side-menu-logo-img"
              file-name="rancher-logo.svg"
              :alt="t('branding.logos.label')"
            />
          </div>
        </template>
      </div>
      <div
        v-if="currentProduct && !currentProduct.showClusterSwitcher"
        class="cluster"
      >
        <img
          v-if="currentProduct.iconHeader"
          v-bind="$attrs"
          :src="currentProduct.iconHeader"
          class="cluster-os-logo mr-10"
          style="width: 44px; height: 36px;"
          :alt="t('branding.logos.label')"
        >
        <div class="product-name">
          {{ prod }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="simple-title"
    >
      <div
        v-if="isSingleProduct"
        class="product-name"
      >
        {{ t(isSingleProduct.productNameKey) }}
      </div>

      <div
        v-else
        class="side-menu-logo"
      >
        <BrandImage
          class="side-menu-logo-img"
          data-testid="header__brand-img"
          file-name="rancher-logo.svg"
          :alt="t('branding.logos.label')"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="rd-header-right">
      <component :is="navHeaderRight" />
      <div
        v-if="showFilter"
        class="top"
      >
        <NamespaceFilter v-if="clusterReady && currentProduct && (currentProduct.showNamespaceFilter || isExplorer)" />
        <WorkspaceSwitcher v-else-if="clusterReady && currentProduct && currentProduct.showWorkspaceSwitcher" />
      </div>
      <div
        v-if="currentCluster && !simple"
        class="header-buttons"
      >
        <template v-if="currentProduct && currentProduct.showClusterSwitcher">
          <button
            v-if="showImportYaml"
            v-clean-tooltip="t('nav.import')"
            :disabled="!importEnabled"
            type="button"
            class="btn header-btn role-tertiary"
            data-testid="header-action-import-yaml"
            role="button"
            tabindex="0"
            :aria-label="t('nav.import')"
            @click="openImport()"
          >
            <i class="icon icon-upload icon-lg" />
          </button>
          <app-modal
            v-if="showImportModal"
            class="import-modal"
            name="importModal"
            width="75%"
            height="auto"
            styles="max-height: 90vh;"
            @close="closeImport"
          >
            <Import
              :cluster="currentCluster"
              @close="closeImport"
            />
          </app-modal>

          <button
            v-if="showKubeShell"
            id="btn-kubectl"
            v-clean-tooltip="t('nav.shellShortcut', {key: shellShortcut})"
            v-shortkey="{windows: ['ctrl', '`'], mac: ['meta', '`']}"
            :disabled="!shellEnabled"
            type="button"
            class="btn header-btn role-tertiary"
            role="button"
            tabindex="0"
            :aria-label="t('nav.shellShortcut', {key:''})"
            @shortkey="currentCluster.openShell()"
            @click="currentCluster.openShell()"
          >
            <i class="icon icon-terminal icon-lg" />
          </button>

          <button
            v-if="showKubeConfig"
            v-clean-tooltip="t('nav.kubeconfig.download')"
            :disabled="!kubeConfigEnabled"
            type="button"
            class="btn header-btn role-tertiary"
            data-testid="btn-download-kubeconfig"
            role="button"
            tabindex="0"
            :aria-label="t('nav.kubeconfig.download')"
            @click="currentCluster.downloadKubeConfig()"
          >
            <i class="icon icon-file icon-lg" />
          </button>

          <button
            v-if="showCopyConfig"
            v-clean-tooltip="t('nav.kubeconfig.copy')"
            :disabled="!kubeConfigEnabled"
            type="button"
            class="btn header-btn role-tertiary"
            data-testid="btn-copy-kubeconfig"
            role="button"
            tabindex="0"
            :aria-label="t('nav.kubeconfig.copy')"
            @click="copyKubeConfig($event)"
          >
            <i
              v-if="kubeConfigCopying"
              class="icon icon-checkmark icon-lg"
            />
            <i
              v-else
              class="icon icon-copy icon-lg"
            />
          </button>
        </template>

        <button
          v-if="showSearch"
          id="header-btn-search"
          v-clean-tooltip="t('nav.resourceSearch.toolTip', {key: searchShortcut})"
          v-shortkey="{windows: ['ctrl', 'k'], mac: ['meta', 'k']}"
          type="button"
          class="btn header-btn role-tertiary"
          data-testid="header-resource-search"
          role="button"
          tabindex="0"
          :aria-label="t('nav.resourceSearch.toolTip', {key: ''})"
          @shortkey="openSearch()"
          @click="openSearch()"
        >
          <i class="icon icon-search icon-lg" />
        </button>
        <app-modal
          v-if="showSearch && showSearchModal"
          class="search-modal"
          name="searchModal"
          width="50%"
          height="auto"
          :trigger-focus-trap="true"
          return-focus-selector="#header-btn-search"
          @close="hideSearch()"
        >
          <Jump @closeSearch="hideSearch()" />
        </app-modal>
      </div>

      <!-- Extension header actions -->
      <div
        v-if="extensionHeaderActions.length"
        class="header-buttons"
      >
        <button
          v-for="action, i in extensionHeaderActions"
          :key="`${action.label}${i}`"
          v-clean-tooltip="handleExtensionTooltip(action)"
          v-shortkey="action.shortcutKey"
          :disabled="action.enabled ? !action.enabled(ctx) : false"
          type="button"
          class="btn header-btn role-tertiary"
          :data-testid="`extension-header-action-${ action.labelKey || action.label }`"
          role="button"
          tabindex="0"
          :aria-label="action.label"
          @shortkey="handleExtensionAction(action, $event)"
          @click="handleExtensionAction(action, $event)"
        >
          <IconOrSvg
            class="icon icon-lg"
            :icon="action.icon"
            :src="action.svg"
            color="header"
          />
        </button>
      </div>

      <div class="center-self">
        <header-page-action-menu v-if="showPageActions" />
        <rc-dropdown
          v-if="showUserMenu"
          :aria-label="t('nav.userMenu.label')"
        >
          <rc-dropdown-trigger
            ghost
            small
            data-testid="nav_header_showUserMenu"
            :aria-label="t('nav.userMenu.button.label')"
          >
            <img
              v-if="principal && principal.avatarSrc"
              :src="principal.avatarSrc"
              :class="{'avatar-round': principal.roundAvatar}"
              width="36"
              height="36"
            >
            <i
              v-else
              class="icon icon-user icon-3x avatar"
            />
          </rc-dropdown-trigger>
          <template #dropdownCollection>
            <template v-if="authEnabled">
              <div class="user-info">
                <div class="user-name">
                  <i class="icon icon-lg icon-user" /> {{ principal.loginName }}
                </div>
                <div class="text-small">
                  <template v-if="principal.loginName !== principal.name">
                    {{ principal.name }}
                  </template>
                </div>
              </div>
              <rc-dropdown-separator />
            </template>
            <rc-dropdown-item
              v-if="showPreferencesLink"
              @click="$router.push({ name: 'prefs'})"
            >
              {{ t('nav.userMenu.preferences') }}
            </rc-dropdown-item>
            <rc-dropdown-item
              v-if="showAccountAndApiKeyLink"
              @click="$router.push({ name: 'account'})"
            >
              {{ t('nav.userMenu.accountAndKeys', {}, true) }}
            </rc-dropdown-item>
            <rc-dropdown-item
              v-if="authEnabled && shouldShowSloLogoutModal"
              @click="showSloModal"
            >
              {{ t('nav.userMenu.logOut') }}
            </rc-dropdown-item>
            <rc-dropdown-item
              v-else-if="authEnabled"
              @click="$router.push(generateLogoutRoute)"
            >
              {{ t('nav.userMenu.logOut') }}
            </rc-dropdown-item>
          </template>
        </rc-dropdown>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
  // It would be nice to grab this from `Group.vue`, but there's margin, padding and border, which is overkill to var
  $side-menu-group-padding-left: 16px;

  HEADER {
    display: flex;
    z-index: z-index('mainHeader');

    > .spacer {
      flex: 1;
    }

    > .menu-spacer {
      flex: 0 0 15px;

      &.isSingleProduct  {
        display: flex;
        justify-content: center;

        // Align the icon with the side nav menu items ($side-menu-group-padding-left)
        .side-menu-logo {
          margin-left: $side-menu-group-padding-left;
        }
      }
    }

    .title {
      border-left: 1px solid var(--header-border);
      padding-left: 10px;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .filter {
      :deep() .labeled-select,
      :deep() .unlabeled-select {
        .vs__search::placeholder {
          color: var(--body-text) !important;
        }

        .vs__dropdown-toggle .vs__actions:after {
          color: var(--body-text) !important;
        }

        .vs__dropdown-toggle {
          background: transparent;
          border: 1px solid var(--header-border);
        }
      }
    }

    .back {
      padding-top: 6px;

      > *:first-child {
        height: 40px;
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

    > .product {
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

    .product-name {
      font-size: 16px;
    }

    .side-menu-logo {
      align-items: center;
      display: flex;
      margin-right: 8px;
      height: 55px;
      margin-left: 5px;
      max-width: 200px;
      padding: 12px 0;
    }

    .side-menu-logo-img {
      object-fit: contain;
      height: 21px;
      max-width: 200px;
    }

    > * {
      background-color: var(--header-bg);
      border-bottom: var(--header-border-size) solid var(--header-border);
    }

    .rd-header-right {
      display: flex;
      flex-direction: row;
      padding: 0;

      > * {
        padding: 0 5px;
      }

      > .top {
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

      .header-buttons {
        align-items: center;
        display: flex;
        margin-top: 1px;

        // Spacing between header buttons
        .btn:not(:last-of-type) {
          margin-right: 10px;
        }

        .btn:focus {
          box-shadow: none;
        }

        > .header-btn {
          &.header-btn-active, &.header-btn-active:hover {
            background-color: var(--success);
            color: var(--success-text);
          }

          img {
            height: 20px;
            width: 20px;
          }
        }
      }

      .header-btn {
        width: 40px;
      }

      :deep() div .btn.role-tertiary {
        border: 1px solid var(--header-btn-bg);
        border: none;
        background: var(--header-btn-bg);
        color: var(--header-btn-text);
        padding: 0 10px;
        line-height: 32px;
        min-height: 32px;

        i {
          // Ideally same height as the parent button, but this means tooltip needs adjusting (which is it's own can of worms)
          line-height: 20px;
        }

        &:hover {
          background: var(--primary);
          color: #fff;
        }

        &[disabled=disabled] {
          background-color: rgba(0,0,0,0.25) !important;
          color: var(--header-btn-text) !important;
          opacity: 0.7;
        }
      }

      :deep(.actions) {
        align-items: center;
        cursor: pointer;
        display: flex;

        > I {
          font-size: 18px;
          padding: 6px;
          &:hover {
            color: var(--link);
          }
        }

        :deep(.v-popper:focus) {
          outline: 0;
        }

        .dropdown {
          margin: 0 -10px;
        }
      }

      .header-spacer {
        background-color: var(--header-bg);
        position: relative;
      }

      .avatar-round {
        border: 0;
        border-radius: 50%;
      }

      > .user {
        outline: none;
        width: var(--header-height);

        .v-popper {
          display: flex;
          :deep() .trigger{
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
          .v-popper {
            :deep() .trigger {
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

        background-color: var(--header-bg);
      }

      > .center-self {
        align-self: center;
        display: flex;
        gap: 1rem;
        align-items: center;
        padding-right: 1rem;
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
    }
  }

  div {
    &.user-info {
      padding: 0 8px;
      margin: 0 9px;
      min-width: 200px;
      display: flex;
      gap: 5px;
      flex-direction: column;
    }
  }

  .config-actions {
    li {
      a {
        justify-content: start;
        align-items: center;

        & .icon {
          margin: 0 4px;
        }

        &:hover {
          cursor: pointer;
        }
      }
    }
  }

  .v-popper__popper .v-popper__inner {
    padding: 0;
    border-radius: 0;
  }

  .user-name {
    display: flex;
    align-items: center;
    color: var(--secondary);
  }

  .user-menu {
    :deep(.v-popper__arrow-container) {
      display: none;
    }

    :deep(.v-popper__inner) {
      padding: 10px 0 10px 0;
    }

    :deep(.v-popper) {
      display: flex;
    }
  }

  .user-menu-item {
    a, &.no-link > span {
      cursor: pointer;
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

    &.no-link > span {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      color: var(--popover-text);
    }

    div.menu-separator {
      cursor: default;
      padding: 4px 0;

      .menu-separator-line {
        background-color: var(--border);
        height: 1px;
      }
    }
  }

</style>
