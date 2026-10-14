<script lang="ts" setup>
import {
  computed, onBeforeUnmount, onMounted, watch, useTemplateRef
} from 'vue';
import { useStore } from 'vuex';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';
import { isEqual } from 'lodash';
import { useRouter } from 'vue-router';
import { RcDrawer } from '@components/RcDrawer';

const HEADER_HEIGHT = 55;

const WIDTH_MAP = {
  default: '33%',
  wide:    '73%'
};

const HEIGHT_FULL = 'full';

const CLOSE_SELECTOR = '[data-testid="rc-drawer-close"]';

const slideInPanelManager = useTemplateRef('SlideInPanelManager');

const store = useStore();
const isOpen = computed(() => store.getters['slideInPanel/isOpen']);
const isClosing = computed(() => store.getters['slideInPanel/isClosing']);
const currentComponent = computed(() => store.getters['slideInPanel/component']);
const currentProps = computed(() => store.getters['slideInPanel/componentProps']);
const openCount = computed(() => store.getters['slideInPanel/openCount']);
const panelProps = computed(() => ({ onClose: closePanel, ...currentProps.value }));

const resolvedHeightMode = computed(() => {
  if (currentProps.value?.height) {
    return currentProps.value.height;
  }

  // Deprecated: infer from raw top value
  if (currentProps.value?.top === '0') {
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

  return `calc(100vh - ${ panelTop.value })`;
});

const panelWidth = computed(() => {
  const width = currentProps.value?.width as keyof typeof WIDTH_MAP | undefined;

  return (width && WIDTH_MAP[width]) || WIDTH_MAP.default;
});

const panelRight = computed(() => (isOpen.value ? '0' : `-${ panelWidth.value }`));

const showHeader = computed(() => {
  // Deprecated: explicit showHeader takes precedence for backwards compat
  if (currentProps.value?.showHeader !== undefined) {
    return currentProps.value.showHeader;
  }

  return !!currentProps.value?.title;
});

const panelTitle = computed(() => currentProps.value?.title || (showHeader.value ? 'Details' : ''));

const isPanelInert = computed(() => (isOpen.value ? undefined : true));

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

      const opts: any = {
        ...DEFAULT_FOCUS_TRAP_OPTS,
        initialFocus:  () => panelEl.querySelector(CLOSE_SELECTOR) || panelEl,
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

onMounted(() => document.addEventListener('keydown', closeOnEscape));

onBeforeUnmount(() => {
  document.removeEventListener('keydown', closeOnEscape);
  closePanel();
});

function closePanel() {
  store.commit('slideInPanel/close');
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !isOpen.value) {
    return;
  }

  const target = event.target as Node;

  if (target === document.body || slideInPanelManager.value?.contains(target)) {
    closePanel();
  }
}
</script>

<template>
  <Teleport to="#slides">
    <div
      id="slide-in-panel-manager"
      ref="SlideInPanelManager"
      tabindex="-1"
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
        :aria-hidden="!isOpen"
        :inert="isPanelInert"
        :aria-label="panelTitle || undefined"
        :style="{
          width: panelWidth,
          right: panelRight,
          top: panelTop,
          height: panelHeight,
        }"
      >
        <RcDrawer
          v-if="showHeader"
          :title="panelTitle"
          @close="closePanel"
        >
          <component
            :is="currentComponent"
            v-if="isOpen || currentComponent"
            :key="openCount"
            v-bind="panelProps"
            data-testid="slide-in-panel-component"
            class="dynamic-panel-content"
          />
        </RcDrawer>
        <div
          v-else
          class="main-panel"
        >
          <component
            :is="currentComponent"
            v-if="isOpen || currentComponent"
            :key="openCount"
            v-bind="panelProps"
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

.main-panel {
  flex: 1;
  padding: 10px;
  overflow: auto;
}
</style>
