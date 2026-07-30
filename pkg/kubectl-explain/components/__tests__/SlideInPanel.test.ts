import { shallowMount } from '@vue/test-utils';
import SlideInPanel from '@pkg/kubectl-explain/components/SlideInPanel.vue';

jest.mock('@shell/composables/focusTrap', () => ({ useWatcherBasedSetupFocusTrapWithDestroyIncluded: jest.fn() }));

jest.mock('@pkg/kubectl-explain/slide-in', () => ({ isExplainPanelOpen: { value: false } }));

jest.mock('@pkg/kubectl-explain/open-api-utils.ts', () => ({
  expandOpenAPIDefinition:  jest.fn(),
  getOpenAPISchemaName:     jest.fn(),
  makeOpenAPIBreadcrumb:    jest.fn(),
}));

const globalMocks = {
  mocks: { t: (key: string) => key },
  stubs: { ExplainPanel: { template: '<div />' } },
};

function mountPanel(dataOverrides: Record<string, unknown> = {}) {
  return shallowMount(SlideInPanel as any, {
    global: globalMocks,
    data() {
      return { ...dataOverrides };
    },
  });
}

describe('component: SlideInPanel', () => {
  describe('aside — dialog semantics', () => {
    it('has role="dialog"', () => {
      const wrapper = mountPanel();
      const aside = wrapper.find('[data-testid="slide-in-panel-resource-explain"]');

      expect(aside.attributes('role')).toBe('dialog');
    });

    it('has aria-modal="true"', () => {
      const wrapper = mountPanel();
      const aside = wrapper.find('[data-testid="slide-in-panel-resource-explain"]');

      expect(aside.attributes('aria-modal')).toBe('true');
    });

    it('has aria-hidden="true" when panel is closed', () => {
      const wrapper = mountPanel({ isOpen: false });
      const aside = wrapper.find('[data-testid="slide-in-panel-resource-explain"]');

      expect(aside.attributes('aria-hidden')).toBe('true');
    });

    it('has aria-hidden="false" when panel is open', () => {
      const wrapper = mountPanel({ isOpen: true });
      const aside = wrapper.find('[data-testid="slide-in-panel-resource-explain"]');

      expect(aside.attributes('aria-hidden')).toBe('false');
    });

    it('has aria-label from kubectl-explain.title key', () => {
      const wrapper = mountPanel();
      const aside = wrapper.find('[data-testid="slide-in-panel-resource-explain"]');

      expect(aside.attributes('aria-label')).toBe('kubectl-explain.title');
    });
  });

  describe('close button', () => {
    it('has aria-label from kubectl-explain.close key', () => {
      const wrapper = mountPanel();
      const closeBtn = wrapper.find('[data-testid="slide-in-panel-close-resource-explain"]');

      expect(closeBtn.attributes('aria-label')).toBe('kubectl-explain.close');
    });
  });

  describe('expand/collapse all button', () => {
    const withDefinition = {
      busy:       false,
      noResource: false,
      definition: { properties: {} },
    };

    it('shows aria-expanded="false" when expandAll is false', () => {
      const wrapper = mountPanel({ ...withDefinition, expandAll: false });
      const toggleBtn = wrapper.find('.icon-sort');

      expect(toggleBtn.attributes('aria-expanded')).toBe('false');
    });

    it('shows aria-expanded="true" when expandAll is true', () => {
      const wrapper = mountPanel({ ...withDefinition, expandAll: true });
      const toggleBtn = wrapper.find('.icon-sort');

      expect(toggleBtn.attributes('aria-expanded')).toBe('true');
    });

    it('uses kubectl-explain.expandAll key when not yet expanded', () => {
      const wrapper = mountPanel({ ...withDefinition, expandAll: false });
      const toggleBtn = wrapper.find('.icon-sort');

      expect(toggleBtn.attributes('aria-label')).toBe('kubectl-explain.expandAll');
    });

    it('uses kubectl-explain.collapseAll key when expanded', () => {
      const wrapper = mountPanel({ ...withDefinition, expandAll: true });
      const toggleBtn = wrapper.find('.icon-sort');

      expect(toggleBtn.attributes('aria-label')).toBe('kubectl-explain.collapseAll');
    });

    it('is not rendered while loading', () => {
      const wrapper = mountPanel({
        busy:       true,
        noResource: false,
        definition: { properties: {} }
      });

      expect(wrapper.find('.icon-sort').exists()).toBe(false);
    });
  });
});
