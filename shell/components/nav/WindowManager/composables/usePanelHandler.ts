import { computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
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
