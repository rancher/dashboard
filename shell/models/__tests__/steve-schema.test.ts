import SteveSchema from '@shell/models/steve-schema';
import { replace } from '@shell/plugins/dashboard-store/mutations';

describe('class SteveSchema', () => {
  describe('schema diet', () => {
    it('schema Definitions', async() => {
      const store = 'cluster';
      const schemaName = 'steveTest';

      SteveSchema.reset(store);

      const testSchema = {
        id:             schemaName,
        metadata:       { name: schemaName },
        resourceFields: null,
        links:          { self: `/v1/schemas/${ schemaName }` }
      };
      const testSchemaDefinition = {
        type:           schemaName,
        resourceFields: {
          a: {},
          b: {},
        }
      };
      const testSecondarySchemaDefinitions = {
        a: { type: 'a' },
        b: { type: 'b' }
      };

      const schemaModel = new SteveSchema(testSchema, {
        dispatch: jest.fn().mockImplementation((action, opts) => {
          expect(action).toBe('request');
          expect(opts.type).toBe('schemaDefinition');
          expect(opts.url).toBe(`/v1/schemaDefinitions/${ schemaName }`);

          return {
            definitionType: schemaName,
            definitions:    {
              [schemaName]: testSchemaDefinition,
              ...testSecondarySchemaDefinitions,
            }
          };
        }),
        state: { config: { namespace: store } }
      });

      // We have no schema definition info, however we know that schema definitions should be fetched
      expect(schemaModel.schemaDefinition).toBeNull();
      expect(schemaModel.schemaDefinitions).toBeNull();
      expect(schemaModel.requiresResourceFields).toBeTruthy();
      expect(schemaModel.hasResourceFields).toBeFalsy();

      // Fetch schema definition
      await schemaModel.fetchResourceFields();

      // We have schema definition info
      expect(schemaModel.schemaDefinition).toStrictEqual(testSchemaDefinition);
      expect(schemaModel.schemaDefinitions).toStrictEqual(testSecondarySchemaDefinitions);
      expect(schemaModel.requiresResourceFields).toBeTruthy();
      expect(schemaModel.hasResourceFields).toBeTruthy();

      // Uhoh, there's been an update over socket. Socket process calls the `load` mutator which then calls `replace`.
      // This wipes out ALL properties on our poor schema model and applies everything from the one we get over socket
      replace(schemaModel, { ...testSchema });

      // All schema definition info should still work (this matches above)
      expect(schemaModel.schemaDefinition).toStrictEqual(testSchemaDefinition);
      expect(schemaModel.schemaDefinitions).toStrictEqual(testSecondarySchemaDefinitions);
      expect(schemaModel.requiresResourceFields).toBeTruthy();
      expect(schemaModel.hasResourceFields).toBeTruthy();
    });
  });
});
