import { useStore } from 'vuex';
import { Position, Tab } from '../index.vue';
import { computed, ref } from 'vue';
import { CENTER } from '@shell/utils/position';

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
