import { mount } from '@vue/test-utils';
import ClusterLink from '@shell/components/formatter/ClusterLink.vue';

describe('component: ClusterLink', () => {
  const UNAVAILABLE_MACHINES_ICON_SELECTOR = '[data-testid="unavailable-machines-alert-icon"]';
  const TEMPLATE_UPGRADE_ICON_SELECTOR = '[data-testid="rke-template-upgrade-alert-icon"]';
  const CONDITION_HAS_ERROR_ICON_SELECTOR = '[data-testid="conditions-has-error-icon"]';

  describe('unavailable machines alert icon', () => {
    const testCases = [
      [undefined, false],
      [0, false],
      [1, true],
      [5, true],
    ];

    it.each(testCases)(
      'should show/hide properly based on on the number of unavailable machines',
      (unavailableMachines, expected) => {
        const wrapper = mount(ClusterLink, {
          props: {
            row: {
              hasError:           false,
              status:             {},
              unavailableMachines,
              rkeTemplateUpgrade: undefined
            },
            reference: 'any',
            value:     'any'
          }
        });
        const el = wrapper.find(UNAVAILABLE_MACHINES_ICON_SELECTOR);

        expect(el.exists()).toBe(expected);
      }
    );
  });

  describe('template upgrade alert icon', () => {
    const testCases = [
      [undefined, false],
      ['any', true],
    ];

    it.each(testCases)(
      'should show/hide properly based on rkeTemplateUpgrade',
      (rkeTemplateUpgrade, expected) => {
        const wrapper = mount(ClusterLink, {
          props: {
            row: {
              hasError:            false,
              status:              {},
              unavailableMachines: 0,
              rkeTemplateUpgrade
            },
            reference: 'any',
            value:     'any'
          }
        });
        const el = wrapper.find(TEMPLATE_UPGRADE_ICON_SELECTOR);

        expect(el.exists()).toBe(expected);
      }
    );
  });

  describe('conditions has error icon', () => {
    const MOCKED_CONDITIONS_1 = [{
      status: '', type: 'Ready', reason: 'Waiting', error: true // When the only existing error has a type "Ready" and reason "Waiting"
    }];
    const MOCKED_CONDITIONS_2 = [{
      status: 'any', type: 'any', error: true
    }];

    const testCases = [
      [[], false],
      [MOCKED_CONDITIONS_1, false],
      [MOCKED_CONDITIONS_2, true],
    ];

    it.each(testCases)(
      'should show/hide properly based on the status conditions',
      (conditions, expected) => {
        const wrapper = mount(ClusterLink, {
          props: {
            row: {
              hasError:            true,
              status:              { conditions },
              unavailableMachines: 0
            },
            reference: 'any',
            value:     'any'
          }
        });
        const el = wrapper.find(CONDITION_HAS_ERROR_ICON_SELECTOR);

        expect(el.exists()).toBe(expected);
      }
    );
  });
});
