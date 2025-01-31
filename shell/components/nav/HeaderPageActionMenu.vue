<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const isPageActionMenuOpen = ref(false);

const showPageActionsMenu = (show: boolean) => {
  isPageActionMenuOpen.value = show;
};

const store = useStore();
const pageActions = computed(() => store.getters.pageActions);
const pageAction = (action: string) => {
  store.dispatch('handlePageAction', action);
  showPageActionsMenu(false);
};
<<<<<<< HEAD
</script>

<template>
  <rc-dropdown :aria-label="t('nav.actionMenu.label')">
    <rc-dropdown-trigger
      tertiary
      data-testid="page-actions-menu"
      :aria-label="t('nav.actionMenu.button.label')"
    >
      <i class="icon icon-actions" />
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <template
        v-for="(a) in pageActions"
        :key="a.label"
=======

const target = ref(null);

useClickOutside(target, () => showPageActionsMenu(false));
</script>

<template>
  <v-dropdown
    class="actions"
    :triggers="[]"
    :shown="isPageActionMenuOpen"
    :autoHide="false"
    :flip="false"
    :placement="'bottom-end'"
    :distance="-6"
    :container="'.page-actions'"
    tabindex="0"
    role="menu"
    :aria-label="t('generic.actionMenu')"
    @click="showPageActionsMenu(true)"
    @keyup.enter="showPageActionsMenu(true)"
    @keyup.space="showPageActionsMenu(true)"
  >
    <i
      data-testid="page-actions-menu"
      class="icon icon-actions"
    />

    <template #popper>
      <div
        ref="target"
        class="user-menu"
        @focus.capture="showPageActionsMenu(true)"
        @blur.capture="showPageActionsMenu(false)"
>>>>>>> 71a961b620 (header keyboard nav work save)
      >
        <rc-dropdown-item
          v-if="!a.separator"
          @click="pageAction(a)"
        >
<<<<<<< HEAD
          {{ a.labelKey ? t(a.labelKey) : a.label }}
        </rc-dropdown-item>
        <rc-dropdown-separator
          v-else
        />
      </template>
=======
          <li
            v-for="(a) in pageActions"
            :key="a.label"
            class="user-menu-item"
          >
            <a
              v-if="!a.separator"
              tabindex="0"
              role="button"
              :aria-label="a.labelKey ? t(a.labelKey) : a.label"
              @click="pageAction(a)"
              @keyup.enter="pageAction(a)"
              @keyup.space="pageAction(a)"
            >{{ a.labelKey ? t(a.labelKey) : a.label }}</a>
            <div
              v-else
              class="menu-separator"
            >
              <div class="menu-separator-line" />
            </div>
          </li>
        </ul>
      </div>
>>>>>>> 71a961b620 (header keyboard nav work save)
    </template>
  </rc-dropdown>
</template>
<<<<<<< HEAD
=======

<style lang="scss" scoped>
  .page-actions :deep(.v-popper__popper) {
    .v-popper__wrapper {
      .v-popper__arrow-container {
        display: none;
      }

      .v-popper__inner {
        padding: 10px 0 10px 0;
      }
    }
  }

  .actions:focus-visible {
    outline: 0;
    z-index: 2;

    & .icon-actions {
      @include focus-outline;
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
      color: var(--link);
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
</style>
>>>>>>> 71a961b620 (header keyboard nav work save)
