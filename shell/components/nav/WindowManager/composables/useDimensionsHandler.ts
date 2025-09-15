import { computed } from 'vue';
import { useStore } from 'vuex';
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';
import { Position } from '../index.vue';

export default (props: { position: Position }) => {
  const store = useStore();

  const panelHeight = computed(() => store.state.wm.panelHeight);
  const panelWidth = computed(() => store.state.wm.panelWidth);

  const height = computed({
    get() {
      if (panelHeight.value[props.position]) {
        return panelHeight.value[props.position];
      }

      const windowHeight = window.innerHeight;

      const wmHeight = window.localStorage.getItem('wm-height');
      let height = wmHeight ? parseInt(wmHeight, 10) : 0;

      if ( !height ) {
        height = Math.round(windowHeight / 2);
      }
      height = Math.min(height, 3 * windowHeight / 4);

      window.localStorage.setItem('wm-height', `${ height }`);
      store.commit('wm/setPanelHeight', { position: props.position, height });

      return height;
    },

    set(val) {
      store.commit('wm/setPanelHeight', { position: props.position, height: val });
      window.localStorage.setItem('wm-height', val);
      setDimensions();

      return val;
    },
  });

  const width = computed({
    get() {
      if (panelWidth.value[props.position]) {
        return panelWidth.value[props.position];
      }

      const windowWidth = window.innerWidth;
      const wmWidth = window.localStorage.getItem(props.position === LEFT ? 'wm-vl-width' : 'wm-vr-width');
      let width = wmWidth ? parseInt(wmWidth, 10) : 0;

      if (!width) {
        width = Math.round(windowWidth / 8);
      }
      width = Math.min(width, 3 * windowWidth / 4);

      window.localStorage.setItem(props.position === LEFT ? 'wm-vl-width' : 'wm-vr-width', `${ width }`);
      store.commit('wm/setPanelWidth', { position: props.position, width });

      return width;
    },
    set(val) {
      store.commit('wm/setPanelWidth', { position: props.position, width: val });
      window.localStorage.setItem(props.position === LEFT ? 'wm-vl-width' : 'wm-vr-width', val);
      setDimensions();

      return val;
    }
  });

  function setDimensions(forceValue: string | number = 0) {
    switch (props.position) {
    case RIGHT:
      document.documentElement.style.setProperty('--wm-vr-width', `${ forceValue || width.value }px`);
      break;
    case LEFT:
      document.documentElement.style.setProperty('--wm-vl-width', `${ forceValue || width.value }px`);
      break;
    default:
      document.documentElement.style.setProperty('--wm-height', `${ forceValue || height.value }px`);
      break;
    }
  }

  function closePanel() {
    switch (props.position) {
    case BOTTOM:
      document.documentElement.style.setProperty('--wm-height', '0px');
      store.commit('wm/setPanelHeight', { position: BOTTOM, height: null });
      break;
    case LEFT:
      document.documentElement.style.setProperty('--wm-vl-width', '0px');
      store.commit('wm/setPanelWidth', { position: LEFT, width: null });
      break;
    case RIGHT:
      document.documentElement.style.setProperty('--wm-vr-width', '0px');
      store.commit('wm/setPanelWidth', { position: RIGHT, width: null });
      break;
    default:
      break;
    }
  }

  return {
    width, height, setDimensions, closePanel,
  };
};
