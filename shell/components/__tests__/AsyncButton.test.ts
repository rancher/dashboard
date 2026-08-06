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

  it('click on async button should emit click with a proper state of waiting, appear disabled and spinning ::: CB true', () => {
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
    expect(wrapper.vm.appearsDisabled).toBe(true);
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

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', () => {
    const mockExists = jest.fn().mockReturnValue(true);
    const mockT = jest.fn().mockReturnValue('some-string');
    const ariaLabel = 'some-aria-label';
    const ariaLabelledBy = 'some-aria-labelledby';

    const wrapper: VueWrapper<InstanceType<typeof AsyncButton>> = mount(AsyncButton, {
      props:  { icon: 'some-icon', disabled: true },
      attrs:  { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy },
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

    const item = wrapper.find('button');

    const itemRole = item.attributes('role');
    const itemAriaLabel = item.attributes('aria-label');
    const itemAriaLabelledBy = item.attributes('aria-labelledby');
    const itemAriaDisabled = item.attributes('aria-disabled');

    // let's check some attributes passing...
    expect(itemAriaLabel).toBe(ariaLabel);
    expect(itemAriaLabelledBy).toBe(ariaLabelledBy);

    // rest of the checks
    expect(itemRole).toBe('button');
    expect(itemAriaDisabled).toBe('true');
    expect(item.find('span[data-testid="async-btn-display-label"]').attributes('id')).toBe(wrapper.vm.describedbyId);
    expect(item.find('i').attributes('alt')).toBeDefined();
  });

  describe('displayIcon logic', () => {
    const mockTranslations = {
      'asyncButton.save.waitingIcon': 'spinner-save',
      'asyncButton.save.successIcon': 'checkmark-save',
      'asyncButton.save.errorIcon':   'error-save',
    };

    const createWrapper = (props = {}, phase = ASYNC_BUTTON_STATES.ACTION) => {
      const mockExists = jest.fn((key) => !!mockTranslations[key]);
      const mockT = jest.fn((key) => mockTranslations[key] || key.split('.').pop());

      return mount(AsyncButton, {
        props:  { ...props, currentPhase: phase },
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
    };

    it('should use persistentIcon when true, overriding translations', async() => {
      const wrapper = createWrapper({
        icon: 'icon-prop', mode: 'save', persistentIcon: true
      });

      // Action phase
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Waiting phase
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.WAITING });
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Success phase
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.SUCCESS });
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Error phase
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.ERROR });
      expect(wrapper.vm.displayIcon).toBe('icon-prop');
    });

    it('should prioritize translated state icons when persistentIcon is false', async() => {
      const wrapper = createWrapper({
        icon: 'icon-prop', mode: 'save', persistentIcon: false
      });

      // Action phase - no translated actionIcon for 'save', so falls back to prop
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Waiting phase - translated waitingIcon exists
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.WAITING });
      expect(wrapper.vm.displayIcon).toBe('icon-spinner-save icon-spin');

      // Success phase - translated successIcon exists
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.SUCCESS });
      expect(wrapper.vm.displayIcon).toBe('icon-checkmark-save');

      // Error phase - translated errorIcon exists
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.ERROR });
      expect(wrapper.vm.displayIcon).toBe('icon-error-save');
    });

    it('should default to spinner if no icon prop and no translated icons for waiting state', async() => {
      const wrapper = createWrapper({ mode: 'custom', persistentIcon: false }); // No icon prop

      // Action phase - no icon
      expect(wrapper.vm.displayIcon).toBe('');

      // Waiting phase - no icon prop, no translated waitingIcon, should default to spinner
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.WAITING });
      expect(wrapper.vm.displayIcon).toBe('icon-spinner icon-spin');

      // Success phase - no icon
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.SUCCESS });
      expect(wrapper.vm.displayIcon).toBe('');
    });

    it('should use icon prop as fallback when persistentIcon is false and no translated state icons', async() => {
      // This is really an edge case where you would want to use your passed icon prop spin instead of the spinner icon
      const wrapper = createWrapper({
        icon: 'icon-prop', mode: 'custom', persistentIcon: false
      });

      // Action phase - no translated actionIcon for 'custom', falls back to prop
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Waiting phase - no translated waitingIcon for 'custom', falls back to prop + spin
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.WAITING });
      expect(wrapper.vm.displayIcon).toBe('icon-prop icon-spin');

      // Success phase - no translated successIcon for 'custom', falls back to prop
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.SUCCESS });
      expect(wrapper.vm.displayIcon).toBe('icon-prop');

      // Error phase - no translated errorIcon for 'custom', falls back to prop
      await wrapper.setProps({ currentPhase: ASYNC_BUTTON_STATES.ERROR });
      expect(wrapper.vm.displayIcon).toBe('icon-prop');
    });
  });
});
