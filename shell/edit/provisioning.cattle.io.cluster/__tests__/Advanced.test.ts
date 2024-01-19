/* eslint-disable jest/no-hooks */
import { mount, Wrapper } from '@vue/test-utils';
import Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced.vue';
import { _YAML, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';
import { PROV_CLUSTER, VERSION_CLUSTER } from '@shell/edit/provisioning.cattle.io.cluster/__tests__/utils/cluster';

describe('component: Advanced', () => {
  let wrapper: Wrapper<InstanceType<typeof Advanced>>;

  const mountOptions = {
    propsData: {
      value:           {},
      mode:            _VIEW,
      haveArgInfo:     true,
      selectedVersion: VERSION_CLUSTER
    },
    mocks: {
      $store: {
        getters: {
          currentStore:              () => 'current_store',
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  jest.fn(),
          'i18n/exists':             jest.fn(),
        }
      },
      $route:  { query: { AS: _YAML } },
      $router: { applyQuery: jest.fn() },
    }
  };

  describe('cluster configurations', () => {
    it(`should support empty machineSelectorConfig`, () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.machineSelectorConfig = [];

      mountOptions.propsData.value = value;

      wrapper = mount(
        Advanced,
        mountOptions
      );

      const inputElem = wrapper.find('[data-testid="array-list-box0"]').element as HTMLElement;

      expect(inputElem).toBeUndefined();
    });

    describe(`'protect-kernel-defaults'`, () => {
      it(`should show value from machineGlobalConfig`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineGlobalConfig['protect-kernel-defaults'] = true;
        value.spec.rkeConfig.machineSelectorConfig = [{
          config:               {},
          machineLabelSelector: {
            matchExpressions: [{
              key:      'foo',
              operator: 'In',
              values:   ['bar'],
            }],
            matchLabels: { foo1: 'bar1' },
          }
        }];

        mountOptions.propsData.mode = _VIEW;
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const checkbox = wrapper.find('[data-testid="protect-kernel-defaults"]').find('[type="checkbox"]').element as HTMLInputElement;

        expect(checkbox.value).toBe('true');
      });

      it(`should show value from machineSelectorConfig.config`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineGlobalConfig['protect-kernel-defaults'] = false;
        value.spec.rkeConfig.machineSelectorConfig = [{
          config:               {},
          machineLabelSelector: {
            config:           { 'protect-kernel-defaults': true },
            matchExpressions: [{
              key:      'foo',
              operator: 'In',
              values:   ['bar'],
            }],
            matchLabels: { foo1: 'bar1' },
          }
        }];

        mountOptions.propsData.mode = _VIEW;
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const checkbox = wrapper.find('[data-testid="protect-kernel-defaults"]').find('[type="checkbox"]').element as HTMLInputElement;

        expect(checkbox.value).toBe('true');
      });
    });
  });
});
