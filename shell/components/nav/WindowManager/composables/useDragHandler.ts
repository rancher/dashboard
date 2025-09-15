import { useStore } from 'vuex';
import { Position, Tab } from '../index.vue';
import { computed, ref } from 'vue';
import { CENTER } from '@shell/utils/position';

const dragOverPositionsActive = ref(false);
const zone = ref(CENTER as Position);

export default (props?: { position: Position }) => {
  const store = useStore();

  const pin = computed({
    get(): Position {
      return store.state.wm.userPin;
    },

    set(pin: Position) {
      if (pin === CENTER) {
        return;
      }
      window.localStorage.setItem('wm-pin', pin as string);
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
    zone.value = position;

    if (position !== CENTER) {
      event.preventDefault();
    }
  }

  function onDragPositionEnd(value: { event: DragEvent, tab: Tab }) {
    pin.value = zone.value;

    if (zone.value !== CENTER) {
      store.commit('wm/switchTab', { tabId: value.tab.id, targetPosition: zone.value });
    }

    dragOverPositionsActive.value = false;
    zone.value = CENTER;
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
    zone,
    pin,
    onTabBarDragOver,
    onTabBarDragLeave,
    onTabBarDrop,
    onTabBarDragEnter,
    onDragPositionStart,
    onDragPositionOver,
    onDragPositionEnd
  };
};
