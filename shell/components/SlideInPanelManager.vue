<script lang="ts" setup>
import { computed, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';

const HEADER_HEIGHT = 55;

const store = useStore();
const isOpen = computed(() => store.getters['slideInPanel/isOpen']);
const isClosing = computed(() => store.getters['slideInPanel/isClosing']);
const currentComponent = computed(() => store.getters['slideInPanel/component']);
const currentProps = computed(() => store.getters['slideInPanel/componentProps']);

const panelTop = computed(() => {
  // Some components like the ResourceDetailDrawer are designed to take up the full height of the viewport so we want to be able to specify the top.
  if (currentProps?.value?.top) {
    return currentProps?.value?.top;
  }

  const banner = document.getElementById('banner-header');
  let height = HEADER_HEIGHT;

  if (banner) {
    height += banner.clientHeight;
  }

  return `${ height }px`;
});

// Some components like the ResourceDetailDrawer are designed to take up the full height of the viewport so we want to be able to specify the height.
const panelHeight = computed(() => (currentProps?.value?.height) ? (currentProps?.value?.height) : `calc(100vh - ${ panelTop?.value })`);
const panelWidth = computed(() => currentProps?.value?.width || '33%');
const panelRight = computed(() => (isOpen?.value ? '0' : `-${ panelWidth?.value }`));
const panelZIndex = computed(() => `${ (isOpen?.value ? 1 : 2) * (currentProps?.value?.zIndex ?? 1000) }`);

const showHeader = computed(() => currentProps?.value?.showHeader ?? true);
const panelTitle = showHeader.value ? computed(() => currentProps?.value?.title || 'Details') : null;

watch(
  /**
   * trigger focus trap
   */
  () => currentProps?.value?.triggerFocusTrap,
  (neu) => {
    if (neu) {
      const opts = {
        ...DEFAULT_FOCUS_TRAP_OPTS,
        /**
         * will return focus to the first iterable node of this container select
         */
        setReturnFocus: () => {
          const returnFocusSelector = currentProps?.value?.returnFocusSelector;

          if (returnFocusSelector && !document.querySelector(returnFocusSelector)) {
            console.warn('SlideInPanelManager: cannot find elem with "returnFocusSelector", returning focus to main view'); // eslint-disable-line no-console

            return '.dashboard-root';
          }

          return returnFocusSelector || '.dashboard-root';
        }
      };

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(
        () => {
          if (currentProps?.value?.focusTrapWatcherBasedVariable) {
            return currentProps.value.focusTrapWatcherBasedVariable;
          }

          return isOpen?.value && !isClosing?.value;
        },
        '#slide-in-panel-manager',
        opts,
        false
      );
    }
  }
);

watch(
  () => (store as any).$router?.currentRoute,
  () => {
    if (isOpen?.value && currentProps?.value.closeOnRouteChange !== false) {
      closePanel();
    }
  },
  { deep: true }
);

onBeforeUnmount(closePanel);

function closePanel() {
  store.commit('slideInPanel/close');
}
</script>

<template>
  <Teleport to="#slides">
    <div
      id="slide-in-panel-manager"
      @keydown.escape="closePanel"
    >
      <div
        v-show="isOpen"
        data-testid="slide-in-glass"
        class="slide-in-glass"
        :class="{ 'slide-in-glass-open': isOpen }"
        :style="{
          ['z-index']: panelZIndex
        }"
        @click="closePanel"
      />
      <div
        class="slide-in"
        :class="{ 'slide-in-open': isOpen }"
        :style="{
          width: panelWidth,
          right: panelRight,
          top: panelTop,
          height: panelHeight,
          ['z-index']: panelZIndex
        }"
      >
        <div
          v-if="showHeader"
          class="header"
        >
          <div class="title">
            {{ panelTitle }}
          </div>
          <i
            class="icon icon-close"
            data-testid="slide-in-close"
            :tabindex="isOpen ? 0 : -1"
            @click="closePanel"
          />
        </div>
        <div class="main-panel">
          <component
            :is="currentComponent"
            v-if="isOpen || currentComponent"
            v-bind="currentProps"
            data-testid="slide-in-panel-component"
            class="dynamic-panel-content"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.slide-in-glass {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}
.slide-in-glass-open {
  background-color: var(--body-bg);
  display: block;
  opacity: 0.5;
}

.slide-in {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  transition: right 0.5s ease;
  border-left: 1px solid var(--border);
  background-color: var(--body-bg);
}

.slide-in-open {
  right: 0;
}

.header {
  display: flex;
  align-items: center;
  padding: 4px;
  border-bottom: 1px solid var(--border);

  .title {
    flex: 1;
    font-weight: bold;
  }

  .icon-close {
    cursor: pointer;
  }
}

.main-panel {
  padding: 10px;
  overflow: auto;
}
</style>
