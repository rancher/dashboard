import { shallowMount } from '@vue/test-utils';
import ChartReadme from '@shell/components/ChartReadme.vue';

describe('chartReadme', () => {
  describe('standalone mode', () => {
    const mockRoute = {
      query: {
        versionInfo:          btoa(JSON.stringify({ appReadme: 'test app readme', readme: 'test readme' })),
        showAppReadme:        'true',
        hideReadmeFirstTitle: 'false',
        theme:                'dark',
      },
    };

    it('should apply theme to body and render with standalone class', () => {
      const wrapper = shallowMount(ChartReadme, { global: { mocks: { $route: mockRoute } } });

      // Check if theme is applied
      expect(document.body.classList.contains('theme-dark')).toBe(true);

      // Check for standalone class
      expect(wrapper.find('.wrapper.standalone').exists()).toBe(true);
    });

    it('should correctly parse props from URL', () => {
      const wrapper = shallowMount(ChartReadme, { global: { mocks: { $route: mockRoute } } });

      // Check if props are correctly interpreted from the route query
      expect(wrapper.vm.localShowAppReadme).toBe(true);
      expect(wrapper.vm.localHideReadmeFirstTitle).toBe(false);
      expect(wrapper.vm.localVersionInfo).toStrictEqual({ appReadme: 'test app readme', readme: 'test readme' });
    });
  });

  describe('embedded mode', () => {
    const versionInfo = { appReadme: 'embedded app readme', readme: 'embedded readme' };

    it('should render without standalone styles and use passed props', () => {
      const wrapper = shallowMount(ChartReadme, {
        props: {
          versionInfo,
          showAppReadme:        false,
          hideReadmeFirstTitle: true,
        },
        global: { mocks: { $route: { query: {} } } },
      });

      // Ensure standalone class is NOT applied
      expect(wrapper.find('.wrapper.standalone').exists()).toBe(false);

      // Ensure props are used directly
      expect(wrapper.vm.localShowAppReadme).toBe(false);
      expect(wrapper.vm.localHideReadmeFirstTitle).toBe(true);
      expect(wrapper.vm.localVersionInfo).toStrictEqual(versionInfo);
    });
  });
});
