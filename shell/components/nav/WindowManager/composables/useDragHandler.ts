import { useStore } from 'vuex';
import { Position, Tab } from '@shell/types/window-manager';
import { computed, ref } from 'vue';
import { CENTER } from '@shell/utils/position';

/**
 * This composable is responsible for handling the drag-and-drop behavior of tabs within the window manager.
 *
 * dragOverPositionsActive: A reactive reference indicating whether a drag operation is currently over the position areas.
 * pinArea: A reactive reference representing the current position area being hovered over during a drag operation.
 *
 * Both of these references are shared across all instances of this composable (used by Horizontal and Vertical Panels)
 * to maintain consistent drag-and-drop state.
 */

const dragOverPositionsActive = ref(false);
const pinArea = ref(CENTER as Position);

export default (props?: { position: Position }) => {
  const store = useStore();

  const lockedPositions = computed(() => (store.state.wm.lockedPositions || []) as Position[]);
  const lockedPosition = computed(() => props?.position ? lockedPositions.value.includes(props.position) : false);

  const pin = computed({
    get(): Position {
      return store.state.wm.userPin;
    },
    set(pin: Position) {
      if (pin !== CENTER) {
        store.commit('wm/setUserPin', pin);
      }
    },
  });

  const dragOverTabBarActive = ref(false);

  function onDragPositionStart(value: { event: DragEvent, tab: Tab }) {
    value.event.dataTransfer?.setData('application/json', JSON.stringify({
      position: value.tab.position,
      tabId:    value.tab.id
    }));
    dragOverPositionsActive.value = true;
    dragOverTabBarActive.value = true;
  }

  function onDragPositionOver(event: DragEvent, position: Position) {
    pinArea.value = position;
    if (position !== CENTER) {
      event.preventDefault();
    }
  }

  function onDragPositionEnd(value: { event: DragEvent, tab: Tab }) {
    pin.value = pinArea.value;
    if (pinArea.value !== CENTER) {
      store.commit('wm/switchTab', { tabId: value.tab.id, targetPosition: pinArea.value });
    }
    dragOverPositionsActive.value = false;
    pinArea.value = CENTER;
  }

  function onTabBarDragOver(event: DragEvent) {
    dragOverTabBarActive.value = true;
    event.preventDefault();
  }

  function onTabBarDragLeave() {
    dragOverTabBarActive.value = false;
  }

  function onTabBarDrop(event: DragEvent) {
    dragOverTabBarActive.value = false;
    const data = event.dataTransfer?.getData('application/json');

    if (data) {
      const { tabId } = JSON.parse(data);

      store.commit('wm/switchTab', { tabId, targetPosition: props?.position });
    } else {
      console.warn('No data found in drag event'); // eslint-disable-line no-console
    }
  }

  return {
    dragOverPositionsActive,
    dragOverTabBarActive,
    pinArea,
    pin,
    lockedPositions,
    lockedPosition,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onDragPositionStart,
    onDragPositionOver,
    onDragPositionEnd
  };
};
