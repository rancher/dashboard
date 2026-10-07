import { mount } from '@vue/test-utils';
import Tolerations from '@shell/components/form/Tolerations.vue';

const mockStore = { getters: { 'i18n/t': (key: string) => key } };

const createWrapper = (options: any = {}) => {
  return mount(Tolerations, {
    ...options,
    global: {
      ...options.global,
      mocks: {
        $store: mockStore,
        ...options.global?.mocks
      }
    }
  });
};

describe('component: Tolerations', () => {
  describe('rcCompatible', () => {
    it('should not render an RcSection when rcCompatible is false', () => {
      const wrapper = createWrapper({ propsData: { rcCompatible: false } });

      expect(wrapper.findComponent({ name: 'RcSection' }).exists()).toBe(false);
    });

    it('should render the fields inside an RcSection with the default title, type and background when rcCompatible is true', () => {
      const wrapper = createWrapper({ propsData: { rcCompatible: true } });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.exists()).toBe(true);
      expect(section.props('title')).toBe('workload.scheduling.titles.tolerations');
      expect(section.props('type')).toBe('primary');
      expect(section.props('background')).toBe('secondary');
    });

    it('should use a caller-provided title over the default when rcCompatible is true', () => {
      const wrapper = createWrapper({ propsData: { rcCompatible: true, title: 'Custom Title' } });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('title')).toBe('Custom Title');
    });

    it('should use caller-provided sectionType and sectionBackground over the defaults when rcCompatible is true', () => {
      const wrapper = createWrapper({
        propsData: {
          rcCompatible: true, sectionType: 'secondary', sectionBackground: 'primary'
        }
      });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('type')).toBe('secondary');
      expect(section.props('background')).toBe('primary');
    });

    it('should render caller-provided banner slot content when rcCompatible is true', () => {
      const wrapper = createWrapper({
        propsData: { rcCompatible: true },
        slots:     { banner: '<div class="custom-banner">Custom banner</div>' }
      });

      expect(wrapper.find('.custom-banner').exists()).toBe(true);
    });

    it('should still render existing tolerations and the add button inside the RcSection', () => {
      const wrapper = createWrapper({
        propsData: {
          rcCompatible: true,
          value:        [{
            key: 'foo', operator: 'Equal', value: 'bar', effect: 'NoSchedule'
          }]
        }
      });

      expect(wrapper.find('[data-testid="toleration-key-index0"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="add-toleration-btn"]').exists()).toBe(true);
    });
  });

  describe('rules initialization', () => {
    it('should default a missing effect to an empty string', () => {
      const wrapper = createWrapper({ propsData: { value: [{ key: 'foo' }] } });

      expect(wrapper.vm.rules).toStrictEqual([{ key: 'foo', effect: '' }]);
    });

    it('should leave an existing effect untouched', () => {
      const wrapper = createWrapper({ propsData: { value: [{ key: 'foo', effect: 'NoExecute' }] } });

      expect(wrapper.vm.rules).toStrictEqual([{ key: 'foo', effect: 'NoExecute' }]);
    });
  });

  describe('toleration management', () => {
    it('should add a new toleration when addToleration is called', async() => {
      const wrapper = createWrapper({ propsData: { value: [] } });

      await wrapper.find('[data-testid="add-toleration-btn"]').trigger('click');

      expect(wrapper.vm.rules).toHaveLength(1);
    });

    it('should remove a toleration and emit the updated list', async() => {
      const wrapper = createWrapper({ propsData: { value: [{ key: 'foo', effect: '' }] } });

      await wrapper.find('[data-testid="toleration-remove-index0"]').trigger('click');

      expect(wrapper.vm.rules).toStrictEqual([]);
      expect(wrapper.emitted('update:value')).toStrictEqual([[[]]]);
    });
  });
});
