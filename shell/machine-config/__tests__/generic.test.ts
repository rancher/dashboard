import Generic from '@shell/machine-config/generic.vue';
import { MANAGEMENT } from '@shell/config/types';
import { NODE_DRIVER_FIELD_HINTS } from '@shell/config/labels-annotations';

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

describe('generic machine config', () => {
  describe('io.cattle.nodedriver/ui-field-hints annotation', () => {
    it('should override field types when type hints are provided', async() => {
      const hints = {
        zone:     { type: 'multiline' },
        diskSize: { type: 'multiline' },
      };
      const fields = buildFields();
      const store = {
        ...mockedStore(hints),
        getters: {
          ...mockedStore(hints).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      expect(context.fields.zone.type).toBe('multiline');
      expect(context.fields.diskSize.type).toBe('multiline');
    });

    it('should not modify fields that are not in the hints', async() => {
      const hints = { zone: { type: 'multiline' } };
      const fields = buildFields();
      const store = {
        ...mockedStore(hints),
        getters: {
          ...mockedStore(hints).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      expect(context.fields.enginePort.type).toBe('string');
    });

    it('should not modify fields when no hints annotation exists', async() => {
      const fields = buildFields();
      const store = {
        ...mockedStore(null),
        getters: {
          ...mockedStore(null).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      expect(context.fields.zone.type).toBe('string');
      expect(context.fields.diskSize.type).toBe('string');
      expect(context.fields.enginePort.type).toBe('string');
    });

    it('should ignore hint entries for fields not present in the schema', async() => {
      const hints = { nonExistentField: { type: 'multiline' } };
      const fields = buildFields();
      const store = {
        ...mockedStore(hints),
        getters: {
          ...mockedStore(hints).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      expect(context.fields.zone.type).toBe('string');
      expect((context.fields as any).nonExistentField).toBeUndefined();
    });

    it('should ignore hint entries that do not specify a type', async() => {
      const hints = { zone: { otherKey: 'blah' } } as any;
      const fields = buildFields();
      const store = {
        ...mockedStore(hints),
        getters: {
          ...mockedStore(hints).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      expect(context.fields.zone.type).toBe('string');
    });

    it('should handle malformed JSON in the annotation gracefully', async() => {
      const driver = { metadata: { annotations: { [NODE_DRIVER_FIELD_HINTS]: 'testing bad json{' } } };
      const fields = buildFields();
      const store = {
        ...mockedStore(null),
        getters: {
          ...mockedStore(null).getters,
          'plugins/fieldsForDriver': () => Promise.resolve(fields),
        },
        dispatch: jest.fn(() => Promise.resolve(driver)),
      };
      const context = {
        $store:              store,
        provider:            PROVIDER,
        fields:              null as any,
        errors:              [] as any[],
        cloudCredentialKeys: [],
      };

      await (Generic as any).fetch.call(context);

      // Fields remain unchanged
      expect(context.fields.zone.type).toBe('string');
      // Error is captured
      expect(context.errors.length).toBeGreaterThan(0);
    });
  });
});
