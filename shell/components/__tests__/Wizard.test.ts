import { shallowMount, mount, VueWrapper } from '@vue/test-utils';
import Wizard from '@shell/components/Wizard.vue';
import { RcButton } from '@components/RcButton';
import AsyncButton from '@shell/components/AsyncButton.vue';

describe('component: Wizard', () => {
  let wrapper: VueWrapper<InstanceType<typeof Wizard>>;
  const a11ySteps = [
    {
      name:  'step1',
      label: 'Step 1',
      ready: true
    },
    {
      name:  'step2',
      label: 'Step 2',
      ready: true
    }
  ];

  const mockT = jest.fn().mockReturnValue('some-string');

  const mountOptions = {
    props: {
      steps:         a11ySteps,
      initStepIndex: 0,
      editFirstStep: true
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':      mockT,
            'i18n/exists': jest.fn().mockReturnValue(true)
          }
        },
        t: mockT
      }
    }
  };

  it('a11y: footer buttons Cancel and Next should render with tabindex="0" for keyboard focus compatibility on step 1', () => {
    wrapper = shallowMount(Wizard, {
      ...mountOptions,
      props: {
        ...mountOptions.props,
        initStepIndex: 0 // First step: renders Cancel and Next
      }
    });

    // Scope to the footer so the step-sequence nav buttons aren't counted.
    const rcButtons = wrapper.find('#wizard-footer-controls').findAllComponents(RcButton);

    expect(rcButtons.length).toBe(2);
    // First is Cancel, second is Next
    expect(rcButtons.at(0)?.attributes('tabindex')).toStrictEqual('0');
    expect(rcButtons.at(1)?.attributes('tabindex')).toStrictEqual('0');
  });

  it('a11y: footer buttons Cancel and Back should render with tabindex="0" on step 2', () => {
    wrapper = shallowMount(Wizard, {
      ...mountOptions,
      props: {
        ...mountOptions.props,
        initStepIndex: 1 // Second/Final step: renders Cancel, Back, and Finish
      }
    });

    // Scope to the footer so the step-sequence nav buttons aren't counted.
    const rcButtons = wrapper.find('#wizard-footer-controls').findAllComponents(RcButton);

    expect(rcButtons.length).toBe(2);
    // First is Cancel, second is Back
    expect(rcButtons.at(0)?.attributes('tabindex')).toStrictEqual('0');
    expect(rcButtons.at(1)?.attributes('tabindex')).toStrictEqual('0');
  });

  it('a11y: footer button Finish should render with tabIndex=0 for keyboard focus compatibility on the final step', () => {
    wrapper = shallowMount(Wizard, {
      ...mountOptions,
      props: {
        ...mountOptions.props,
        initStepIndex: 1 // Second/Final step: renders Cancel, Back, and Finish
      }
    });

    const finishBtn = wrapper.findComponent(AsyncButton);

    expect(finishBtn.exists()).toBe(true);
    expect(finishBtn.props('tabIndex')).toStrictEqual(0);
  });

  const steps = [
    {
      name: 'stepOne', label: 'One', ready: true
    },
    {
      name: 'stepTwo', label: 'Two', ready: false
    },
    {
      name: 'stepThree', label: 'Three', ready: true
    },
  ];

  const mountWizard = () => mount(Wizard, {
    props: {
      steps,
      editFirstStep: true
    },

    attachTo: document.body,

    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':      jest.fn(),
            'i18n/exists': jest.fn(),
          },
        },
        $route:  { query: {} },
        $router: { applyQuery: jest.fn() },
      },
    },
  });

  const stepButtons = (wrapper: any) => wrapper.findAll('.steps li.step button');

  it('should present the steps as a list rather than as tabs', () => {
    const wrapper = mountWizard();

    // A wizard step is not a tab: it is one of an ordered sequence, gated on
    // the steps before it, and only the current one has a panel.
    expect(wrapper.find('.steps').element.tagName).toBe('OL');
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
    expect(wrapper.find('[role="tab"]').exists()).toBe(false);
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);
    expect(wrapper.find('[aria-controls]').exists()).toBe(false);
  });

  it('should name the step list for assistive technology', () => {
    const wrapper = mountWizard();

    expect(wrapper.find('nav.step-sequence').attributes('aria-label')).toContain('wizard.stepList');
  });

  it('should mark the step the user is on as the current one', async() => {
    const wrapper = mountWizard();
    // aria-current belongs on the control that takes focus, the way the
    // breadcrumb pattern puts aria-current="page" on the anchor.
    const current = () => stepButtons(wrapper).map((b: any) => b.attributes('aria-current'));

    expect(current()).toStrictEqual(['step', undefined, undefined]);

    await stepButtons(wrapper)[1].trigger('click');

    expect(current()).toStrictEqual([undefined, 'step', undefined]);
  });

  it('should disable a step that cannot be reached yet', () => {
    const wrapper = mountWizard();

    // stepTwo is not ready, which is what puts stepThree out of reach. A
    // disabled button says so, where a class alone only said it to the eye.
    expect(stepButtons(wrapper).map((b: any) => b.attributes('disabled') !== undefined))
      .toStrictEqual([false, false, true]);
  });

  it('should move to a step when its button is pressed', async() => {
    const wrapper = mountWizard();

    await stepButtons(wrapper)[1].trigger('click');

    expect(wrapper.find('.steps li.step.active').attributes('id')).toBe('stepTwo');
  });

  it('should hide the dividers between steps from assistive technology', () => {
    const wrapper = mountWizard();

    expect(wrapper.findAll('.steps li.divider').map((d: any) => d.attributes('aria-hidden')))
      .toStrictEqual(['true', 'true']);
  });
});
