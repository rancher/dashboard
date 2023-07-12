import { mount } from '@vue/test-utils';
import ClusterLink from '@shell/components/formatter/ClusterLink.vue';
import '@shell/plugins/clean-tooltip-directive';

describe('component: ClusterLink', () => {
  const MOCKED_CONDITIONS_1 = [{
    status: '', type: 'Ready', reason: 'Waiting', error: true // When the only existing error has a type "Ready" and reason "Waiting"
  }];
  const MOCKED_CONDITIONS_2 = [{
    status: 'any', type: 'any', error: true
  }];
  const ERROR_ICON_SELECTOR = '[data-testid="conditions-alert-icon"]';

  const testCases = [
    [[], false],
    [MOCKED_CONDITIONS_1, false],
    [MOCKED_CONDITIONS_2, true],
  ];

  it.each(testCases)(
    'should show/hide the error icon properly based on the status conditions',
    (conditions, expected) => {
      const wrapper = mount(ClusterLink, {
        propsData: {
          row: {
            hasError:            true,
            status:              { conditions },
            unavailableMachines: 0
          },
          reference: 'any',
          value:     'any'
        }
      });
      const el = wrapper.find(ERROR_ICON_SELECTOR);

      expect(el.exists()).toBe(expected);
    }
  );
});
