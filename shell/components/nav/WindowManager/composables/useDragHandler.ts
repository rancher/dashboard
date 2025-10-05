import { useStore } from 'vuex';
import { Position, Tab } from '../index.vue';
import { computed, ref } from 'vue';
import { CENTER } from '@shell/utils/position';

const dragOverPositionsActive = ref(false);
const pinArea = ref(CENTER as Position);

export default (props?: { position: Position }) => {
  const store = useStore();

  const lockedPositions = computed(() => (store.state.wm.lockedPositions || []) as Position[]);

  const lockedPosition = computed(() => props?.position ? lockedPositions.value.includes(props?.position) : false);

  const pin = computed({
    get(): Position {
      return store.state.wm.userPin;
    },

    set(pin: Position) {
      if (pin === CENTER) {
        return;
      }
      store.commit('wm/setUserPin', pin);
    },
  });

  function onDragPositionStart(value: { event: DragEvent, tab: Tab }) {
    // Set dataTransfer for cross-panel drag
    value.event.dataTransfer?.setData('application/json', JSON.stringify({
      position: value.tab.position,
      tabId:    value.tab.id
    }));

    dragOverPositionsActive.value = true;
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

  const dragOverTabBarActive = ref(false);

  function onTabBarDragOver(e: DragEvent) {
    dragOverTabBarActive.value = true;
    e.preventDefault();
  }

  function onTabBarDragLeave(e: DragEvent) {
    dragOverTabBarActive.value = false;
  }

  function onTabBarDrop(e: DragEvent) {
    dragOverTabBarActive.value = false;
    const data = e.dataTransfer?.getData('application/json');

    if (data) {
      const { tabId } = JSON.parse(data);

      store.commit('wm/switchTab', { tabId, targetPosition: props?.position });
    } else {
      console.warn('No data found in drag event'); // eslint-disable-line no-console
    }
  }

  function onTabBarDragEnter(e: DragEvent) {
    dragOverTabBarActive.value = true;
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
    onTabBarDragEnter,
    onDragPositionStart,
    onDragPositionOver,
    onDragPositionEnd
  };
};
