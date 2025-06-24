import { Component } from 'vue';
import { useStore } from 'vuex';

export const useDrawer = () => {
  const store = useStore();

  const open = (component: Component, returnFocusSelector: string, options?: Record<string, any>) => {
    store.commit('slideInPanel/open', {
      component,
      componentProps: {
        ...(options || {}),
        triggerFocusTrap: true,
        returnFocusSelector
      }
    });
  };

  const close = () => {
    store.commit('slideInPanel/close');
  };

  return {
    open,
    close
  };
};
