import { computed } from 'vue';
import debounce from 'lodash/debounce';
import { useStore } from 'vuex';
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';
import { Position } from '@shell/types/window-manager';
import { CSS_KEY } from '../constants';

/**
 * This composable is responsible for handling the dimensions of the window manager panels.
 */
export default (props: { position: Position }) => {
  const store = useStore();

  const height = computed({
    get() {
      const panelHeight = store.state.wm.panelHeight[props.position];

      if (panelHeight) {
        return panelHeight;
      }

      const windowHeight = window.innerHeight;
      let height = panelHeight ? parseInt(panelHeight, 10) : 0;

      if ( !height ) {
        height = Math.round(windowHeight / 2);
      }
      height = Math.min(height, 3 * windowHeight / 4);

      setDimensions({ height });

      return height;
    },

    set(height) {
      setDimensions({ height });
    },
  });

  const width = computed({
    get() {
      const panelWidth = store.state.wm.panelWidth[props.position];

      if (panelWidth) {
        return panelWidth;
      }

      const windowWidth = window.innerWidth;
      let width = panelWidth ? parseInt(panelWidth, 10) : 0;

      if (!width) {
        width = Math.round(windowWidth / 8);
      }
      width = Math.min(width, 3 * windowWidth / 4);

      setDimensions({ width });

      return width;
    },
    set(width) {
      setDimensions({ width });
    }
  });

  function openPanel(position: Position) {
    setCssVariable(position, position === BOTTOM ? height.value : width.value);
  }

  function closePanel(position: Position) {
    setCssVariable(position, 0);
  }

  function setDimensions(args: { width?: number, height?: number } = {}) {
    const h = Number(args.height || height.value) || 0;
    const w = Number(args.width || width.value) || 0;

    switch (props.position) {
    case RIGHT:
    case LEFT:
      setCssVariable(props.position, w);
      debouncedSetPanelWidth(props.position, w);
      break;
    case BOTTOM:
      setCssVariable(BOTTOM, h);
      debouncedSetPanelHeight(props.position, h);
      break;
    }
  }

  const debouncedSetPanelWidth = debounce((position, width) => {
    store.commit('wm/setPanelWidth', { position, width });
  }, 250);

  const debouncedSetPanelHeight = debounce((position, height) => {
    store.commit('wm/setPanelHeight', { position, height });
  }, 250);

  function setCssVariable(position: Position, value: number) {
    document.documentElement.style.setProperty(CSS_KEY[position as keyof typeof CSS_KEY], `${ value }px`);
  }

  return {
    width, height, setDimensions, openPanel, closePanel,
  };
};
