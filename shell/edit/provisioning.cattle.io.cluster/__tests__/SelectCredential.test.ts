import { defineComponent, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import { NORMAN } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';

// Renders every slot SelectCredential provides, and a marker for the default footer
const CruResourceStub = defineComponent({
  name:  'CruResource',
  props: {
    validationPassed: { type: Boolean, default: true },
    resource:         { type: [Object, String], default: null },
    errors:           { type: Array, default: () => [] },
    mode:             { type: String, default: '' },
  },
  emits:    ['finish', 'cancel', 'error'],
  template: `
    <div>
      <slot />
      <div data-testid="footer-prefix"><slot name="footer-prefix" /></div>
      <div data-testid="form-footer"><slot name="form-footer"><span data-testid="default-footer" /></slot></div>
    </div>
  `,
});

const ExtensionSection = defineComponent({
  name:  'ExtensionSection',
  props: {
    value:        { type: String, default: null },
    mode:         { type: String, default: null },
    provider:     { type: String, default: null },
    registerSave: { type: Function, default: null },
    registerBack: { type: Function, default: null },
    extra:        { type: String, default: null },
  },
  emits:    ['update:value', 'validationChanged', 'canGoBackChanged'],
  template: '<div data-testid="extension-section" />',
});

const CloudCredentialForm = defineComponent({ template: '<div data-testid="cloud-credential-form" />' });

const createWrapper = (props: Record<string, any> = {}, data: Record<string, any> = {}) => {
  return mount(SelectCredential, {
    props: {
      showingForm: false,
      mode:        _CREATE,
      provider:    'testprovider',
      ...props,
    },
    data:   () => data,
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          dispatch: jest.fn(),
          getters:  {
            'plugins/credentialDriverFor':                (name: string) => name,
            'type-map/hasCustomCloudCredentialComponent': () => false,
            'type-map/importCloudCredential':             () => CloudCredentialForm,
          },
        },
      },
      stubs: {
        CruResource:       CruResourceStub,
        Loading:           true,
        LabeledSelect:     true,
        Banner:            true,
        NameNsDescription: true,
      },
    },
  });
};

const createExtensionWrapper = (props: Record<string, any> = {}) => createWrapper({ extensionComponent: ExtensionSection, ...props });

type Wrapper = ReturnType<typeof createWrapper>;
type RegisterFn = (fn: (...args: any[]) => any) => void;

// What an extension component does with its registerSave and registerBack props
const registerSave = (wrapper: Wrapper, fn: () => Promise<any>) => (wrapper.findComponent(ExtensionSection).props('registerSave') as RegisterFn)(fn);
const registerBack = (wrapper: Wrapper, fn: () => void) => (wrapper.findComponent(ExtensionSection).props('registerBack') as RegisterFn)(fn);

