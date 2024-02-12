<script>
import { mapGetters } from 'vuex';
import { NORMAN } from '@shell/config/types';
import Import from '@shell/components/Import';
import { getProduct } from '@shell/config/private-label';
import { allHash } from '@shell/utils/promise';
import { ActionLocation, ExtensionPoint } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import IconOrSvg from '@shell/components/IconOrSvg';
import ResourceSearchActionButton from '@shell/components/Navigation/Header/Actions/ResourceSearchActionButton';
import PageHeaderActions from '@shell/mixins/page-actions';

const PAGE_HEADER_ACTION = 'page-action';

export default {

  components: {
    Import,
    IconOrSvg,
    ResourceSearchActionButton
  },

  mixins: [PageHeaderActions],

  data() {
    const shellShortcut = '(Ctrl+`)';

    return {
      show:                   false,
      showTooltip:            false,
      kubeConfigCopying:      false,
      shellShortcut,
      extensionHeaderActions: getApplicableExtensionEnhancements(this, ExtensionPoint.ACTION, ActionLocation.HEADER, this.$route),
      ctx:                    this
    };
  },

  computed: {
    ...mapGetters(['clusterReady', 'currentCluster', 'pageActions']),

    appName() {
      return getProduct();
    },

    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
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

    importEnabled() {
      return !!this.currentCluster?.actions?.apply;
    },
  },

  watch: {
    // since the Header is a "persistent component" we need to update it at every route change...
    $route(nue) {
      if (nue) {
        this.extensionHeaderActions = getApplicableExtensionEnhancements(this, ExtensionPoint.ACTION, ActionLocation.HEADER, nue);

        this.navHeaderRight = this.$plugin?.getDynamic('component', 'NavHeaderRight');
      }
    }
  },

  methods: {
    openImport() {
      this.$modal.show('importModal');
    },

    closeImport() {
      this.$modal.hide('importModal');
    },

    showPageActionsMenu(show) {
      if (this.$refs.pageActions) {
        if (show) {
          this.$refs.pageActions.show();
        } else {
          this.$refs.pageActions.hide();
        }
      }
    },

    pageAction(action) {
      this.$nuxt.$emit(PAGE_HEADER_ACTION, action);
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
        minDelay: new Promise((resolve) => setTimeout(resolve, 1000))
      }).finally(() => {
        this.kubeConfigCopying = false;

        if (button) {
          button.classList.remove('header-btn-active');
        }
      });
    }
  }
};
</script>

<template>
  <div
    v-if="clusterReady"
    class="header-buttons"
  >
    <template v-if="clusterReady">
      <button
        v-clean-tooltip="t('nav.import')"
        :disabled="!importEnabled"
        type="button"
        class="btn header-btn role-tertiary"
        @click="openImport()"
      >
        <i class="icon icon-upload icon-lg" />
      </button>
      <modal
        class="import-modal"
        name="importModal"
        width="75%"
        height="auto"
        styles="max-height: 90vh;"
      >
        <Import
          :cluster="currentCluster"
          @close="closeImport"
        />
      </modal>

      <button
        id="btn-kubectl"
        v-clean-tooltip="t('nav.shellShortcut', {key: shellShortcut})"
        v-shortkey="{windows: ['ctrl', '`'], mac: ['meta', '`']}"
        :disabled="!shellEnabled"
        type="button"
        class="btn header-btn role-tertiary"
        @shortkey="currentCluster.openShell()"
        @click="currentCluster.openShell()"
      >
        <i class="icon icon-terminal icon-lg" />
      </button>

      <button
        v-clean-tooltip="t('nav.kubeconfig.download')"
        :disabled="!kubeConfigEnabled"
        type="button"
        class="btn header-btn role-tertiary"
        @click="currentCluster.downloadKubeConfig()"
      >
        <i class="icon icon-file icon-lg" />
      </button>

      <button
        v-clean-tooltip="t('nav.kubeconfig.copy')"
        :disabled="!kubeConfigEnabled"
        type="button"
        class="btn header-btn role-tertiary"
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
    <ResourceSearchActionButton />
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

      <div
        id="page-actions"
        class="actions"
      >
        <i
          data-testid="page-actions-menu"
          class="icon icon-actions"
          @blur="showPageActionsMenu(false)"
          @click="showPageActionsMenu(true)"
          @focus.capture="showPageActionsMenu(true)"
        />
        <v-popover
          ref="pageActions"
          placement="bottom-end"
          offset="0"
          trigger="manual"
          :delay="{show: 0, hide: 0}"
          :popper-options="{modifiers: { flip: { enabled: false } } }"
          :container="false"
        >
          <template
            slot="popover"
            class="user-menu"
          >
            <ul
              data-testid="page-actions-dropdown"
              class="list-unstyled dropdown"
              @click.stop="showPageActionsMenu(false)"
            >
              <li
                v-for="a in pageActions"
                :key="a.label"
                class="user-menu-item"
              >
                <a
                  v-if="!a.separator"
                  @click="pageAction(a)"
                >{{ a.labelKey ? t(a.labelKey) : a.label }}</a>
                <div
                  v-else
                  class="menu-separator"
                >
                  <div class="menu-separator-line" />
                </div>
              </li>
            </ul>
          </template>
        </v-popover>
      </div>
    </div>
  </div>

  <!-- Extension header actions -->
</template>

<style lang="scss" scoped>
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

        ::v-deep .btn.role-tertiary {
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
      }

      .header-btn {
        width: 40px;
      }

      ::v-deep > div > .btn.role-tertiary {
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

      .actions {
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
      }

      .header-spacer {
        background-color: var(--header-bg);
        position: relative;
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

  .actions {
    ::v-deep .popover:focus {
      outline: 0;
    }

    .dropdown {
      margin: 0 -10px;
    }
  }
</style>
