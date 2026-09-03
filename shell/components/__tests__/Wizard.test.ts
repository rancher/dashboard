import { shallowMount, VueWrapper } from '@vue/test-utils';
import Wizard from '@shell/components/Wizard.vue';
import { RcButton } from '@components/RcButton';
import AsyncButton from '@shell/components/AsyncButton.vue';

describe('component: Wizard', () => {
  let wrapper: VueWrapper<InstanceType<typeof Wizard>>;
  const steps = [
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
      steps,
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

    const rcButtons = wrapper.findAllComponents(RcButton);

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

    const rcButtons = wrapper.findAllComponents(RcButton);

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
});
