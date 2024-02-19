/* eslint-disable jest/no-hooks */
import { mount, Wrapper } from '@vue/test-utils';
import Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced.vue';
import { _EDIT, _YAML, _VIEW } from '@shell/config/query-params';
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

    it(`should support undefined machineSelectorConfig.config`, () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.machineSelectorConfig[0].config = undefined;

      mountOptions.propsData.value = value;

      wrapper = mount(
        Advanced,
        mountOptions
      );

      const inputElem = wrapper.find('[data-testid="array-list-box0"]').element as HTMLElement;

      expect(inputElem.textContent).toContain('—');
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

    describe(`'kubelet-arg'`, () => {
      describe.each([
        _VIEW,
        _EDIT
      ])(`mode: %s`, (mode) => {
        it(`should show value from machineSelectorConfig only`, () => {
          const value = clone(PROV_CLUSTER);

          value.spec.rkeConfig.machineSelectorConfig[0].config['kubelet-arg'] = ['config-from-machineSelectorConfig'];

          mountOptions.propsData.mode = mode;
          mountOptions.propsData.value = value;

          wrapper = mount(
            Advanced,
            mountOptions
          );

          const globalContainer = wrapper.find('[data-testid="global-kubelet-arg"]');
          const selectorContainer = wrapper.find('[data-testid="selector-kubelet-arg"]');

          const globalInputElem = globalContainer.element as HTMLInputElement;
          const selectorInputElem = selectorContainer.find('[data-testid="input-0"]').element as HTMLInputElement;

          expect(globalInputElem).toBeUndefined();
          expect(selectorInputElem.value).toContain('config-from-machineSelectorConfig');
        });

        it(`should show value from machineGlobalConfig only`, () => {
          const value = clone(PROV_CLUSTER);

          value.spec.rkeConfig.machineGlobalConfig['kubelet-arg'] = ['config-from-machineGlobalConfig'];

          mountOptions.propsData.mode = mode;
          mountOptions.propsData.value = value;

          wrapper = mount(
            Advanced,
            mountOptions
          );

          const globalContainer = wrapper.find('[data-testid="global-kubelet-arg"]');
          const selectorContainer = wrapper.find('[data-testid="selector-kubelet-arg"]');

          const selectorInputElem = selectorContainer.element as HTMLInputElement;
          const globalInputElem = globalContainer.find('[data-testid="input-0"]').element as HTMLInputElement;

          expect(selectorInputElem).toBeUndefined();
          expect(globalInputElem.value).toContain('config-from-machineGlobalConfig');
        });

        it(`should show value from machineGlobalConfig and machineSelectorConfig`, () => {
          const value = clone(PROV_CLUSTER);

          value.spec.rkeConfig.machineSelectorConfig[0].config['kubelet-arg'] = ['config-from-machineSelectorConfig'];
          value.spec.rkeConfig.machineGlobalConfig['kubelet-arg'] = ['config-from-machineGlobalConfig'];

          mountOptions.propsData.mode = mode;
          mountOptions.propsData.value = value;

          wrapper = mount(
            Advanced,
            mountOptions
          );

          const globalContainer = wrapper.find('[data-testid="global-kubelet-arg"]');
          const selectorContainer = wrapper.find('[data-testid="selector-kubelet-arg"]');

          const selectorInputElem = selectorContainer.find('[data-testid="input-0"]').element as HTMLInputElement;
          const globalInputElem = globalContainer.find('[data-testid="input-0"]').element as HTMLInputElement;

          expect(selectorInputElem.value).toContain('config-from-machineSelectorConfig');
          expect(globalInputElem.value).toContain('config-from-machineGlobalConfig');
        });
      });

      it(`mode: edit, should show empty value'`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineSelectorConfig[0].config['kubelet-arg'] = [];
        value.spec.rkeConfig.machineGlobalConfig['kubelet-arg'] = [];

        mountOptions.propsData.mode = 'view';
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const globalContainer = wrapper.find('[data-testid="global-kubelet-arg"]');
        const selectorContainer = wrapper.find('[data-testid="selector-kubelet-arg"]');

        const selectorInputElem = selectorContainer.find('[data-testid="input-0"]').element as HTMLInputElement;
        const globalInputElem = globalContainer.find('[data-testid="input-0"]').element as HTMLInputElement;

        const emptyCharacter = wrapper.find('.info-box').find('.text-muted').element;

        const globalAddButton = globalContainer.find('[data-testid="array-list-button"]').element;
        const selectorAddButton = selectorContainer.find('[data-testid="array-list-button"]').element;

        const removeButtonConfig = globalContainer.find('[data-testid="remove-item-0"]').element;

        expect(selectorInputElem).toBeUndefined();
        expect(globalInputElem).toBeUndefined();
        expect(globalAddButton).toBeUndefined();
        expect(selectorAddButton).toBeUndefined();
        expect(emptyCharacter).toBeDefined();
        expect(removeButtonConfig).toBeFalsy();
      });

      it(`mode: view, should show empty value'`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineSelectorConfig[0].config['kubelet-arg'] = [];
        value.spec.rkeConfig.machineGlobalConfig['kubelet-arg'] = [];

        mountOptions.propsData.mode = 'edit';
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const globalContainer = wrapper.find('[data-testid="global-kubelet-arg"]');
        const selectorContainer = wrapper.find('[data-testid="selector-kubelet-arg"]');

        const selectorInputElem = selectorContainer.find('[data-testid="input-0"]').element as HTMLInputElement;
        const globalInputElem = globalContainer.find('[data-testid="input-0"]').element as HTMLInputElement;

        const emptyCharacter = wrapper.find('.info-box').find('.text-muted').element;

        const globalAddButton = globalContainer.find('[data-testid="array-list-button"]').element;
        const selectorAddButton = selectorContainer.find('[data-testid="array-list-button"]').element;

        const removeButtonConfig = globalContainer.find('[data-testid="remove-item-0"]').element;

        expect(selectorInputElem).toBeUndefined();
        expect(globalInputElem).toBeUndefined();
        expect(globalAddButton).toBeDefined();
        expect(selectorAddButton).toBeDefined();
        expect(emptyCharacter).toBeUndefined();
        expect(removeButtonConfig).toBeFalsy();
      });
    });
  });
});
