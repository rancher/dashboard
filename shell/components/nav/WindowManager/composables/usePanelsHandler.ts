import { computed } from 'vue';
import { useStore } from 'vuex';
import { Layout, Position, Tab } from '@shell/types/window-manager';

export default (props?: { positions: Position[], layout: Layout }) => {
  const store = useStore();

  const isPanelEnabled = computed(() => (props?.positions || []).reduce((acc, pos) => ({
    ...acc,
    [pos]: store.state.wm.open[pos] && !store.state.wm.tabs.find((t: Tab) => !t.layouts.includes(props?.layout || Layout.default) && t.position === pos),
  }), {} as Record<Position, boolean>));

  return { isPanelEnabled };
};
