<script>
import { NORMAN, STEVE } from '@shell/config/types';
import { LOGGED_OUT } from '@shell/config/query-params';

export default {
  data() {
    return { LOGGED_OUT };
  },

  computed: {
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    showPreferencesLink() {
      return (this.$store.getters['management/schemaFor'](STEVE.PREFERENCE, false, false)?.resourceMethods || []).includes('PUT');
    },

    showAccountAndApiKeyLink() {
      return this.$store.getters['rancher/schemaFor'](NORMAN.TOKEN, false, false);
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
  }
};
</script>

<template>
  <div
    class="user user-menu"
    data-testid="nav_header_showUserMenu"
    tabindex="0"
    @blur="showMenu(false)"
    @click="showMenu(true)"
    @focus.capture="showMenu(true)"
  >
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
      </div>
      <template
        slot="popover"
        class="user-menu"
      >
        <ul
          class="list-unstyled dropdown"
          data-testid="user-menu-dropdown"
          @click.stop="showMenu(false)"
        >
          <li
            v-if="isAuthenticated"
            class="user-info"
          >
            <div class="user-name">
              <i class="icon icon-lg icon-user" /> {{ principal.loginName }}
            </div>
            <div class="text-small pt-5 pb-5">
              <template v-if="principal.loginName !== principal.name">
                {{ principal.name }}
              </template>
            </div>
          </li>
          <nuxt-link
            v-if="showPreferencesLink"
            tag="li"
            :to="{name: 'prefs'}"
            class="user-menu-item"
          >
            <a>{{ t('nav.userMenu.preferences') }}</a>
          </nuxt-link>
          <nuxt-link
            v-if="showAccountAndApiKeyLink"
            tag="li"
            :to="{name: 'account'}"
            class="user-menu-item"
          >
            <a>{{ t('nav.userMenu.accountAndKeys', {}, true) }}</a>
          </nuxt-link>
          <nuxt-link
            v-if="isAuthenticated"
            tag="li"
            :to="{name: 'auth-logout', query: { [LOGGED_OUT]: true }}"
            class="user-menu-item"
          >
            <a @blur="showMenu(false)">{{ t('nav.userMenu.logOut') }}</a>
          </nuxt-link>
        </ul>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
  // It would be nice to grab this from `Group.vue`, but there's margin, padding and border, which is overkill to var
  $side-menu-group-padding-left: 16px;
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

      .user-menu {
        padding-top: 9.5px;
      }

      > .user {
        outline: none;
        width: var(--header-height);

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

        background-color: var(--header-bg);

        .avatar-round {
          border: 0;
          border-radius: 50%;
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
    display: flex;
    align-items: center;
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
