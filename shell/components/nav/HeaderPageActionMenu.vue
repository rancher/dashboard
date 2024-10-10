<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useClickOutside } from '@shell/composables/useClickOutside';

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

const target = ref(null);

useClickOutside(target, () => showPageActionsMenu(false));

const handleBlurEvent = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    showPageActionsMenu(false);
  }
};
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
  >
    <i
      data-testid="page-actions-menu"
      class="icon icon-actions"
      tabindex="0"
      @keydown="handleBlurEvent"
      @click="showPageActionsMenu(true)"
      @focus.capture="showPageActionsMenu(true)"
    />

    <template #popper>
      <div
        ref="target"
        class="user-menu"
      >
        <ul
          data-testid="page-actions-dropdown"
          class="list-unstyled dropdown"
        >
          <li
            v-for="(a) in pageActions"
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
      </div>
    </template>
  </v-dropdown>
  <div class="page-actions">
    <!--Empty container for mounting popper content-->
  </div>
</template>

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

  .icon-actions:focus {
    outline: 0;
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
