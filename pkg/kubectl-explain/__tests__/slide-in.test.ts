import { explain, isExplainPanelOpen } from '@pkg/kubectl-explain/slide-in';
import Panel from '@pkg/kubectl-explain/components/SlideInPanel.vue';

const schema = { id: 'pod' };

const createStore = (getters: Record<string, unknown> = {}) => ({
  $shell:  { slideIn: { open: jest.fn() } },
  getters: {
    'cluster/schemaFor': jest.fn().mockReturnValue(schema),
    currentCluster:      { id: 'c-abc12' },
    ...getters,
  },
});

describe('kubectl-explain: slide-in', () => {
  describe('explain', () => {
    it('should open the panel in the shared slide-in for the resource on the page', () => {
      const store = createStore();

      explain(store, { params: { resource: 'pod' } });

      expect(store.getters['cluster/schemaFor']).toHaveBeenCalledWith('pod');
      expect(store.$shell.slideIn.open).toHaveBeenCalledWith(Panel, {
        props:               { schema, cluster: 'c-abc12' },
        width:               'wide',
        height:              'full',
        closeOnRouteChange:  ['name', 'params', 'query'],
        returnFocusSelector: '[data-testid="extension-header-action-kubectl-explain.action"]',
      });
    });

    it('should open without a schema when the page is not showing a resource', () => {
      const store = createStore();

      explain(store, { params: {} });

      expect(store.$shell.slideIn.open).toHaveBeenCalledWith(Panel, expect.objectContaining({ props: { schema: undefined, cluster: 'c-abc12' } }));
    });
  });

  describe('isExplainPanelOpen', () => {
    it.each([
      ['the panel is the open slide-in', true, Panel, true],
      ['the slide-in is closed', false, Panel, false],
      ['another panel is in the slide-in', true, { name: 'Other' }, false],
    ])('should report %s', (_, isOpen, component, expected) => {
      const store = createStore({ 'slideInPanel/isOpen': isOpen, 'slideInPanel/component': component });

      expect(isExplainPanelOpen(store)).toBe(expected);
    });
  });
});
