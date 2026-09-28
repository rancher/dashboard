import { shallowMount } from '@vue/test-utils';
import ExplainPanel from '@pkg/kubectl-explain/components/ExplainPanel.vue';

const globalMocks = {
  mocks: { t: (key: string) => key },
  stubs: { Markdown: { template: '<div />' } },
};

const definitionWithRef = {
  description: 'A pod spec.',
  properties:  {
    containers: {
      type:          'array',
      $refName:      'io.k8s.api.core.v1.Container',
      $refNameShort: 'Container',
      $breadcrumbs:  [],
      $$ref:         { properties: {} },
    },
  },
};

describe('component: ExplainPanel', () => {
  describe('field expander — aria-expanded', () => {
    it('has aria-expanded="false" before the field is expanded', () => {
      const wrapper = shallowMount(ExplainPanel as any, {
        props:  { definition: definitionWithRef, expandAll: false },
        global: globalMocks,
      });
      const expander = wrapper.find('.field-expander');

      expect(expander.attributes('aria-expanded')).toBe('false');
    });

    it('has aria-expanded="true" after the field is expanded via click', async() => {
      const wrapper = shallowMount(ExplainPanel as any, {
        props:  { definition: definitionWithRef, expandAll: false },
        global: globalMocks,
      });
      const expander = wrapper.find('.field-expander');

      await expander.trigger('click');

      expect(expander.attributes('aria-expanded')).toBe('true');
    });

    it('has aria-expanded="true" when expandAll prop is true', async() => {
      const wrapper = shallowMount(ExplainPanel as any, {
        props:  { definition: definitionWithRef, expandAll: true },
        global: globalMocks,
      });

      await wrapper.vm.$nextTick();

      const expander = wrapper.find('.field-expander');

      expect(expander.attributes('aria-expanded')).toBe('true');
    });

    it('has aria-expanded="false" when expandAll is toggled back to false', async() => {
      const wrapper = shallowMount(ExplainPanel as any, {
        props:  { definition: definitionWithRef, expandAll: true },
        global: globalMocks,
      });

      await wrapper.vm.$nextTick();
      await wrapper.setProps({ expandAll: false });

      const expander = wrapper.find('.field-expander');

      expect(expander.attributes('aria-expanded')).toBe('false');
    });
  });
});
