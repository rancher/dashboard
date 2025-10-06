import { mount, RouterLinkStub } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourcePopover from '@shell/components/Resource/Detail/ResourcePopover/index.vue';
import PopoverCard from '@shell/components/PopoverCard.vue';

const mockResource = {
  id:                 'test-ns/test-pod',
  type:               'pod',
  nameDisplay:        'My Test Pod',
  stateBackground:    'bg-success',
  detailLocation:     { name: 'pod-detail', params: { id: 'test-pod' } },
  parentNameOverride: 'Overridden Pod',
};

describe('component: ResourcePopover/index.vue', () => {
  let store: any;
  const mockClusterFind = jest.fn();
  const mockSomethingFind = jest.fn();

  const defaultStore = {
    getters: {
      'i18n/t':            () => (key: string) => key,
      currentStore:        () => () => 'cluster',
      'cluster/schemaFor': () => () => ({ id: 'pod' }),
      'type-map/labelFor': () => () => 'Pod',
    },
    actions: { 'cluster/find': mockClusterFind, 'something/find': mockSomethingFind }
  };

  const PopoverCardStub = {
    PopoverCard: {
      template: `
              <div>
                <slot />
                <slot name="heading-action" :close="() => {}" />
                <slot name="card-body" />
              </div>
            `,
    },
  };

  const createWrapper = (props: any = {}, storeConfig: any = defaultStore, stubs: any = {}) => {
    store = createStore(storeConfig);

    return mount(ResourcePopover, {
      props: {
        type: 'pod',
        id:   'test-ns/test-pod',
        ...props,
      },
      global: {
        plugins: [store],
        stubs:   {
          RouterLink:          RouterLinkStub,
          RcStatusIndicator:   true,
          ActionMenu:          true,
          ResourcePopoverCard: true,
          VDropdown:           true,
          ...stubs
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('data Fetching and Rendering', () => {
    it('should display a loading indicator while fetching data', async() => {
      mockClusterFind.mockImplementation(() => new Promise(() => { }));
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('...');
      expect(wrapper.find('.display').exists()).toBe(false);
    });

    it('should fetch data using the default store', async() => {
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(mockClusterFind).toHaveBeenCalledWith(expect.any(Object), { type: 'pod', id: 'test-ns/test-pod' });
    });

    it('should fetch data using the store specified in props', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ currentStore: 'something' });

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(mockSomethingFind).toHaveBeenCalledWith(expect.any(Object), { type: 'pod', id: 'test-ns/test-pod' });
      expect(mockClusterFind).not.toHaveBeenCalled();
    });

    it('should display resource details after data is fetched', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.text()).toBe(mockResource.nameDisplay);
      expect(link.props('to')).toStrictEqual(mockResource.detailLocation);
    });

    it('should use detailLocation prop for the link if provided', async() => {
      const customLocation = { name: 'custom-route' };

      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ detailLocation: customLocation }, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.props('to')).toStrictEqual(customLocation);
    });
  });

  describe('computed Properties', () => {
    it('resourceTypeLabel: should be empty if data is not loaded', async() => {
      mockClusterFind.mockReturnValue(undefined);
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const popoverCard = wrapper.findComponent(PopoverCard);
      const ariaLabel = popoverCard.props('showPopoverAriaLabel');

      expect(ariaLabel).toBe('component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"\",\"resource\":\"\"}');
    });

    it('resourceTypeLabel: should use parentNameOverride when available', async() => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const popoverCard = wrapper.findComponent(PopoverCard);
      const ariaLabel = popoverCard.props('showPopoverAriaLabel');

      expect(ariaLabel).toBe('component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"My Test Pod\",\"resource\":\"Overridden Pod\"}');
    });

    it('resourceTypeLabel: should use type-map label as a fallback', async() => {
      const resourceWithoutOverride = { ...mockResource, parentNameOverride: null };

      mockClusterFind.mockResolvedValue(resourceWithoutOverride);
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const popoverCard = wrapper.findComponent(PopoverCard);
      const ariaLabel = popoverCard.props('showPopoverAriaLabel');

      expect(ariaLabel).toBe('component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"My Test Pod\",\"resource\":\"Pod\"}');
    });
  });

  describe('props passed to child components', () => {
    it('should pass correct props to PopoverCard', async() => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const popoverCard = wrapper.findComponent(PopoverCard);

      expect(popoverCard.props('cardTitle')).toBe(mockResource.nameDisplay);
      expect(popoverCard.props('fallbackFocus')).toBe("[data-testid='resource-popover-action-menu']");

      const expectedAriaLabel = 'component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"My Test Pod\",\"resource\":\"Overridden Pod\"}';

      expect(popoverCard.props('showPopoverAriaLabel')).toBe(expectedAriaLabel);
    });

    it('should pass correct props to ActionMenu', async() => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const actionMenu = wrapper.findComponent({ name: 'ActionMenu' });

      expect(actionMenu.props('resource')).toStrictEqual(mockResource);

      const expectedAriaLabel = 'component.resource.detail.glance.ariaLabel.actionMenu-{\"resource\":\"My Test Pod\"}';

      expect(actionMenu.props('buttonAriaLabel')).toBe(expectedAriaLabel);
    });

    it('should pass correct props to ResourcePopoverCard', async() => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const resourceCard = wrapper.findComponent({ name: 'ResourcePopoverCard' });

      expect(resourceCard.props('resource')).toStrictEqual(mockResource);
    });
  });
});
