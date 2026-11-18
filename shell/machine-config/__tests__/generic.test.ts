import Generic from '@shell/machine-config/generic.vue';
import { shallowMount } from '@vue/test-utils';
import { MANAGEMENT } from '@shell/config/types';
import { NODE_DRIVER_FIELD_HINTS } from '@shell/config/labels-annotations';
import { Banner } from '@components/Banner';
import Questions from '@shell/components/Questions';

/**
 * `generic.vue` is a plain-JS SFC built on the untyped `create-edit-view` mixin, so
 * `vue-tsc` cannot infer its data/methods and `wrapper.vm.$nextTick` resolves to `never`.
 * Describe just the surface these tests drive.
 * Remove this once the component is converted to `<script lang="ts"> defineComponent`.
 */
interface GenericInstance {
  $nextTick(): Promise<void>;
  fields: Record<string, { type: string }>;
  errors: Array<{ message: string }>;
}

const asGeneric = (wrapper: { vm: unknown }): GenericInstance => wrapper.vm as GenericInstance;

const PROVIDER = 'testdriver';

const buildFields = () => ({
  zone:       { type: 'string' },
  diskSize:   { type: 'string' },
  enginePort: { type: 'string' },
});

const mockedStore = (fieldHints: Record<string, { type: string }> | null = null) => {
  const driver = { metadata: { annotations: { ...(fieldHints ? { [NODE_DRIVER_FIELD_HINTS]: JSON.stringify(fieldHints) } : {}) } } };

  return {
    getters: {
      'i18n/t':                           (key: string) => key,
      t:                                  (key: string) => key,
      'plugins/fieldsForDriver':          () => Promise.resolve(buildFields()),
      'plugins/credentialFieldForDriver': () => PROVIDER,
      'plugins/fieldNamesForDriver':      () => [],
      'rancher/schemaFor':                () => null,
    },
    dispatch: jest.fn((_action: string, args: any) => {
      if (args?.type === MANAGEMENT.NODE_DRIVER && args?.id === PROVIDER) {
        return Promise.resolve(driver);
      }

      return Promise.resolve(null);
    }),
  };
};

const mountAndFetch = async(storeOverrides: Record<string, any> = {}) => {
  const store = {
    ...mockedStore(null),
    ...storeOverrides,
    getters: {
      ...mockedStore(null).getters,
      ...(storeOverrides.getters || {}),
    },
  };

  if (storeOverrides.dispatch) {
    store.dispatch = storeOverrides.dispatch;
  }

  const wrapper = shallowMount(Generic, {
    props: {
      credentialId: 'cattle-global-data:cc-12345',
      provider:     PROVIDER,
      value:        { metadata: { namespace: 'fleet-default' } },
      mode:         'edit',
    },
    global: {
      mocks: {
        $store:      store,
        $fetchState: { pending: false },
      },
    },
  });

  await (Generic as any).fetch.call(wrapper.vm);
  await asGeneric(wrapper).$nextTick();

  return wrapper;
};

describe('generic machine config', () => {
  describe('io.cattle.nodedriver/ui-field-hints annotation', () => {
    it('should override field types when type hints are provided', async() => {
      const hints = {
        zone:     { type: 'multiline' },
        diskSize: { type: 'multiline' },
      };
      const wrapper = await mountAndFetch({
        ...mockedStore(hints),
        getters: { ...mockedStore(hints).getters },
      });

      expect(asGeneric(wrapper).fields.zone.type).toBe('multiline');
      expect(asGeneric(wrapper).fields.diskSize.type).toBe('multiline');
    });

    it('should not modify fields that are not in the hints', async() => {
      const hints = { zone: { type: 'multiline' } };
      const wrapper = await mountAndFetch({
        ...mockedStore(hints),
        getters: { ...mockedStore(hints).getters },
      });

      expect(asGeneric(wrapper).fields.enginePort.type).toBe('string');
    });

    it('should not modify fields when no hints annotation exists', async() => {
      const wrapper = await mountAndFetch();

      expect(asGeneric(wrapper).fields.zone.type).toBe('string');
      expect(asGeneric(wrapper).fields.diskSize.type).toBe('string');
      expect(asGeneric(wrapper).fields.enginePort.type).toBe('string');
    });

    it('should ignore hint entries for fields not present in the schema', async() => {
      const hints = { nonExistentField: { type: 'multiline' } };
      const wrapper = await mountAndFetch({
        ...mockedStore(hints),
        getters: { ...mockedStore(hints).getters },
      });

      expect(asGeneric(wrapper).fields.zone.type).toBe('string');
      expect(asGeneric(wrapper).fields.nonExistentField).toBeUndefined();
    });

    it('should ignore hint entries that do not specify a type', async() => {
      const hints = { zone: { otherKey: 'blah' } } as any;
      const wrapper = await mountAndFetch({
        ...mockedStore(hints),
        getters: { ...mockedStore(hints).getters },
      });

      expect(asGeneric(wrapper).fields.zone.type).toBe('string');
    });

    it('should handle malformed JSON in the annotation gracefully', async() => {
      const driver = { metadata: { annotations: { [NODE_DRIVER_FIELD_HINTS]: 'testing bad json{' } } };
      const wrapper = await mountAndFetch({ dispatch: jest.fn(() => Promise.resolve(driver)) });

      expect(asGeneric(wrapper).fields.zone.type).toBe('string');
      expect(asGeneric(wrapper).errors.length).toBe(1);
    });
  });

  describe('data fetching failures', () => {
    it('should render an error banner and not render Questions when unable to determine fields for the driver', async() => {
      const wrapper = await mountAndFetch({ getters: { 'plugins/fieldsForDriver': () => Promise.resolve(null) } });

      expect(asGeneric(wrapper).errors.length).toBe(1);
      expect(asGeneric(wrapper).errors[0].message).toContain(`Machine Driver config schema not found for rke-machine-config.cattle.io.${ PROVIDER }config`);

      const banners = wrapper.findAllComponents(Banner);

      expect(banners.length).toBe(1);
      expect(wrapper.findComponent(Questions).exists()).toBe(false);
    });

    it('should render an error banner but still render Questions when unable to retrieve node driver field hints', async() => {
      const driverError = 'node driver not found';
      const wrapper = await mountAndFetch({ dispatch: jest.fn(() => Promise.reject(new Error(driverError))) });

      expect(asGeneric(wrapper).errors.length).toBe(1);
      expect(asGeneric(wrapper).errors[0].message).toContain(driverError);

      const banners = wrapper.findAllComponents(Banner);

      expect(banners.length).toBe(1);
      expect(wrapper.findComponent(Questions).exists()).toBe(true);
    });
  });
});
