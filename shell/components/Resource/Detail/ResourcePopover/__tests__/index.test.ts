import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
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
    it('should display the id and a loading indicator while fetching data', async() => {
      mockClusterFind.mockImplementation(() => new Promise(() => { }));
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.display').text()).toBe('test-ns/test-pod');
      expect(wrapper.find('[data-testid="resource-popover-loading"]').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'RcStatusIndicator' }).exists()).toBe(false);
    });

    it('should announce the loading indicator and let it take focus when the card is opened with the keyboard', async() => {
      mockClusterFind.mockImplementation(() => new Promise(() => { }));
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const loading = wrapper.find('[data-testid="resource-popover-loading"]');

      expect(loading.attributes()).toStrictEqual(expect.objectContaining({
        role: 'status', tabindex: '-1', 'aria-label': 'component.resource.detail.glance.ariaLabel.loading'
      }));
    });

    it('should show plain text and no PopoverCard when fetch fails', async() => {
      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent(PopoverCard).exists()).toBe(false);
      expect(wrapper.text()).toBe('test-ns/test-pod');
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
    it('resourceTypeLabel: should use the label of the type prop if data is not loaded', async() => {
      mockClusterFind.mockReturnValue(undefined);
      const wrapper = createWrapper();

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const popoverCard = wrapper.findComponent(PopoverCard);
      const ariaLabel = popoverCard.props('showPopoverAriaLabel');

      expect(ariaLabel).toBe('component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"test-ns/test-pod\",\"resource\":\"Pod\"}');
    });

    it('resourceTypeLabel: should be empty if there is no schema for the type', async() => {
      mockClusterFind.mockReturnValue(undefined);
      const wrapper = createWrapper(undefined, {
        ...defaultStore,
        getters: { ...defaultStore.getters, 'cluster/schemaFor': () => () => undefined }
      });

      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const ariaLabel = wrapper.findComponent(PopoverCard).props('showPopoverAriaLabel');

      expect(ariaLabel).toBe('component.resource.detail.glance.ariaLabel.showDetails-{\"name\":\"test-ns/test-pod\",\"resource\":\"\"}');
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
      expect(popoverCard.props('fallbackFocus')).toBe("[data-testid='resource-popover-action-menu'], [data-testid='resource-popover-loading'], [data-testid='resource-popover-error']");

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

  describe('name, showStatus and lazy props', () => {
    const flush = async(wrapper: any) => {
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
    };

    it('should show the name prop while the resource is loading', async() => {
      mockClusterFind.mockImplementation(() => new Promise(() => { }));
      const wrapper = createWrapper({ name: 'test-pod' }, undefined, PopoverCardStub);

      await flush(wrapper);

      expect(wrapper.find('.display').text()).toBe('test-pod');
    });

    it('should link to the detailLocation prop while the resource is loading', async() => {
      const customLocation = { name: 'custom-route' };

      mockClusterFind.mockImplementation(() => new Promise(() => { }));
      const wrapper = createWrapper({ name: 'test-pod', detailLocation: customLocation }, undefined, PopoverCardStub);

      await flush(wrapper);

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.text()).toBe('test-pod');
      expect(link.props('to')).toStrictEqual(customLocation);
    });

    it('should show a link with the name prop when the fetch fails and there is a detailLocation', async() => {
      const customLocation = { name: 'custom-route' };

      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper({ name: 'test-pod', detailLocation: customLocation }, undefined, PopoverCardStub);

      await flush(wrapper);

      const link = wrapper.findComponent(RouterLinkStub);

      expect(wrapper.findComponent(PopoverCard).exists()).toBe(false);
      expect(link.text()).toBe('test-pod');
      expect(link.props('to')).toStrictEqual(customLocation);
    });

    it('should show the status of the resource by default', async() => {
      mockClusterFind.mockReturnValue({ ...mockResource, stateSimpleColor: 'success' });
      const wrapper = createWrapper(undefined, undefined, PopoverCardStub);

      await flush(wrapper);

      expect(wrapper.findComponent({ name: 'RcStatusIndicator' }).props('status')).toBe('success');
    });

    it('should hide the status of the resource when showStatus is false', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ showStatus: false }, undefined, PopoverCardStub);

      await flush(wrapper);

      expect(wrapper.findComponent({ name: 'RcStatusIndicator' }).exists()).toBe(false);
      expect(wrapper.findComponent(RouterLinkStub).text()).toBe(mockResource.nameDisplay);
    });

    it('should not fetch a lazy resource until the user hovers it', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ lazy: true, name: 'test-pod' }, undefined, PopoverCardStub);

      await flush(wrapper);

      expect(mockClusterFind).toHaveBeenCalledTimes(0);
      expect(wrapper.find('.display').text()).toBe('test-pod');

      await wrapper.findComponent(PopoverCard).trigger('mouseenter');
      await flush(wrapper);

      expect(mockClusterFind).toHaveBeenCalledWith(expect.any(Object), { type: 'pod', id: 'test-ns/test-pod' });
      expect(wrapper.find('.display').text()).toBe(mockResource.nameDisplay);
    });

    it('should fetch a lazy resource when the user focuses it', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ lazy: true }, undefined, PopoverCardStub);

      await flush(wrapper);
      await wrapper.findComponent(PopoverCard).trigger('focusin');
      await flush(wrapper);

      expect(mockClusterFind).toHaveBeenCalledWith(expect.any(Object), { type: 'pod', id: 'test-ns/test-pod' });
    });

    it('should fetch a lazy resource only once', async() => {
      mockClusterFind.mockReturnValue(mockResource);
      const wrapper = createWrapper({ lazy: true }, undefined, PopoverCardStub);
      const popoverCard = wrapper.findComponent(PopoverCard);

      await popoverCard.trigger('mouseenter');
      await flush(wrapper);
      await popoverCard.trigger('mouseenter');
      await flush(wrapper);

      expect(mockClusterFind).toHaveBeenCalledTimes(1);
    });

    it('should keep the card of a lazy resource and show an error in it when the fetch fails', async() => {
      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper({ lazy: true, name: 'test-pod' }, undefined, PopoverCardStub);

      await wrapper.findComponent(PopoverCard).trigger('focusin');
      await flush(wrapper);

      expect(wrapper.findComponent(PopoverCard).exists()).toBe(true);
      expect(wrapper.find('.display').text()).toBe('test-pod');
      expect(wrapper.find('[data-testid="resource-popover-loading"]').exists()).toBe(false);
    });

    it('should let the error of a lazy resource take focus when the card is opened with the keyboard', async() => {
      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper({ lazy: true }, undefined, PopoverCardStub);

      await wrapper.findComponent(PopoverCard).trigger('focusin');
      await flush(wrapper);

      const error = wrapper.find('[data-testid="resource-popover-error"]');

      expect(error.text()).toBe('component.resource.detail.glance.loadError');
      expect(error.attributes()).toStrictEqual(expect.objectContaining({ role: 'status', tabindex: '-1' }));
    });

    it('should not fetch a lazy resource again after the fetch fails', async() => {
      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper({ lazy: true }, undefined, PopoverCardStub);
      const popoverCard = wrapper.findComponent(PopoverCard);

      await popoverCard.trigger('mouseenter');
      await flush(wrapper);
      await popoverCard.trigger('mouseenter');
      await flush(wrapper);

      expect(mockClusterFind).toHaveBeenCalledTimes(1);
    });
  });

  describe('resources the card needs besides the resource itself', () => {
    // Like PopoverCard, the content of the card is only mounted while the card is open
    const OpenablePopoverCardStub = {
      PopoverCard: {
        data:     () => ({ open: false }),
        template: `
              <div>
                <slot />
                <slot name="heading-action" :close="() => {}" />
                <div v-if="open"><slot name="card-body" /></div>
              </div>
            `,
      },
    };

    const openCard = async(wrapper: any) => {
      wrapper.findComponent(PopoverCard).vm.open = true;
      await flushPromises();
    };

    const closeCard = async(wrapper: any) => {
      wrapper.findComponent(PopoverCard).vm.open = false;
      await flushPromises();
    };

    const resourceWithGlanceResources = (fetchGlanceResources = jest.fn().mockResolvedValue(undefined)) => ({ ...mockResource, fetchGlanceResources });

    it('should not fetch them when the resource loads, before the card opens', async() => {
      const resource = resourceWithGlanceResources();

      mockClusterFind.mockResolvedValue(resource);
      createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await flushPromises();

      expect(resource.fetchGlanceResources.mock.calls).toStrictEqual([]);
    });

    it('should fetch them each time the card opens, so they are current', async() => {
      const resource = resourceWithGlanceResources();

      mockClusterFind.mockResolvedValue(resource);
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await flushPromises();
      await openCard(wrapper);

      expect(resource.fetchGlanceResources).toHaveBeenCalledWith();

      await closeCard(wrapper);
      await openCard(wrapper);

      expect(resource.fetchGlanceResources).toHaveBeenCalledTimes(2);
      expect(mockClusterFind).toHaveBeenCalledTimes(1);
    });

    it('should show the card without waiting for them', async() => {
      const resource = resourceWithGlanceResources(jest.fn(() => new Promise(() => { })));

      mockClusterFind.mockResolvedValue(resource);
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await flushPromises();
      await openCard(wrapper);

      expect(wrapper.find('[data-testid="resource-popover-loading"]').exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).props('resource')).toStrictEqual(resource);
    });

    it('should show the card when they can not be fetched', async() => {
      const resource = resourceWithGlanceResources(jest.fn().mockRejectedValue(new Error('forbidden')));

      mockClusterFind.mockResolvedValue(resource);
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await flushPromises();
      await openCard(wrapper);

      expect(resource.fetchGlanceResources).toHaveBeenCalledWith();
      expect(wrapper.find('[data-testid="resource-popover-error"]').exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).props('resource')).toStrictEqual(resource);
    });

    it('should show the card of a resource that does not need them', async() => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await flushPromises();
      await openCard(wrapper);

      expect(wrapper.findComponent({ name: 'ResourcePopoverCard' }).props('resource')).toStrictEqual(mockResource);
    });

    it('should fetch them once the resource has loaded when the card opened first', async() => {
      const resource = resourceWithGlanceResources();
      let resolveFind: (value: any) => void = () => { };

      mockClusterFind.mockImplementation(() => new Promise((resolve) => {
        resolveFind = resolve;
      }));
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await openCard(wrapper);
      resolveFind(resource);
      await flushPromises();

      expect(resource.fetchGlanceResources).toHaveBeenCalledTimes(1);
    });

    it('should not fetch them when the card closed before the resource loaded', async() => {
      const resource = resourceWithGlanceResources();
      let resolveFind: (value: any) => void = () => { };

      mockClusterFind.mockImplementation(() => new Promise((resolve) => {
        resolveFind = resolve;
      }));
      const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

      await openCard(wrapper);
      await closeCard(wrapper);
      resolveFind(resource);
      await flushPromises();

      expect(resource.fetchGlanceResources.mock.calls).toStrictEqual([]);
    });

    it('should fetch them once when a lazy resource is first hovered', async() => {
      const resource = resourceWithGlanceResources();

      mockClusterFind.mockResolvedValue(resource);
      const wrapper = createWrapper({ lazy: true }, undefined, OpenablePopoverCardStub);

      await wrapper.findComponent(PopoverCard).trigger('mouseenter');
      await openCard(wrapper);

      expect(resource.fetchGlanceResources).toHaveBeenCalledTimes(1);
    });

    it('should not fetch them when a lazy resource is focused but its card is not opened', async() => {
      const resource = resourceWithGlanceResources();

      mockClusterFind.mockResolvedValue(resource);
      const wrapper = createWrapper({ lazy: true }, undefined, OpenablePopoverCardStub);

      await wrapper.findComponent(PopoverCard).trigger('focusin');
      await flushPromises();

      expect(mockClusterFind).toHaveBeenCalledWith(expect.any(Object), { type: 'pod', id: 'test-ns/test-pod' });
      expect(resource.fetchGlanceResources.mock.calls).toStrictEqual([]);
    });

    it('should not fetch them when the resource can not be loaded', async() => {
      mockClusterFind.mockRejectedValue(new Error('Not found'));
      const wrapper = createWrapper({ lazy: true }, undefined, OpenablePopoverCardStub);

      await wrapper.findComponent(PopoverCard).trigger('mouseenter');
      await openCard(wrapper);

      expect(wrapper.find('[data-testid="resource-popover-error"]').exists()).toBe(true);
    });

    describe('loading', () => {
      const deferred = () => {
        let resolvePromise: (value?: any) => void = () => { };
        let rejectPromise: (reason?: any) => void = () => { };
        const promise = new Promise((resolve, reject) => {
          resolvePromise = resolve;
          rejectPromise = reject;
        });

        return {
          promise, resolve: resolvePromise, reject: rejectPromise
        };
      };

      const usageLoading = (wrapper: any) => wrapper.findComponent({ name: 'ResourcePopoverCard' }).props('usageLoading');

      const openWithPendingFetch = async() => {
        const pending = deferred();
        const resource = resourceWithGlanceResources(jest.fn(() => pending.promise));

        mockClusterFind.mockResolvedValue(resource);
        const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

        await flushPromises();
        await openCard(wrapper);

        return { wrapper, pending };
      };

      it('should tell the card the usage is loading while they are fetched', async() => {
        const { wrapper } = await openWithPendingFetch();

        expect(usageLoading(wrapper)).toBe(true);
      });

      it('should tell the card the usage has loaded once they are fetched', async() => {
        const { wrapper, pending } = await openWithPendingFetch();

        pending.resolve();
        await flushPromises();

        expect(usageLoading(wrapper)).toBe(false);
      });

      it('should tell the card the usage has loaded when they can not be fetched, so it shows n/a rather than loading forever', async() => {
        const { wrapper, pending } = await openWithPendingFetch();

        pending.reject(new Error('forbidden'));
        await flushPromises();

        expect(usageLoading(wrapper)).toBe(false);
      });

      it('should keep loading until the latest fetch finishes when the card is opened again before the first one finishes', async() => {
        const first = deferred();
        const second = deferred();
        const resource = resourceWithGlanceResources(jest.fn()
          .mockImplementationOnce(() => first.promise)
          .mockImplementationOnce(() => second.promise));

        mockClusterFind.mockResolvedValue(resource);
        const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

        await flushPromises();
        await openCard(wrapper);
        await closeCard(wrapper);
        await openCard(wrapper);

        first.resolve();
        await flushPromises();

        expect(usageLoading(wrapper)).toBe(true);

        second.resolve();
        await flushPromises();

        expect(usageLoading(wrapper)).toBe(false);
      });

      it('should not tell the card anything is loading for a resource that does not need them', async() => {
        mockClusterFind.mockResolvedValue(mockResource);
        const wrapper = createWrapper(undefined, undefined, OpenablePopoverCardStub);

        await flushPromises();
        await openCard(wrapper);

        expect(usageLoading(wrapper)).toBe(false);
      });
    });
  });

  describe('wrapName', () => {
    it.each([
      [undefined, false],
      [false, false],
      [true, true],
    ])('should wrap a long name when wrapName is %p: %p', async(wrapName, expected) => {
      mockClusterFind.mockResolvedValue(mockResource);
      const wrapper = createWrapper({ wrapName }, undefined, PopoverCardStub);

      await flushPromises();

      expect(wrapper.findComponent(PopoverCard).classes('wrap-name')).toBe(expected);
    });
  });
});
