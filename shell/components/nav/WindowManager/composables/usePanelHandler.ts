import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { Position, Tab } from '../index.vue';
import useResizeHandler from '../composables/useResizeHandler';
import useDimensionsHandler from '../composables/useDimensionsHandler';
import useDragHandler from '../composables/useDragHandler';
import useTabsHandler from '../composables/useTabsHandler';

export default (props: { position: Position }) => {
  const store = useStore();

  const tabs = computed(() => store.getters['wm/tabs'].filter((t: Tab) => t.position === props.position));

  const isTabsHeaderEnabled = computed(() => tabs.value.every((t: Tab) => t.showHeader));

  const {
    activeTab, setTabActive, onTabReady, onTabClose, onPanelClose
  } = useTabsHandler();

  const {
    height, width, setDimensions, closePanel
  } = useDimensionsHandler({ position: props.position });

  const {
    mouseResizeYStart, keyboardResizeY, mouseResizeXStart, keyboardResizeX
  } = useResizeHandler({
    position: props.position, height, width, setDimensions
  });

  const {
    dragOverPositionsActive,
    dragOverTabBarActive,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onTabBarDragEnter,
    onDragPositionStart,
    onDragPositionEnd
  } = useDragHandler({ position: props.position });

  onMounted(setDimensions);

  onBeforeUnmount(() => {
    closePanel();
    onPanelClose(props.position);
  });

  return {
    tabs,
    activeTab,
    isTabsHeaderEnabled,
    height,
    width,
    dragOverPositionsActive,
    dragOverTabBarActive,
    setTabActive,
    onTabReady,
    onTabClose,
    onPanelClose,
    mouseResizeXStart,
    mouseResizeYStart,
    keyboardResizeX,
    keyboardResizeY,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onTabBarDragEnter,
    onDragPositionStart,
    onDragPositionEnd
  };
};
