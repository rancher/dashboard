import { mount, flushPromises } from '@vue/test-utils';
import SlideInPanel from '@pkg/kubectl-explain/components/SlideInPanel.vue';
import { getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '@pkg/kubectl-explain/open-api-utils';
import { openAPI } from '@pkg/kubectl-explain/open-api';

jest.mock('@pkg/kubectl-explain/open-api', () => ({ openAPI: { get: jest.fn() } }));

jest.mock('@pkg/kubectl-explain/open-api-utils.ts', () => ({
  expandOpenAPIDefinition: jest.fn(),
  getOpenAPISchemaName:    jest.fn(),
  makeOpenAPIBreadcrumb:   jest.fn(),
}));

const NAME = 'io.k8s.api.core.v1.Pod';

const openApiData = { definitions: { [NAME]: { description: 'A pod.', properties: {} } } };

const pending = () => new Promise(() => {});

function mountPanel({
  props = { schema: { id: 'pod' }, cluster: 'local' } as Record<string, unknown>,
  get = () => Promise.resolve(openApiData) as Promise<unknown>,
  data = {} as Record<string, unknown>,
} = {}) {
  const store = { dispatch: jest.fn() };

  (openAPI.get as jest.Mock).mockImplementation(get);

  const wrapper = mount(SlideInPanel as any, {
    props,
    data() {
      return { ...data };
    },
    global: {
      provide: { store },
      mocks:   { $store: store, t: (key: string) => key },
      stubs:   { ExplainPanel: { template: '<div class="explain-panel-stub" />' } },
    },
  });

  return { wrapper, store };
}

describe('component: SlideInPanel', () => {
  beforeEach(() => {
    (getOpenAPISchemaName as jest.Mock).mockReturnValue(NAME);
    (makeOpenAPIBreadcrumb as jest.Mock).mockImplementation((id: string) => ({ id, name: 'Pod' }));
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('drawer', () => {
    it('renders in the standard drawer, named from the kubectl-explain.title key', () => {
      const { wrapper } = mountPanel();

      expect(wrapper.attributes('role')).toBe('dialog');
      expect(wrapper.attributes('aria-label')).toBe('kubectl-explain.title');
    });

    it('has no footer, since it has no actions', () => {
      const { wrapper } = mountPanel();

      expect(wrapper.find('[data-testid="rc-drawer-footer"]').exists()).toBe(false);
    });

    it('emits close when the drawer is closed', async() => {
      const { wrapper } = mountPanel();

      await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('loading the definition', () => {
    it('fetches the OpenAPI data for the cluster it was opened for', () => {
      const { store } = mountPanel({ props: { schema: { id: 'pod' }, cluster: 'c-abc12' } });

      expect(openAPI.get).toHaveBeenCalledWith('c-abc12', store.dispatch);
    });

    it('shows a spinner until the data arrives', () => {
      const { wrapper } = mountPanel({ get: pending });

      expect(wrapper.find('.icon-spinner').exists()).toBe(true);
      expect(wrapper.find('.explain-panel-stub').exists()).toBe(false);
    });

    it('shows the definition once the data arrives', async() => {
      const { wrapper } = mountPanel();

      await flushPromises();

      expect(wrapper.find('.icon-spinner').exists()).toBe(false);
      expect(wrapper.find('.explain-panel-stub').exists()).toBe(true);
      expect(wrapper.find('.breadcrumbs').text()).toBe('Pod');
    });

    it('scrolls back to the top once the definition is shown', async() => {
      jest.useFakeTimers();
      mountPanel();

      await flushPromises();
      jest.advanceTimersByTime(100);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });

    it('shows the load error when the request fails', async() => {
      const { wrapper } = mountPanel({ get: () => Promise.reject(new Error('nope')) });

      await flushPromises();

      expect(wrapper.find('.select-resource').text()).toBe('kubectl-explain.errors.load');
    });

    it('shows the not found message when there is no schema for the page', async() => {
      const { wrapper } = mountPanel({ props: { schema: undefined, cluster: 'local' } });

      await flushPromises();

      expect(wrapper.find('.select-resource').text()).toBe('kubectl-explain.errors.notFound');
      expect(wrapper.find('.title-text').text()).toBe('kubectl-explain.title');
    });
  });

  describe('expand/collapse all button', () => {
    const withDefinition = {
      busy:       false,
      noResource: false,
      definition: { properties: {} },
    };

    it('sits in the drawer header, outside the title heading', () => {
      const { wrapper } = mountPanel({ get: pending, data: withDefinition });

      expect(wrapper.find('.header > .expand-all').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rc-drawer-title"] .expand-all').exists()).toBe(false);
    });

    it('shows aria-expanded="false" when expandAll is false', () => {
      const { wrapper } = mountPanel({ get: pending, data: { ...withDefinition, expandAll: false } });
      const toggleBtn = wrapper.find('.expand-all');

      expect(toggleBtn.attributes('aria-expanded')).toBe('false');
    });

    it('shows aria-expanded="true" when expandAll is true', () => {
      const { wrapper } = mountPanel({ get: pending, data: { ...withDefinition, expandAll: true } });
      const toggleBtn = wrapper.find('.expand-all');

      expect(toggleBtn.attributes('aria-expanded')).toBe('true');
    });

    it('is labeled with the kubectl-explain.expandAll key when not yet expanded', () => {
      const { wrapper } = mountPanel({ get: pending, data: { ...withDefinition, expandAll: false } });
      const toggleBtn = wrapper.find('.expand-all');

      expect(toggleBtn.text()).toBe('kubectl-explain.expandAll');
    });

    it('is labeled with the kubectl-explain.collapseAll key when expanded', () => {
      const { wrapper } = mountPanel({ get: pending, data: { ...withDefinition, expandAll: true } });
      const toggleBtn = wrapper.find('.expand-all');

      expect(toggleBtn.text()).toBe('kubectl-explain.collapseAll');
    });

    it('toggles when clicked', async() => {
      const { wrapper } = mountPanel({ get: pending, data: { ...withDefinition, expandAll: false } });

      await wrapper.find('.expand-all').trigger('click');

      expect(wrapper.find('.expand-all').attributes('aria-expanded')).toBe('true');
    });

    it('is not rendered while loading', () => {
      const { wrapper } = mountPanel({
        get:  pending,
        data: {
          busy:       true,
          noResource: false,
          definition: { properties: {} }
        }
      });

      expect(wrapper.find('.expand-all').exists()).toBe(false);
    });
  });
});
