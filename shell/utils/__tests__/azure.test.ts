import { parseAzureError } from '@shell/utils/azure';

describe('azure.js', () => {
  describe('parseAzureError', () => {
    it('should extract error from Message="..." format', () => {
      const err = 'Something went wrong Message="Failure"';

      expect(parseAzureError(err)).toBe('Failure');
    });

    it('should extract error_description from single-line Response body JSON', () => {
      const err = 'Error X Response body: {"error_description": "Failure"}';

      expect(parseAzureError(err)).toBe('Failure');
    });

    it('should extract error.message from multiline JSON containing "error":', () => {
      const err = `
       { "error": { "code": "NoRegisteredProviderFound", "message": "No registered resource provider found for location 'X'" } }
      `;

      expect(parseAzureError(err)).toBe("No registered resource provider found for location 'X'");
    });

    it('should return undefined if single-line JSON exists but lacks error_description', () => {
      // Note: Current implementation returns undefined immediately if JSON parses but key is missing
      const err = 'Response body: {"other_field": "value"}';

      expect(parseAzureError(err)).toBeUndefined();
    });

    it('should return false if multiline JSON exists but lacks error.message', () => {
      const err = `
        {
          "error": {
            "code": "NoMessage"
          }
        }
      `;

      expect(parseAzureError(err)).toBe(false);
    });

    it('should return false if JSON parsing fails', () => {
      const err1 = 'Response body: { invalid json }';
      const err2 = '{ "error": { invalid } }';

      expect(parseAzureError(err1)).toBe(false);
      expect(parseAzureError(err2)).toBe(false);
    });

    it('should return false for unmatched strings', () => {
      expect(parseAzureError('error string')).toBe(false);
    });
  });
});
