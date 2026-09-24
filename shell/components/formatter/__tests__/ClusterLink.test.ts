import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterLink from '@shell/components/formatter/ClusterLink.vue';

describe('component: ClusterLink', () => {
  const UNAVAILABLE_MACHINES_ICON_SELECTOR = '[data-testid="unavailable-machines-alert-icon"]';
  const CONDITION_HAS_ERROR_ICON_SELECTOR = '[data-testid="conditions-has-error-icon"]';

  describe('unavailable machines alert icon', () => {
    const testCases: [number | undefined, boolean][] = [
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
              hasError: false,
              status:   {},
              unavailableMachines,
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

  describe('the pin', () => {
    const PIN_SELECTOR = '[data-testid="cluster-row-pin"]';

    const mountLink = (row: any) => mount(ClusterLink, {
      props: {
        row, reference: 'any', value: 'prod'
      },
      global: { plugins: [createStore({})] },
    });

    const row = (over = {}) => ({
      nameDisplay: 'prod', hasError: false, status: {}, isLocal: false, pinned: false, pin: jest.fn(), unpin: jest.fn(), ...over
    });

    it('should offer a pin for a cluster that can be pinned', () => {
      expect(mountLink(row()).find(PIN_SELECTOR).exists()).toBe(true);
    });

    it('should offer no pin for a row that cannot pin itself', () => {
      expect(mountLink({ hasError: false, status: {} }).find(PIN_SELECTOR).exists()).toBe(false);
    });

    // Whatever else the cell has to say about the cluster comes first: the pin is the one control in it.
    it('should come after the error icons', () => {
      const wrapper = mountLink(row({
        hasError: true,
        status:   {
          conditions: [{
            status: 'any', type: 'any', error: true
          }]
        },
        unavailableMachines: 2,
      }));

      const order = wrapper.findAll('.cluster-link > *').map((el) => el.attributes('data-testid'));

      expect(order.indexOf('cluster-row-pin')).toBe(order.length - 1);
      expect(order).toContain('conditions-has-error-icon');
      expect(order).toContain('unavailable-machines-alert-icon');
    });
  });
});
