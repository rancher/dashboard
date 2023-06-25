
import Aliyunecs from '@shell/machine-config/aliyunecs.vue';
import { getters } from '@shell/store/aliyun.js';
import { mount } from '@vue/test-utils';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import { VCleanTooltip } from '@shell/plugins/clean-tooltip-directive';

describe('component: aliyunecs', () => {
  it('should have input and select', () => {
    const wrapper = mount(Aliyunecs, {
      stubs:     { portal: true },
      propsData: {
        uuid:         '1234',
        credentialId: 'credentialId',
        cluster:      {},
        value:        { systemDiskSize: '' },
      },
      data() {
        return { systemDiskSize: '', defaultValue: getters.defaultValue() };
      },
      directives: { VCleanTooltip, cleanHtmlDirective },
      mocks:      {
        $fetchState: {
          pending: false, error: true, timestamp: Date.now()
        },
        $route: { query: {}, hash: '#labels' },
        $store: {
          dispatch: () => jest.fn(),
          getters:  {
            'aliyun/defaultValue': getters.defaultValue(),
            'i18n/t':              t => t,
          }
        }
      }
    });

    const selectWraps = wrapper.findAll('.labeled-select');
    const inputWraps = wrapper.findAll('.labeled-input');

    expect(selectWraps).toHaveLength(13);
    expect(inputWraps).toHaveLength(4);
  });
});
