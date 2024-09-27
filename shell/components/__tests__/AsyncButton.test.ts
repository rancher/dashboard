import { mount, VueWrapper } from '@vue/test-utils';
import AsyncButton, { ASYNC_BUTTON_STATES } from '@shell/components/AsyncButton.vue';

describe('component: AsyncButton', () => {
  it('should render appropriately with default config', () => {
    const mockExists = jest.fn().mockReturnValue(true);
    const mockT = jest.fn().mockReturnValue('some-string');

    const wrapper: VueWrapper<InstanceType<typeof AsyncButton>> = mount(AsyncButton, {
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/exists': mockExists,
              'i18n/t':      mockT
            }
          },
        }
      },
    });

    const button = wrapper.find('button');
    const icon = wrapper.find('i');
    const span = wrapper.find('span');

    expect(wrapper.props().currentPhase).toBe(ASYNC_BUTTON_STATES.ACTION);

    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain('btn');
    expect(button.classes()).toContain('role-primary');
    expect(button.element.name).toBe('');
    expect(button.element.tagName.toLowerCase()).toBe('button');
    expect(button.element.getAttribute('disabled')).toBeNull();
    expect(button.element.getAttribute('tabindex')).toBeNull();
    // we are mocking the getters, so it's to expect to find an icon
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('icon');
    expect(icon.classes()).toContain('icon-lg');
    expect(icon.classes()).toContain('icon-some-string');
    // we are mocking the getters, so it's to expect to find a label
    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('some-string');
  });

  it('click on async button should emit click with a proper state of waiting, disabled and spinning ::: CB true', () => {
    jest.useFakeTimers();

    const wrapper: VueWrapper<InstanceType<typeof AsyncButton>> = mount(AsyncButton, {
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/exists': jest.fn(),
              'i18n/t':      jest.fn()
            }
          }
        },
      }
    });

    const spyDone = jest.spyOn(wrapper.vm, 'done');

    wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.WAITING);
    expect(wrapper.vm.isSpinning).toBe(true);
    expect(wrapper.vm.isDisabled).toBe(true);
    // testing cb function has been emitted
    expect(typeof wrapper.emitted('click')![0][0]).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    wrapper.emitted('click')![0][0](true);

    expect(spyDone).toHaveBeenCalledWith(true);
    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.SUCCESS);

    // wait for button delay to be completed
    jest.runAllTimers();

    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.ACTION);
  });

  it('click on async button should emit click and update state properly ::: CB false', () => {
    jest.useFakeTimers();

    const wrapper: VueWrapper<InstanceType<typeof AsyncButton>> = mount(AsyncButton, {
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/exists': jest.fn(),
              'i18n/t':      jest.fn()
            }
          }
        },
      }
    });

    const spyDone = jest.spyOn(wrapper.vm, 'done');

    wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    // testing cb function has been emitted
    expect(typeof wrapper.emitted('click')![0][0]).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    wrapper.emitted('click')![0][0](false);

    expect(spyDone).toHaveBeenCalledWith(false);
    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.ERROR);

    // wait for button delay to be completed
    jest.runAllTimers();

    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.ACTION);
  });

  it('click on async button should emit click and update state properly ::: CB "cancelled"', () => {
    const wrapper: VueWrapper<InstanceType<typeof AsyncButton>> = mount(AsyncButton, {
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/exists': jest.fn(),
              'i18n/t':      jest.fn()
            }
          }
        },
      }
    });

    const spyDone = jest.spyOn(wrapper.vm, 'done');

    wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    // testing cb function has been emitted
    expect(typeof wrapper.emitted('click')![0][0]).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    wrapper.emitted('click')![0][0]('cancelled');

    expect(spyDone).toHaveBeenCalledWith('cancelled');
    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.ACTION);
  });
});
