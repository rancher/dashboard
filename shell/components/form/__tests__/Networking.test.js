import Networking from '@shell/components/form/Networking.vue';
import { _CREATE } from '@shell/config/query-params';
import { mount } from '@vue/test-utils';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: Networking', () => {
  it('should be display input when enable flat network', () => {
    const wrapper = mount(Networking, {
      propsData: {
        namespace: 'default',
        value:     {},
        mode:      _CREATE,
      },
      data() {
        return { allowVlansubnet: true };
      },
      directives: { cleanHtmlDirective },
      mocks:      {
        $store: {
          getters:  { 'i18n/t': (t) => t },
          dispatch: jest.fn(() => Promise.resolve())
        }
      }
    });

    const selectWraps = wrapper.findAll('.labeled-select');
    const inputWraps = wrapper.findAll('.labeled-input');

    expect(selectWraps).toHaveLength(4);
    expect(inputWraps).toHaveLength(4);
  });

  it('should be display Scaling and Upgrade Policy info', () => {
    const wrapper = mount(Networking, {
      propsData: {
        namespace: 'default',
        value:     {},
        mode:      _CREATE,
      },
      data() {
        return { allowVlansubnet: true };
      },
      directives: { cleanHtmlDirective },
      mocks:      {
        $store: {
          getters:  { 'i18n/t': (t) => t },
          dispatch: jest.fn(() => Promise.resolve())
        }
      }
    });

    const tipWrapper = wrapper.find('.tip');
    const textWrapper = tipWrapper.find('.text');

    expect(textWrapper.text()).toBe('workload.networking.vlansubnet.tip');
  });
});
