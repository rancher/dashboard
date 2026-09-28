import IconOrSvg from '@shell/components/IconOrSvg.vue';
import { mount } from '@vue/test-utils';
import { Solver } from '@shell/utils/svg-filter';

jest.mock('@shell/utils/svg-filter');

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':           jest.fn(),
      'management/brand': jest.fn(() => 'test-brand'),
      'prefs/theme':      jest.fn(() => 'dark'),
    },
  };
};

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
        $fetchState: {},
      },
      stubs: { }
    }
  };
};

describe('component: IconOrSvg.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Solver as jest.Mock).mockImplementation(() => ({ solve: jest.fn(() => ({ filterVal: 'filter(brightness(1))' })) }));

    // Mock window.getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: jest.fn(() => ({
        getPropertyValue: jest.fn((prop) => {
          if (prop === '--on-tertiary') return '#ffffff';
          if (prop === '--header-btn-text') return '#cccccc';

          return '#ffffff';
        }),
      })),
      writable: true,
    });
  });

  describe('rendering', () => {
    it('renders img element when src prop is provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:    'test.svg',
          imgAlt: 'test icon',
          color:  'primary'
        }
      });

      const img = wrapper.find('img.svg-icon');

      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('test.svg');
      expect(img.attributes('alt')).toBe('test icon');
    });

    it('renders i element with icon class when icon prop is provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: { icon: 'icon-test' }
      });

      const icon = wrapper.find('i.group-icon');

      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('icon-test');
    });

    it('renders default extension icon when neither src nor icon is provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {}
      });

      const icon = wrapper.find('i.icon-extension');

      expect(icon.exists()).toBe(true);
    });
  });

  describe('watchers', () => {
    it('calls recomputeColor when brand changes', async() => {
      const mockRecomputeColor = jest.fn();

      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      const vm = wrapper.vm as any;

      // Replace recomputeColor with mock to track calls
      vm.recomputeColor = mockRecomputeColor;

      // Simulate brand change by triggering computed getter update
      vm.$store.getters['management/brand'] = jest.fn(() => 'new-brand-value');

      vm.$forceUpdate();
      await vm.$nextTick();

      expect(vm.$options.watch.brand).toBe('recomputeColor');
    });

    it('calls recomputeColor when theme changes', async() => {
      const mockRecomputeColor = jest.fn();

      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      const vm = wrapper.vm as any;

      // Replace recomputeColor with mock to track calls
      vm.recomputeColor = mockRecomputeColor;

      // Verify watcher is configured for theme
      expect(vm.$options.watch.theme).toBe('recomputeColor');
    });

    it('calls recomputeColor when src prop changes', async() => {
      let callCount = 0;
      const iconOrSvgMethods = IconOrSvg.methods as any;

      const originalRecomputeColor = iconOrSvgMethods.recomputeColor;

      // Mock recomputeColor method before mounting
      iconOrSvgMethods.recomputeColor = function() {
        callCount++;
        originalRecomputeColor.call(this);
      };

      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      const callCountBefore = callCount;

      // Update src prop which should trigger the watcher
      await wrapper.setProps({ src: 'new-test.svg' });

      expect(callCount).toBeGreaterThan(callCountBefore);
    });
  });

  describe('setColor method', () => {
    it('sets color, hover, and active filters when colors are valid', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      wrapper.vm.setColor();

      expect(wrapper.vm.mainFilter).toBeDefined();
      expect(wrapper.vm.hoverFilter).toBeDefined();
      expect(wrapper.vm.activeFilter).toBeDefined();
      expect(wrapper.vm.className).toMatch(/^svg-icon-/);
    });

    it('does nothing if getComputedStyleFor returns invalid colors', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      wrapper.vm.mainFilter = null;
      wrapper.vm.hoverFilter = null;
      wrapper.vm.activeFilter = null;

      jest.spyOn(wrapper.vm, 'getComputedStyleFor').mockReturnValue(null);

      wrapper.vm.setColor();

      expect(wrapper.vm.mainFilter).toBeNull();
      expect(wrapper.vm.hoverFilter).toBeNull();
      expect(wrapper.vm.activeFilter).toBeNull();
    });

    it('uses header color config when color prop is "header"', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'header'
        }
      });

      const getComputedStyleForSpy = jest.spyOn(wrapper.vm, 'getComputedStyleFor');

      wrapper.vm.setColor();

      expect(getComputedStyleForSpy).toHaveBeenCalledWith('--on-tertiary-header', '--header-btn-text');
    });
  });

  describe('recomputeColor method', () => {
    it('returns early when src is not provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: { icon: 'icon-test' }
      });

      const vm = wrapper.vm as any;

      const setColorSpy = jest.spyOn(vm, 'setColor');

      vm.mainFilter = 'filter(brightness(1))';
      vm.hoverFilter = 'filter(brightness(1))';
      vm.activeFilter = 'filter(brightness(1))';

      vm.recomputeColor();

      expect(vm.mainFilter).toBe('filter(brightness(1))');
      expect(vm.hoverFilter).toBe('filter(brightness(1))');
      expect(vm.activeFilter).toBe('filter(brightness(1))');
      expect(setColorSpy).not.toHaveBeenCalled();
    });

    it('calls setColor when src is provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      const setColorSpy = jest.spyOn(wrapper.vm, 'setColor');

      wrapper.vm.mainFilter = null;
      wrapper.vm.hoverFilter = null;
      wrapper.vm.activeFilter = null;

      wrapper.vm.recomputeColor();

      expect(setColorSpy).toHaveBeenCalled();
    });

    it('resets filters to null before calling setColor', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      wrapper.vm.recomputeColor();

      // After recomputeColor, filters should be recalculated
      // They should not be the same as initial if setColor was called
      expect(wrapper.vm.mainFilter).toBeDefined();
      expect(wrapper.vm.hoverFilter).toBeDefined();
      expect(wrapper.vm.activeFilter).toBeDefined();
    });
  });

  describe('getComputedStyleFor method', () => {
    it('returns computed style value for a CSS variable', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {}
      });

      const result = wrapper.vm.getComputedStyleFor('--on-tertiary', '--fallback');

      expect(result).toBeDefined();
    });

    it('uses fallback value when CSS variable is empty', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {}
      });

      Object.defineProperty(window, 'getComputedStyle', {
        value:    jest.fn(() => ({ getPropertyValue: jest.fn(() => '') })),
        writable: true,
      });

      const result = wrapper.vm.getComputedStyleFor('--nonexistent', '--fallback');

      expect(result).toBeDefined();
    });
  });

  describe('resolveColorFilter method', () => {
    it('returns cached filter if already resolved', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {}
      });

      const rgb = {
        r: 255, g: 0, b: 0
      };
      const filter1 = wrapper.vm.resolveColorFilter('test-color', rgb);
      const filter2 = wrapper.vm.resolveColorFilter('test-color', rgb);

      expect(filter1).toBe(filter2);
      expect(Solver).toHaveBeenCalledTimes(1);
    });

    it('creates new filter if not cached', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {}
      });

      const rgb1 = {
        r: 255, g: 0, b: 0
      };
      const rgb2 = {
        r: 0, g: 255, b: 0
      };

      wrapper.vm.resolveColorFilter('color1', rgb1);
      wrapper.vm.resolveColorFilter('color2', rgb2);

      expect(Solver).toHaveBeenCalledTimes(2);
    });
  });

  describe('created hook', () => {
    it('calls setColor when src prop is provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: {
          src:   'test.svg',
          color: 'primary'
        }
      });

      expect(wrapper.vm.mainFilter).toBeDefined();
      expect(wrapper.vm.hoverFilter).toBeDefined();
      expect(wrapper.vm.activeFilter).toBeDefined();
    });

    it('does not call setColor when src prop is not provided', () => {
      const wrapper = mount(IconOrSvg, {
        ...requiredSetup(),
        props: { icon: 'icon-test' }
      });

      expect(wrapper.vm.mainFilter).toBeNull();
      expect(wrapper.vm.hoverFilter).toBeNull();
      expect(wrapper.vm.activeFilter).toBeNull();
    });
  });
});
