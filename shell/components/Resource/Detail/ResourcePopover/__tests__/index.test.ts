import { mount, RouterLinkStub } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourcePopover from '@shell/components/Resource/Detail/ResourcePopover/index.vue';

const mockI18n = { t: (key: string, args: any) => JSON.stringify({ key, args }) };
const mockFocusTrap = jest.fn();

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => mockI18n }));
jest.mock('@shell/composables/focusTrap', () => ({ useWatcherBasedSetupFocusTrapWithDestroyIncluded: (...args: any) => mockFocusTrap(...args) }));

const mockResource = {
  id:                 'test-ns/test-pod',
  type:               'pod',
  nameDisplay:        'My Test Pod',
  stateBackground:    'bg-success',
  detailLocation:     { name: 'pod-detail', params: { id: 'test-pod' } },
  glance:             [{ label: 'Status', content: 'Active' }],
  parentNameOverride: 'Overridden Pod',
};

describe('component: ResourcePopover/index.vue', () => {
  let store: any;
  const mockClusterFind = jest.fn();
  const mockSomethingFind = jest.fn();

  const createWrapper = async(props: any = { type: 'pod', id: 'test-ns/test-pod' }) => {
    store = createStore({
      getters: {
        'i18n/t':            () => (key: string) => key,
        currentStore:        () => () => 'cluster',
        'cluster/schemaFor': () => () => ({ id: 'pod' }),
        'type-map/labelFor': () => () => 'Pod',
      },
      actions: { 'cluster/find': mockClusterFind, 'something/find': mockSomethingFind }
    });

    const wrapper = mount(ResourcePopover, {
      props,
      global: {
        plugins: [store],
        stubs:   {
          'v-dropdown':        { name: 'v-dropdown', template: '<div><slot /><slot name="popper" /></div>' },
          'router-link':       RouterLinkStub,
          ResourcePopoverCard: {
            name:     'ResourcePopoverCard',
            template: '<div id="resource-popover-card" />'
          },
          RcStatusIndicator: true,
        },
      },
    });

    // Requires two so the fetch can be resolved
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    return wrapper;
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('data Fetching and Initial State', () => {
    it('should show loading state initially', async() => {
      const wrapper = await createWrapper(); // Override default fetch value

      expect(wrapper.find('.display').exists()).toBe(false);
      expect(wrapper.text()).toContain('...');
    });

    it('should call the fetch composable and dispatch a store action', async() => {
      await createWrapper();

      expect(mockClusterFind).toHaveBeenCalledWith(expect.objectContaining({}), expect.objectContaining({ type: 'pod', id: 'test-ns/test-pod' }));
    });

    it('should dispatch to the specified store', async() => {
      await createWrapper({
        type: 'pod', id: 'test-ns/test-pod', currentStore: 'something'
      });

      expect(mockSomethingFind).toHaveBeenCalledWith(expect.objectContaining({}), expect.objectContaining({ type: 'pod', id: 'test-ns/test-pod' }));
    });

    it('should render resource name and link when data is loaded', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();
      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(link.text()).toBe(mockResource.nameDisplay);
      expect(link.props('to')).toStrictEqual(mockResource.detailLocation);
    });

    it('should use `detailLocation` prop for router-link if provided', async() => {
      const detailLocationProp = { name: 'custom-route' };

      const wrapper = await createWrapper({
        type:           'pod',
        id:             'test-ns/test-pod',
        detailLocation: detailLocationProp
      });

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.props('to')).toStrictEqual(detailLocationProp);
    });
  });

  describe('computed Properties', () => {
    it('should return empty resourceTypeLabel if no data', async() => {
      mockClusterFind.mockReturnValue(null);

      const wrapper = await createWrapper();

      expect(wrapper.vm.resourceTypeLabel).toBe('');
    });

    it('should return resourceTypeLabel from type-map getter', async() => {
      const resourceWithoutOverride = { ...mockResource, parentNameOverride: undefined };

      mockClusterFind.mockReturnValue(resourceWithoutOverride);
      const wrapper = await createWrapper();

      expect(wrapper.vm.resourceTypeLabel).toBe('Pod');
    });

    it('should generate correct aria-labels', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      const expectedAriaLabel = JSON.stringify({ key: 'component.resource.detail.glance.ariaLabel.showDetails', args: { name: mockResource.nameDisplay, resource: mockResource.parentNameOverride } });
      const dropdown = wrapper.findComponent({ name: 'v-dropdown' });
      const button = wrapper.find('.focus-button');

      expect(dropdown.attributes('aria-label')).toBe(expectedAriaLabel);
      expect(button.attributes('aria-label')).toBe(expectedAriaLabel);
    });
  });

  describe('popover Visibility', () => {
    it('should not show popover card initially', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(false);
    });

    it('should show popover on mouseenter', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.display').trigger('mouseenter');
      expect(wrapper.vm.showPopover).toBe(true);
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(true);
    });

    it('should hide popover on mouseleave', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.display').trigger('mouseenter');
      expect(wrapper.vm.showPopover).toBe(true);

      await wrapper.find('.resource-popover').trigger('mouseleave');
      expect(wrapper.vm.showPopover).toBe(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(false);
    });

    it('should show popover on focus button click', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.focus-button').trigger('click');
      expect(wrapper.vm.showPopover).toBe(true);
      expect(wrapper.vm.focusOpen).toBe(true);
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(true);
    });

    it('should hide popover when action is invoked from card', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.display').trigger('mouseenter');
      await wrapper.vm.$nextTick();

      const card = wrapper.findComponent({ name: 'ResourcePopoverCard' });

      await card.vm.$emit('action-invoked');
      expect(wrapper.vm.showPopover).toBe(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(false);
    });

    it('should hide popover on Escape keydown', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.focus-button').trigger('click');
      await wrapper.vm.$nextTick();

      const card = wrapper.findComponent({ name: 'ResourcePopoverCard' });

      await card.trigger('keydown.escape');
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).exists()).toBe(false);
    });
  });

  describe('focus Trap', () => {
    it('should not setup focus trap on mouseenter', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.display').trigger('mouseenter');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.focusOpen).toBe(false);
      expect(mockFocusTrap).not.toHaveBeenCalled();
    });

    it('should setup focus trap when opened via focus button', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = await createWrapper();

      await wrapper.find('.focus-button').trigger('click');
      await wrapper.vm.$nextTick(); // Triggers the watch

      expect(wrapper.vm.focusOpen).toBe(true);
      expect(mockFocusTrap).toHaveBeenCalledTimes(1);

      // Verify the options passed to the focus trap
      const focusTrapOptions = mockFocusTrap.mock.calls[0][2];

      expect(focusTrapOptions.fallbackFocus).toBe('#first-glance-item');
      expect(focusTrapOptions.setReturnFocus()).toBe('.focus-button');
    });
  });
});
