import { shallowMount, createLocalVue } from '@vue/test-utils';
import GrowlManager from '@shell/components/GrowlManager.vue';
import Vuex from 'vuex';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

const stackMock = [
  {
    title:   'growl1-title',
    message: 'growl1-message',
    icon:    'growl1-icon',
    timeout: 5000,
    id:      'growl1-id',
    color:   'red'
  },
  {
    title:   'growl2-title',
    message: 'growl2-message',
    icon:    'growl2-icon',
    timeout: 5000,
    id:      'growl2-id',
    color:   'red'
  }
];

describe('component: GrowlManager', () => {
  it('should render component with the correct data applied', async() => {
    const mockStore = {
      getters:  { 'i18n/t': jest.fn() },
      dispatch: () => jest.fn()
    };

    const wrapper = shallowMount(GrowlManager as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed: { stack: () => stackMock },
      mocks:    { $store: mockStore }
    });

    await wrapper.vm.$nextTick();

    const growlMainContainer = wrapper.find('.growl-container');
    const growlListContainer = wrapper.find('.growl-list');
    const growlListItems = wrapper.findAll('.growl-list .growl');
    const growlFirstItemIcon = wrapper.find('.growl-list [data-testid="growl-list-item-0"] .icon-container .icon');
    const growlFirstItemTitle = wrapper.find('.growl-list [data-testid="growl-list-item-0"] .growl-text div');
    const growlFirstItemMessage = wrapper.find('.growl-list [data-testid="growl-list-item-0"] .growl-text p');
    const growlFirstItemClose = wrapper.find('.growl-list [data-testid="growl-list-item-0"] .close.icon');
    const clearAllButton = wrapper.find('button[type="button"]');

    expect(growlMainContainer.exists()).toBe(true);
    expect(growlListContainer.exists()).toBe(true);
    expect(growlListItems).toHaveLength(2);
    expect(growlFirstItemIcon.classes()).toContain('icon-growl1-icon');
    expect(growlFirstItemTitle.text()).toBe('growl1-title');
    expect(growlFirstItemMessage.text()).toBe('growl1-message');
    expect(growlFirstItemClose.exists()).toBe(true);
    expect(clearAllButton.exists()).toBe(true);
  });

  it('clicking on individual growl close should dismiss the individual growl', async() => {
    const mockStore = {
      getters:  { 'i18n/t': jest.fn() },
      dispatch: () => jest.fn()
    };

    const wrapper = shallowMount(GrowlManager as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed: { stack: () => stackMock },
      mocks:    { $store: mockStore }
    });

    await wrapper.vm.$nextTick();

    const growlFirstItemClose = wrapper.find('.growl-list [data-testid="growl-list-item-0"] .close.icon');
    const spyClose = jest.spyOn(wrapper.vm, 'close');
    const spyDispatch = jest.spyOn(mockStore, 'dispatch');

    growlFirstItemClose.trigger('click');

    expect(spyClose).toHaveBeenCalledTimes(1);
    expect(spyClose).toHaveBeenCalledWith(stackMock[0]);
    expect(spyDispatch).toHaveBeenCalledTimes(1);
  });

  it('clicking on clear all growls should dismiss all growls', async() => {
    const mockStore = {
      getters:  { 'i18n/t': jest.fn() },
      dispatch: () => jest.fn()
    };

    const wrapper = shallowMount(GrowlManager as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed: { stack: () => stackMock },
      mocks:    { $store: mockStore }
    });

    const clearAllButton = wrapper.find('button[type="button"]');
    const spyCloseAll = jest.spyOn(wrapper.vm, 'closeAll');
    const spyDispatch = jest.spyOn(mockStore, 'dispatch');

    clearAllButton.trigger('click');

    await wrapper.vm.$nextTick();

    expect(spyCloseAll).toHaveBeenCalledTimes(1);
    expect(spyDispatch).toHaveBeenCalledTimes(1);
  });

  it('growl should auto remove itself after set interval of 1 second', async() => {
    const localVue = createLocalVue();

    localVue.use(Vuex);

    const store = new Vuex.Store({
      modules: {
        growl: {
          namespaced: true,
          state:      { stack: [] },
          actions:    { clear: jest.fn() },
          mutations:  {
            updateStack: (state) => {
              state.stack = stackMock;
            }
          }
        },
      },
      getters: { 'i18n/t': () => jest.fn() }
    });

    jest.useFakeTimers();

    const wrapper = shallowMount(GrowlManager as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      store,
      localVue
    });

    const spyCloseExpired = jest.spyOn(wrapper.vm, 'closeExpired');

    expect(spyCloseExpired).not.toHaveBeenCalled();

    // this is to trigger the watch so that autoRemove can do its part
    store.commit('growl/updateStack');

    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1001);

    expect(spyCloseExpired).toHaveBeenCalledTimes(1);
  });
});
