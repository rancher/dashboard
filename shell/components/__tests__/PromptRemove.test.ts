import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import PromptRemove from '@shell/components/PromptRemove.vue';

// PromptRemove is the highest-traffic modal in the product and the one that
// drives every delete. These cover the chrome it hands to RcModal - that the
// title, the body and the two actions land in the right slots - rather than
// the removal logic, which is unchanged.
describe('component: PromptRemove', () => {
  const mountPrompt = (toRemove: any[] = []) => {
    const store = createStore({
      getters: {
        'type-map/importCustomPromptRemove': () => () => null,
        'type-map/labelFor':                 () => () => 'Namespace',
        'i18n/t':                            () => (key: string) => `%${ key }%`,
        currentProduct:                      () => ({ inStore: 'cluster' }),
      },
      modules: {
        'action-menu': {
          namespaced: true,
          state:      () => ({ showPromptRemove: false, toRemove }),
          mutations:  {
            togglePromptRemove: (state: any) => {
              state.showPromptRemove = false;
            }
          },
        },
      },
    });

    const wrapper = mount(PromptRemove, {
      global: {
        mocks: {
          $store:  store,
          $route:  { params: { resource: 'namespace' } },
          $router: { push: jest.fn() },
        },
        directives: { focus: {} },
        stubs:      {
          // Teleporting to #modals has nowhere to land in jsdom, and the
          // chrome under test does not depend on the overlay.
          AppModal:     { template: '<div><slot /></div>' },
          AsyncButton:  { template: '<button></button>' },
          LabeledInput: { template: '<input>' },
          Checkbox:     true,
        },
      },
    });

    // showPromptRemove/toRemove come from a vuex module the mock store does not
    // run, so the modal is opened directly.
    wrapper.vm.showModal = true;

    return wrapper;
  };

  const resource = (nameDisplay: string) => ({
    nameDisplay,
    type:         'namespace',
    schema:       { id: 'namespace' },
    currentRoute: () => ({ params: {} }),
  });

  it('renders its chrome through RcModal rather than a Card', async() => {
    const wrapper = mountPrompt([resource('my-namespace')]);

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="rc-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="card"]').exists()).toBe(false);
  });

  it('puts the prompt title in the header slot', async() => {
    const wrapper = mountPrompt([resource('my-namespace')]);

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="rc-modal-title"]').text()).toBe('%promptRemove.title%');
  });

  it('puts the names of what is being removed in the body slot', async() => {
    const wrapper = mountPrompt([resource('my-namespace')]);

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="rc-modal-body"]').text()).toContain('%promptRemove.attemptingToRemove%');
  });

  it('puts cancel and delete in the actions slot, cancel first', async() => {
    const wrapper = mountPrompt([resource('my-namespace')]);

    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('[data-testid="rc-modal-actions"] button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toBe('%generic.cancel%');
    expect(buttons[0].classes()).toContain('role-secondary');
    expect(buttons[1].attributes('data-testid')).toBe('prompt-remove-confirm-button');
    expect(buttons[1].classes()).toContain('bg-error');
  });

  it('closes through the store when cancel is clicked', async() => {
    const wrapper = mountPrompt([resource('my-namespace')]);

    await wrapper.vm.$nextTick();
    await wrapper.find('[data-testid="rc-modal-actions"] button.role-secondary').trigger('click');

    expect(wrapper.vm.$store.state['action-menu'].showPromptRemove).toBe(false);
  });
});
