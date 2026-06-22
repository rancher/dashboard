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

const WIDTH_MAP = {
  default: '33%',
  wide:    '73%'
};

const HEIGHT_FULL = 'full';

const slideInPanelManager = useTemplateRef('SlideInPanelManager');
const slideInPanelManagerClose = useTemplateRef('SlideInPanelManagerClose');

const store = useStore();
const isOpen = computed(() => store.getters['slideInPanel/isOpen']);
const isClosing = computed(() => store.getters['slideInPanel/isClosing']);
const currentComponent = computed(() => store.getters['slideInPanel/component']);
const currentProps = computed(() => store.getters['slideInPanel/componentProps']);

const resolvedHeightMode = computed(() => {
  if (currentProps.value?.panelHeight) {
    return currentProps.value.panelHeight;
  }

  // Deprecated: infer from raw height/top values
  if (currentProps.value?.height === '100vh' || currentProps.value?.top === '0') {
    return 'full';
  }

  return 'default';
});

const isFullHeight = computed(() => resolvedHeightMode.value === HEIGHT_FULL);

const defaultTop = computed(() => {
  const banner = document.getElementById('banner-header');
  let height = HEADER_HEIGHT;

  if (banner) {
    height += banner.clientHeight;
  }

  return `${ height }px`;
});

const panelTop = computed(() => {
  if (isFullHeight.value) {
    return '0';
  }

  // Deprecated: explicit top value
  if (currentProps.value?.top) {
    return currentProps.value.top;
  }

  return defaultTop.value;
});

const panelHeight = computed(() => {
  if (isFullHeight.value) {
    return '100vh';
  }

  // Deprecated: explicit height value
  if (currentProps.value?.height) {
    return currentProps.value.height;
  }

  return `calc(100vh - ${ panelTop.value })`;
});

const panelWidth = computed(() => {
  if (currentProps.value?.panelWidth) {
    return WIDTH_MAP[currentProps.value.panelWidth] || WIDTH_MAP.default;
  }

  // Deprecated: raw CSS width string
  return currentProps.value?.width || WIDTH_MAP.default;
});

const panelRight = computed(() => (isOpen.value ? '0' : `-${ panelWidth.value }`));

const glassZIndex = computed(() => (isFullHeight.value ? 101 : undefined));
const panelZIndex = computed(() => (isFullHeight.value ? 102 : undefined));

const showHeader = computed(() => {
  // Deprecated: explicit showHeader takes precedence for backwards compat
  if (currentProps.value?.showHeader !== undefined) {
    return currentProps.value.showHeader;
  }

  return !!currentProps.value?.title;
});

const panelTitle = computed(() => currentProps.value?.title || '');

const closeOnRouteChange = computed(() => {
  const propsCloseOnRouteChange = currentProps.value?.closeOnRouteChange;

  if (!propsCloseOnRouteChange) {
    return ['name', 'params', 'hash', 'query'];
  }

  return propsCloseOnRouteChange;
});

const router = useRouter();

watch(
  /**
   * Focus trap logic
   */
  () => isOpen.value,
  (neu, old) => {
    if (neu && neu !== old) {
      if (currentProps.value?.disableFocusTrap) {
        return;
      }

      const panelEl = slideInPanelManager.value as HTMLElement;
      const closeEl = slideInPanelManagerClose.value;

      const opts: any = {
        ...DEFAULT_FOCUS_TRAP_OPTS,
        initialFocus:  closeEl || panelEl,
        fallbackFocus: panelEl
      };

      const returnFocusSelector = currentProps.value?.returnFocusSelector;

      if (returnFocusSelector) {
        opts.setReturnFocus = () => {
          if (returnFocusSelector && !document.querySelector(returnFocusSelector)) {
            console.warn('SlideInPanelManager: cannot find elem with "returnFocusSelector", returning focus to main view'); // eslint-disable-line no-console

            return '.dashboard-root';
          }

          return returnFocusSelector || '.dashboard-root';
        };
      }

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(
        () => {
          if (currentProps.value?.focusTrapWatcherBasedVariable) {
            return currentProps.value.focusTrapWatcherBasedVariable;
          }

          return isOpen.value && !isClosing.value;
        },
        panelEl,
        opts,
        false
      );
    }
  }
);

watch(
  () => router?.currentRoute?.value,
  (newValue, oldValue) => {
    if (!isOpen.value) {
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
      tabindex="-1"
      @keydown.escape="closePanel"
    >
      <div
        v-show="isOpen"
        data-testid="slide-in-glass"
        class="slide-in-glass"
        :class="{ 'slide-in-glass-open': isOpen }"
        :style="{ zIndex: glassZIndex }"
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
          zIndex: panelZIndex,
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
            role="button"
            :aria-label="'Close'"
            :tabindex="isOpen ? 0 : -1"
            @click="closePanel"
            @keypress.enter="closePanel"
            @keyup.space="closePanel"
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
  padding: 4px 10px;
  border-bottom: 1px solid var(--border);

  .title {
    flex: 1;
    font-weight: bold;
  }

  .icon-close {
    padding: 8px;
    border-radius: 4px;
    opacity: 0.7;
    cursor: pointer;

    &:hover {
      background-color: var(--primary);
      color: var(--primary-text);
      opacity: 1;
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }
}

.main-panel {
  flex: 1;
  padding: 10px;
  overflow: auto;
}
</style>
