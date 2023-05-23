import { mount } from '@vue/test-utils';
import ForceUpdateMachinePlanDialog from '@shell/dialog/ForceUpdateMachinePlanDialog.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: ForceUpdateMachinePlanDialog', () => {
  it('there should be a prompt message', () => {
    const wrapper = mount(ForceUpdateMachinePlanDialog, {
      propsData: {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      directives: { cleanHtmlDirective },
      data() {
        return { toUpdate: [] };
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.resolve({})),
          getters:  { 'i18n/t': t => t, 'i18n/exists': k => k }
        }
      },
    });

    const inputWrap = wrapper.find('[data-testid="card-body-slot"]');

    expect(inputWrap.text()).toBe('forceUpdateMachinePlan.attemptingToUpdate');
  });

  it('should be update Machine Plan Secret', async() => {
    const buttonDone = jest.fn();
    const close = jest.fn();
    const localThis = {
      updateMachinePlanSecret: jest.fn(),
      removeFinalizers:        true,
      toUpdate:                [{}],
      close,
    };

    await ForceUpdateMachinePlanDialog.methods.confirmUpdate.call(localThis, buttonDone);

    expect(localThis.updateMachinePlanSecret).toHaveBeenCalledTimes(1);
  });
});
