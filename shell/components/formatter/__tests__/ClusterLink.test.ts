import { mount } from '@vue/test-utils';
import ClusterLink from '@shell/components/formatter/ClusterLink.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import { cleanTooltipDirective } from '@shell/plugins/clean-tooltip-directive';

describe('component: Conditions', () => {
  const MOCKED_CONDITIONS_1 = [{
    status: '', type: 'Ready', reason: 'Waiting', error: true // When there's only one error with "Ready" type and "Waiting" reason
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
        },
        directives: { cleanHtmlDirective, cleanTooltipDirective }
      });
      const el = wrapper.find(ERROR_ICON_SELECTOR);

      expect(el.exists()).toBe(expected);
    }
  );
});