describe('component: SelectCredential', () => {
  describe('with an extension component', () => {
    it('should not fetch rancher cloud credentials', async() => {
      const dispatch = jest.fn();
      const vm = { extensionComponent: ExtensionSection, $store: { dispatch } };

      await (SelectCredential as any).fetch.call(vm);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should render the extension component', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.findComponent(ExtensionSection).exists()).toBe(true);
    });

    it('should not render the cloud credential select', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.find('[data-testid="cluster-prov-select-credential"]').exists()).toBe(false);
    });

    it('should pass extensionComponentProps to the extension component', () => {
      const wrapper = createExtensionWrapper({ extensionComponentProps: { extra: 'extra-prop' } });

      expect(wrapper.findComponent(ExtensionSection).props('extra')).toBe('extra-prop');
    });

    it.each<['mode' | 'provider', string]>([
      ['mode', _CREATE],
      ['provider', 'testprovider'],
    ])('should pass %p to the extension component', (prop, expected) => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.findComponent(ExtensionSection).props(prop)).toBe(expected);
    });

    it.each([
      ['nothing is picked', undefined, null],
      ['a value is picked', 'ns/credential', 'ns/credential'],
    ])('should pass the current value to the extension component when %s', (_, value, expected) => {
      const wrapper = createExtensionWrapper({ value });

      expect(wrapper.findComponent(ExtensionSection).props('value')).toBe(expected);
    });

    it('should give the extension component a registerSave function', () => {
      const wrapper = createExtensionWrapper();

      expect(typeof wrapper.findComponent(ExtensionSection).props('registerSave')).toBe('function');
    });

    it('should give the extension component a registerBack function', () => {
      const wrapper = createExtensionWrapper();

      expect(typeof wrapper.findComponent(ExtensionSection).props('registerBack')).toBe('function');
    });

    it('should pass an empty resource to CruResource', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.findComponent(CruResourceStub).props('resource')).toStrictEqual({});
    });

    it('should emit update:value with the value from the extension component', async() => {
      const wrapper = createExtensionWrapper();

      wrapper.findComponent(ExtensionSection).vm.$emit('update:value', 'ns/credential');
      await nextTick();

      expect(wrapper.emitted('update:value')).toStrictEqual([['ns/credential']]);
    });

    it('should emit update:value with null when the extension component clears its value', async() => {
      const wrapper = createExtensionWrapper({ value: 'ns/credential' });

      wrapper.findComponent(ExtensionSection).vm.$emit('update:value', null);
      await nextTick();

      expect(wrapper.emitted('update:value')).toStrictEqual([[null]]);
    });

    it('should show the step footer while there is no value', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.find('[data-testid="default-footer"]').exists()).toBe(true);
    });

    it('should hide the step footer once the extension component emits a value', async() => {
      const wrapper = createExtensionWrapper();

      wrapper.findComponent(ExtensionSection).vm.$emit('update:value', 'ns/credential');
      await nextTick();

      expect(wrapper.find('[data-testid="default-footer"]').exists()).toBe(false);
    });

    it('should fail validation until the extension component reports it is valid', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(false);
    });

    it.each([true, false])('should use the validation reported by the extension component (%p)', async(valid) => {
      const wrapper = createExtensionWrapper();

      wrapper.findComponent(ExtensionSection).vm.$emit('validationChanged', !valid);
      await nextTick();
      wrapper.findComponent(ExtensionSection).vm.$emit('validationChanged', valid);
      await nextTick();

      expect(wrapper.findComponent(CruResourceStub).props('validationPassed')).toBe(valid);
    });

    it('should not show the Select Existing button by default', () => {
      const wrapper = createExtensionWrapper();

      expect(wrapper.find('[data-testid="footer-prefix"] button').exists()).toBe(false);
    });

    it('should show the Select Existing button when the extension component can go back', async() => {
      const wrapper = createExtensionWrapper();

      wrapper.findComponent(ExtensionSection).vm.$emit('canGoBackChanged', true);
      await nextTick();

      expect(wrapper.find('[data-testid="footer-prefix"] button').exists()).toBe(true);
    });

    it('should call the registered back function when Select Existing is clicked', async() => {
      const wrapper = createExtensionWrapper();
      const back = jest.fn();

      registerBack(wrapper, back);
      wrapper.findComponent(ExtensionSection).vm.$emit('canGoBackChanged', true);
      await nextTick();
      await wrapper.find('[data-testid="footer-prefix"] button').trigger('click');

      expect(back).toHaveBeenCalledWith();
    });

    describe('when continue is clicked', () => {
      const clickContinue = async(wrapper: ReturnType<typeof createWrapper>, btnCb: jest.Mock) => {
        wrapper.findComponent(CruResourceStub).vm.$emit('finish', btnCb);
        await flushPromises();
      };

      it('should fail when no save function is registered', async() => {
        const wrapper = createExtensionWrapper();
        const btnCb = jest.fn();

        await clickContinue(wrapper, btnCb);

        expect(btnCb).toHaveBeenCalledWith(false);
      });

      it('should call the registered save function', async() => {
        const wrapper = createExtensionWrapper();
        const save = jest.fn().mockResolvedValue([]);

        registerSave(wrapper, save);
        await clickContinue(wrapper, jest.fn());

        expect(save).toHaveBeenCalledWith();
      });

      it.each([
        ['an empty list', []],
        ['undefined', undefined],
      ])('should succeed when the save function resolves to %s', async(_, result) => {
        const wrapper = createExtensionWrapper();
        const btnCb = jest.fn();

        registerSave(wrapper, jest.fn().mockResolvedValue(result));
        await clickContinue(wrapper, btnCb);

        expect(btnCb).toHaveBeenCalledWith(true);
      });

      it('should fail when the save function resolves to errors', async() => {
        const wrapper = createExtensionWrapper();
        const btnCb = jest.fn();

        registerSave(wrapper, jest.fn().mockResolvedValue(['save failed']));
        await clickContinue(wrapper, btnCb);

        expect(btnCb).toHaveBeenCalledWith(false);
      });

      it('should show the errors the save function resolves to', async() => {
        const wrapper = createExtensionWrapper();

        registerSave(wrapper, jest.fn().mockResolvedValue(['save failed']));
        await clickContinue(wrapper, jest.fn());

        expect(wrapper.findComponent(CruResourceStub).props('errors')).toStrictEqual(['save failed']);
      });

      it('should fail when the save function rejects', async() => {
        const wrapper = createExtensionWrapper();
        const btnCb = jest.fn();

        registerSave(wrapper, jest.fn().mockRejectedValue(new Error('save rejected')));
        await clickContinue(wrapper, btnCb);

        expect(btnCb).toHaveBeenCalledWith(false);
      });

      it('should show the error the save function rejects with', async() => {
        const wrapper = createExtensionWrapper();
        const error = new Error('save rejected');

        registerSave(wrapper, jest.fn().mockRejectedValue(error));
        await clickContinue(wrapper, jest.fn());

        expect(wrapper.findComponent(CruResourceStub).props('errors')).toStrictEqual([error]);
      });
    });
  });

  describe('without an extension component', () => {
    it('should fetch rancher cloud credentials', async() => {
      const dispatch = jest.fn().mockResolvedValue([]);
      const vm = {
        extensionComponent:  null,
        value:               null,
        driverName:          'digitalocean',
        filteredCredentials: [],
        $store:              { dispatch, getters: { 'plugins/credentialFieldForDriver': () => 'digitalocean' } },
      };

      await (SelectCredential as any).fetch.call(vm);

      expect(dispatch).toHaveBeenCalledWith('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
    });

    it('should render the cloud credential select', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="cluster-prov-select-credential"]').exists()).toBe(true);
    });

    it('should not render an extension component', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(ExtensionSection).exists()).toBe(false);
    });

    it('should pass the new cloud credential to CruResource', () => {
      const newCredential = { type: NORMAN.CLOUD_CREDENTIAL };
      const wrapper = createWrapper({}, { newCredential });

      expect(wrapper.findComponent(CruResourceStub).props('resource')).toStrictEqual(newCredential);
    });

    it('should show the Select Existing button while creating a new credential', () => {
      const wrapper = createWrapper({}, { credentialId: '_NEW', newCredential: { type: NORMAN.CLOUD_CREDENTIAL } });

      expect(wrapper.find('[data-testid="footer-prefix"] button').exists()).toBe(true);
    });

    it('should not show the Select Existing button while selecting a credential', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="footer-prefix"] button').exists()).toBe(false);
    });

    it('should return to the credential select when Select Existing is clicked', async() => {
      const wrapper = createWrapper({}, { credentialId: '_NEW', newCredential: { type: NORMAN.CLOUD_CREDENTIAL } });

      await wrapper.find('[data-testid="footer-prefix"] button').trigger('click');

      expect(wrapper.find('[data-testid="cluster-prov-select-credential"]').exists()).toBe(true);
    });

    it('should hide the step footer when a credential is picked', () => {
      const wrapper = createWrapper({ value: 'cattle-global-data:cc-1' });

      expect(wrapper.find('[data-testid="default-footer"]').exists()).toBe(false);
    });
  });
});
