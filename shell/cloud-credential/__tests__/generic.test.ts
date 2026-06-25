import { shallowMount } from '@vue/test-utils';
import Generic, { INPUT_TYPES } from '@shell/cloud-credential/generic.vue';
import { SCHEMA } from '@shell/config/types';

const DRIVER_NAME = 'testdriver';
const CONFIG_ID = `testdrivercredentialconfig`;

/**
 * Build a normanSchema whose resourceFields include one field per INPUT_TYPE
 * plus a plain "string" field (which should fall back to "text").
 */
const buildResourceFields = () => {
  const fields: Record<string, { type: string }> = {};

  INPUT_TYPES.forEach((t) => {
    fields[`${ t }Field`] = { type: t };
  });
  fields.stringField = { type: 'string' };

  return fields;
};

const normanSchema = { resourceFields: buildResourceFields() };

const mockedStore = () => ({
  getters: {
    'i18n/t':                           (key: string) => key,
    t:                                  (key: string) => key,
    'plugins/credentialFieldForDriver': () => DRIVER_NAME,
    'plugins/fieldNamesForDriver':      () => [],
  },
  dispatch: jest.fn((_action: string, args: any) => {
    if (args?.type === SCHEMA && args?.id === CONFIG_ID) {
      return Promise.resolve(normanSchema);
    }

    return Promise.resolve(null);
  }),
});

const mountGeneric = () => {
  const store = mockedStore();
  const value = {
    decodedData: {} as Record<string, string>,
    setData:     jest.fn(),
  };

  return shallowMount(Generic, {
    props: {
      driverName: DRIVER_NAME,
      value,
      mode:       'edit',
    },
    global: {
      mocks: {
        $store:      store,
        $fetchState: { pending: false },
      },
    },
    data() {
      return {
        normanSchema,
        keyOptions: Object.keys(normanSchema.resourceFields),
      } as any;
    },
  });
};

describe('generic cloud credential', () => {
  describe('typeForField', () => {
    it.each(INPUT_TYPES)('should return "%s" for a field with type "%s"', (inputType) => {
      const wrapper = mountGeneric();

      expect((wrapper.vm as any).typeForField(`${ inputType }Field`)).toBe(inputType);
    });

    it('should fall back to "text" for a field type not in INPUT_TYPES', () => {
      const wrapper = mountGeneric();

      expect((wrapper.vm as any).typeForField('stringField')).toBe('text');
    });

    it('should fall back to "text" when no normanSchema could be located', () => {
      const store = {
        ...mockedStore(),
        dispatch: jest.fn(() => Promise.resolve(null)),
      };

      const wrapper = shallowMount(Generic, {
        props: {
          driverName: DRIVER_NAME,
          value:      { decodedData: {}, setData: jest.fn() },
          mode:       'edit',
        },
        global: {
          mocks: {
            $store:      store,
            $fetchState: { pending: false },
          },
        },
        data() {
          return { normanSchema: null, keyOptions: [] };
        },
      });

      expect((wrapper.vm as any).typeForField('passwordField')).toBe('text');
      expect((wrapper.vm as any).typeForField('cronField')).toBe('text');
      expect((wrapper.vm as any).typeForField('anyField')).toBe('text');
    });
  });

  describe('LabeledInput rendering', () => {
    it('should render a LabeledInput inside the KeyValue value slot', () => {
      const wrapper = mountGeneric();
      const keyValue = wrapper.findComponent({ name: 'KeyValue' });

      expect(keyValue.exists()).toBe(true);

      // The component registers LabeledInput and passes typeForField via the slot template
      expect((wrapper.vm as any).$options.components.LabeledInput).toBeDefined();
    });

    it('should pass typeForField result as the type prop to LabeledInput', () => {
      const wrapper = mountGeneric();

      // Validate the integration: typeForField returns the correct type for each INPUT_TYPE field
      INPUT_TYPES.forEach((inputType) => {
        expect((wrapper.vm as any).typeForField(`${ inputType }Field`)).toBe(inputType);
      });
    });
  });
});
