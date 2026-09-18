import {
  computed, nextTick, onMounted, onBeforeUnmount, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { Position, Tab } from '@shell/types/window-manager';
import useResizeHandler from '../composables/useResizeHandler';
import useDimensionsHandler from '../composables/useDimensionsHandler';
import useDragHandler from '../composables/useDragHandler';
import useTabsHandler from '../composables/useTabsHandler';

/**
 * This composable is responsible for managing the state and behavior of the window manager panel.
 */
export default (props: { position: Position }) => {
  const store = useStore();

  const tabs = computed(() => store.getters['wm/tabs'].filter((t: Tab) => t.position === props.position));

  const isTabsHeaderEnabled = computed(() => tabs.value.every((t: Tab) => t.showHeader));

  const {
    activeTab, setTabActive, onTabReady, onTabClose, onPanelClose
  } = useTabsHandler();

  const {
    height, width, setDimensions, openPanel, closePanel
  } = useDimensionsHandler({ position: props.position });

  const {
    mouseResizeYStart, keyboardResizeY, mouseResizeXStart, keyboardResizeX
  } = useResizeHandler({ position: props.position, setDimensions });

  const {
    dragOverPositionsActive,
    dragOverTabBarActive,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onDragPositionStart,
    onDragPositionEnd,
    lockedPosition
  } = useDragHandler({ position: props.position });

  const activePanelTab = computed<Tab | undefined>(() => tabs.value.find((t: Tab) => t.id === activeTab.value[props.position]));

  const closeOverlayStyle = ref<Record<string, string> | undefined>(undefined);
  const closeOverlayDetached = ref(false);

  let closeButton: HTMLElement | null = null;
  let closeOverlayObserver: ResizeObserver | null = null;

  function visibleCloserRect(listRect: DOMRect, closer: Element) {
    const tabRect = closer.closest('.tab')?.getBoundingClientRect();
    const rect = closer.getBoundingClientRect();
    const visible = !!tabRect &&
      rect.left >= Math.max(listRect.left, tabRect.left) - 1 &&
      rect.right <= Math.min(listRect.right, tabRect.right) + 1;

    return visible ? rect : null;
  }

  function measureCloseOverlay() {
    const tabBar = closeButton?.closest('.tabs');
    const tabList = tabBar?.querySelector('.tab-list');

    if (!tabBar || !tabList) {
      closeOverlayStyle.value = undefined;

      return;
    }

    const barRect = tabBar.getBoundingClientRect();
    const listRect = tabList.getBoundingClientRect();
    const closer = tabBar.querySelector('.tab.active .closer');
    const rect = closer ? visibleCloserRect(listRect, closer) : null;
    const size = barRect.height;
    const box = rect || {
      left: listRect.right - size, top: barRect.top, width: size, height: size
    };

    closeOverlayDetached.value = !rect;
    closeOverlayStyle.value = {
      left:      `${ box.left - barRect.left - tabBar.clientLeft }px`,
      top:       `${ box.top - barRect.top - tabBar.clientTop }px`,
      width:     `${ box.width }px`,
      height:    `${ box.height }px`,
      minHeight: `${ box.height }px`,
    };
  }

  function stopWatchingCloseOverlay() {
    closeOverlayObserver?.disconnect();
    closeOverlayObserver = null;
    window.removeEventListener('resize', measureCloseOverlay);
  }

  function onCloseActiveTabFocus(event: FocusEvent) {
    stopWatchingCloseOverlay();
    closeButton = event.currentTarget as HTMLElement;

    const tabBar = closeButton.closest('.tabs');
    const tabList = tabBar?.querySelector('.tab-list');

    measureCloseOverlay();

    closeOverlayObserver = new ResizeObserver(() => measureCloseOverlay());

    if (tabBar) {
      closeOverlayObserver.observe(tabBar);
    }
    if (tabList) {
      closeOverlayObserver.observe(tabList);
    }
    window.addEventListener('resize', measureCloseOverlay);
  }

  function onCloseActiveTabBlur() {
    closeButton = null;
    closeOverlayDetached.value = false;
    closeOverlayStyle.value = undefined;
    stopWatchingCloseOverlay();
  }

  watch([tabs, activePanelTab], () => {
    if (closeButton) {
      nextTick(measureCloseOverlay);
    }
  });

  function focusActiveTab(source: EventTarget | null) {
    const tabBar = (source as HTMLElement | null)?.closest('.tabs');

    nextTick(() => tabBar?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus());
  }

  function closeActiveTab(event: Event) {
    const id = activePanelTab.value?.id;

    if (id) {
      onTabClose(id);
      focusActiveTab(event.currentTarget);
    }
  }

  function onTabKeydown(event: KeyboardEvent, id: string) {
    if (event.key !== 'Delete' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    event.preventDefault();

    onTabClose(id);
    focusActiveTab(event.currentTarget);
  }

  onMounted(() => openPanel(props.position));

  onBeforeUnmount(() => {
    onCloseActiveTabBlur();
    closePanel(props.position);
    onPanelClose(props.position);
  });

  return {
    tabs,
    activeTab,
    activePanelTab,
    isTabsHeaderEnabled,
    height,
    width,
    dragOverPositionsActive,
    dragOverTabBarActive,
    setTabActive,
    onTabReady,
    onTabClose,
    closeActiveTab,
    closeOverlayStyle,
    closeOverlayDetached,
    onCloseActiveTabFocus,
    onCloseActiveTabBlur,
    onTabKeydown,
    onPanelClose,
    mouseResizeXStart,
    mouseResizeYStart,
    keyboardResizeX,
    keyboardResizeY,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onDragPositionStart,
    onDragPositionEnd,
    lockedPosition
  };
};
