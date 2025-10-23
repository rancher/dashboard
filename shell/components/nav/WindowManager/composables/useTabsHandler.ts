import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { Tab } from '@shell/types/window-manager';

const tabs = ref<{ tab: Tab, containerId: string }[]>([]);

/**
 * This composable is responsible for handling the tabs within the window manager.
 */
export default () => {
  const store = useStore();

  const activeTab = computed(() => store.state.wm.active);

  function onTabReady(arg: { tab: Tab, containerId: string }) {
    const existing = tabs.value.find((t) => t.tab.id === arg.tab.id);

    if (existing) {
      existing.containerId = arg.containerId;

      return;
    }

    tabs.value = [
      ...tabs.value,
      { tab: arg.tab, containerId: arg.containerId }
    ];
  }

  function setTabActive(args: { position: string, id: string }) {
    store.commit('wm/setActive', args);
  }

  function onTabClose(id: string) {
    tabs.value = tabs.value.filter(({ tab }) => tab.id !== id);
    store.commit('wm/closeTab', { id });
  }

  function onPanelClose(position: string) {
    tabs.value = tabs.value.filter(({ tab }) => tab.position !== position);
  }

  return {
    tabs,
    activeTab,
    setTabActive,
    onTabReady,
    onTabClose,
    onPanelClose,
  };
};
