import { mount, VueWrapper } from '@vue/test-utils';
import AsyncButton, { ASYNC_BUTTON_STATES } from '@shell/components/AsyncButton.vue';
import { announce } from '@shell/utils/aria-announce';

jest.mock('@shell/utils/aria-announce', () => ({ announce: jest.fn() }));

/**
 * A store whose i18n getters are backed by a real set of keys, so the announcement fallback
 * chain can be exercised the way it behaves against actual translations.
 */
const storeWithTranslations = (translations: Record<string, string>) => ({
  getters: {
    'i18n/exists': (key: string) => key in translations,
    'i18n/t':      (key: string, args?: Record<string, string>) => {
      const msg = translations[key];

      return args ? msg?.replace(/\{(\w+)\}/g, (_m, name) => args[name] ?? '') : msg;
    }
  }
});

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

    const [[cb]] = wrapper.emitted('click') as [[(...args: any[]) => void]];

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.WAITING);
    expect(wrapper.vm.isSpinning).toBe(true);
    expect(wrapper.vm.appearsDisabled).toBe(true);
    // testing cb function has been emitted
    expect(typeof cb).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    cb(true);

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

    const [[cb]] = wrapper.emitted('click') as [[(...args: any[]) => void]];

    expect(wrapper.emitted('click')).toHaveLength(1);
    // testing cb function has been emitted
    expect(typeof cb).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    cb(false);

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

    const [[cb]] = wrapper.emitted('click') as [[(...args: any[]) => void]];

    expect(wrapper.emitted('click')).toHaveLength(1);
    // testing cb function has been emitted
    expect(typeof cb).toBe('function');

    // trigger the cb function so that we test state changes on AsyncButton
    cb('cancelled');

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
    expect(item.find('i').attributes('alt')).toBeDefined();
  });

  describe('a11y: stable aria-label prevents VoiceOver re-reading on phase reset', () => {
    // VoiceOver and JAWS track the accessible name of the focused element in real time.
    // When the button's text changes (Applied → Apply after the timer), the screen reader
    // reads the new name — even though that re-announcement carries no new information.
    // Binding a stable aria-label anchored to the action-phase label keeps the accessible
    // name constant across all phases so focus tracking stays quiet.
    it('should expose the action-phase label as aria-label so the accessible name is stable', () => {
      const wrapper = mount(AsyncButton, {
        props:  { mode: 'apply' },
        global: {
          mocks: {
            $store: storeWithTranslations({
              'asyncButton.apply.action':  'Apply',
              'asyncButton.apply.waiting': 'Applying…',
              'asyncButton.apply.success': 'Applied',
            })
          }
        }
      });

      const button = wrapper.find('button');

      expect(button.attributes('aria-label')).toBe('Apply');

      // Simulate the full cycle: waiting → success → back to action
      wrapper.vm.phase = ASYNC_BUTTON_STATES.WAITING;
      expect(button.attributes('aria-label')).toBe('Apply');

      wrapper.vm.phase = ASYNC_BUTTON_STATES.SUCCESS;
      expect(button.attributes('aria-label')).toBe('Apply');

      wrapper.vm.phase = ASYNC_BUTTON_STATES.ACTION;
      expect(button.attributes('aria-label')).toBe('Apply');
    });

    it('should omit aria-label for icon-only modes so they keep their existing accessible name', () => {
      const wrapper = mount(AsyncButton, {
        props:  { mode: 'refresh' },
        global: { mocks: { $store: storeWithTranslations({ 'asyncButton.refresh.action': '' }) } }
      });

      expect(wrapper.find('button').attributes('aria-label')).toBeUndefined();
    });

    it('should let an explicitly passed aria-label take precedence over the stable label', () => {
      const wrapper = mount(AsyncButton, {
        props:  { mode: 'apply' },
        attrs:  { 'aria-label': 'custom-label' },
        global: { mocks: { $store: storeWithTranslations({ 'asyncButton.apply.action': 'Apply' }) } }
      });

      expect(wrapper.find('button').attributes('aria-label')).toBe('custom-label');
    });
  });

  describe('a11y: announcing phase changes to screen readers', () => {
    const GENERIC = {
      'asyncButton.announcement.waiting':           'In progress',
      'asyncButton.announcement.success':           'Succeeded',
      'asyncButton.announcement.error':             'Failed',
      'asyncButton.announcement.withLabel.waiting': '{label}: in progress',
      'asyncButton.announcement.withLabel.success': '{label}: succeeded',
      'asyncButton.announcement.withLabel.error':   '{label}: failed',
    };

    const mountWith = (translations: Record<string, string>, props = {}) => mount(AsyncButton, {
      props,
      global: { mocks: { $store: storeWithTranslations(translations) } }
    });

    const complete = async(wrapper: VueWrapper<InstanceType<typeof AsyncButton>>, success: boolean | 'cancelled' = true) => {
      await wrapper.find('button').trigger('click');
      // Wider than AsyncButtonCallback, because `done` also takes 'cancelled'
      (wrapper.emitted('click')![0][0] as (success: boolean | 'cancelled') => void)(success);
      await wrapper.vm.$nextTick();
    };

    beforeEach(() => {
      jest.useFakeTimers();
      (announce as jest.Mock).mockClear();
    });

    afterEach(() => jest.useRealTimers());

    it('should announce the label of the phase it moved to, when that label says something new', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.create.action':  'Create',
        'asyncButton.create.waiting': 'Creating&hellip;',
        'asyncButton.create.success': 'Created',
      }, { mode: 'create' });

      await complete(wrapper);

      expect(announce).toHaveBeenCalledWith('Creating&hellip;');
      expect(announce).toHaveBeenCalledWith('Created');
    });

    it('should prefer wording written for the mode over the visible label', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.refresh.action':              '',
        'asyncButton.refresh.success':             '',
        'asyncButton.refresh.successAnnouncement': 'Refreshed',
      }, { mode: 'refresh' });

      await complete(wrapper);

      expect(announce).toHaveBeenCalledWith('Refreshed');
    });

    // Refresh Group Memberships passes one label to every phase so the button doesn't resize,
    // which would otherwise have it announce its own name back at the user.
    it('should fall back to a generic status when every phase carries the same label', async() => {
      const wrapper = mountWith(GENERIC, {
        mode:         'refresh',
        actionLabel:  'Refresh Group Memberships',
        waitingLabel: 'Refresh Group Memberships',
        successLabel: 'Refresh Group Memberships',
        errorLabel:   'Refresh Group Memberships',
      });

      await complete(wrapper);

      expect(announce).toHaveBeenCalledWith('Refresh Group Memberships: in progress');
      expect(announce).toHaveBeenCalledWith('Refresh Group Memberships: succeeded');
    });

    it('should fall back to a bare generic status when there is no action label either', async() => {
      const wrapper = mountWith({ ...GENERIC, 'asyncButton.refresh.action': '' }, { mode: 'refresh' });

      await complete(wrapper);

      expect(announce).toHaveBeenCalledWith('Succeeded');
    });

    it('should announce the failure when the action does not succeed', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.create.action': 'Create',
        'asyncButton.create.error':  'Error',
      }, { mode: 'create' });

      await complete(wrapper, false);

      expect(announce).toHaveBeenCalledWith('Error');
    });

    it('should say nothing when the success timer drops the button back to its action phase', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.create.action':  'Create',
        'asyncButton.create.success': 'Created',
      }, { mode: 'create' });

      await complete(wrapper);
      (announce as jest.Mock).mockClear();

      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.phase).toBe(ASYNC_BUTTON_STATES.ACTION);
      expect(announce).not.toHaveBeenCalled();
    });

    it('should say nothing when the action is cancelled', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.create.action': 'Create',
      }, { mode: 'create', manual: true });

      await complete(wrapper, 'cancelled');

      expect(announce).not.toHaveBeenCalled();
    });

    it('should say nothing when announceStatus is turned off', async() => {
      const wrapper = mountWith({
        ...GENERIC,
        'asyncButton.create.action':  'Create',
        'asyncButton.create.success': 'Created',
      }, { mode: 'create', announceStatus: false });

      await complete(wrapper);

      expect(announce).not.toHaveBeenCalled();
    });

    // A newer @rancher/shell inside an older Rancher won't have the announcement keys. It
    // should stay quiet rather than read a raw translation key out loud.
    it('should say nothing rather than guess when the host has none of the keys', async() => {
      const wrapper = mountWith({}, { mode: 'create' });

      await complete(wrapper);

      expect(announce).toHaveBeenCalledWith('');
      expect((announce as jest.Mock).mock.calls.every(([msg]) => msg === '')).toBe(true);
    });
  });
});
