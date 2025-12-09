<script lang="ts" setup>
import { computed, onBeforeUnmount, watch, useTemplateRef } from 'vue';
import { useStore } from 'vuex';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';
import { isEqual } from 'lodash';
import { useRouter } from 'vue-router';

const HEADER_HEIGHT = 55;

const slideInPanelManager = useTemplateRef('SlideInPanelManager');
const slideInPanelManagerClose = useTemplateRef('SlideInPanelManagerClose');

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

const showHeader = computed(() => currentProps?.value?.showHeader ?? true);
const panelTitle = showHeader.value ? computed(() => currentProps?.value?.title || 'Details') : null;
const closeOnRouteChange = computed(() => {
  const propsCloseOnRouteChange = currentProps?.value.closeOnRouteChange;

  if (!propsCloseOnRouteChange) {
    return ['name', 'params', 'hash', 'query'];
  }

  return propsCloseOnRouteChange;
});
const router = useRouter();

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
        },
        // putting the initial focus on the first element that is not conditionally displayed
        initialFocus: slideInPanelManagerClose.value
      };

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(
        () => {
          if (currentProps?.value?.focusTrapWatcherBasedVariable) {
            return currentProps.value.focusTrapWatcherBasedVariable;
          }

          return isOpen?.value && !isClosing?.value;
        },
        slideInPanelManager.value as HTMLElement,
        opts,
        false
      );
    }
  }
);

watch(
  () => router?.currentRoute?.value,
  (newValue, oldValue) => {
    if (!isOpen?.value) {
      return;
    }

    if (closeOnRouteChange.value.includes('name') && !isEqual(newValue?.name, oldValue?.name)) {
      closePanel();
    }

    if (closeOnRouteChange.value.includes('params') && !isEqual(newValue?.params, oldValue?.params)) {
      closePanel();
    }

    if (closeOnRouteChange.value.includes('hash') && !isEqual(newValue?.hash, oldValue?.hash)) {
      closePanel();
    }

    if (closeOnRouteChange.value.includes('query') && !isEqual(newValue?.query, oldValue?.query)) {
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
      ref="SlideInPanelManager"
      @keydown.escape="closePanel"
    >
      <div
        v-show="isOpen"
        data-testid="slide-in-glass"
        class="slide-in-glass"
        :class="{ 'slide-in-glass-open': isOpen }"
        @click="closePanel"
      />
      <aside
        class="slide-in"
        :class="{ 'slide-in-open': isOpen }"
        :style="{
          width: panelWidth,
          right: panelRight,
          top: panelTop,
          height: panelHeight,
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
            ref="SlideInPanelManagerClose"
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
      </aside>
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
  z-index: z-index('slide-in');
}
.slide-in-glass-open {
  background: var(--overlay-bg);
  display: block;
}

.slide-in {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  transition: right 0.5s ease;
  border-left: 1px solid var(--border);
  background-color: var(--body-bg);
  z-index: calc(z-index('slide-in') + 1);
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
