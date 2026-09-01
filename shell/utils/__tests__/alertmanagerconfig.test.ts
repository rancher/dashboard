import { Buffer } from 'buffer';
import { areRoutesSupportedFormat, canCreate, createDefaultRouteName } from '@shell/utils/alertmanagerconfig';

function makeSecret(yaml: string | null): { data: Record<string, string> } {
  if (yaml === null) {
    return { data: {} };
  }

  return { data: { 'alertmanager.yaml': Buffer.from(yaml).toString('base64') } };
}

describe('alertmanagerconfig utils', () => {
  describe('createDefaultRouteName', () => {
    it.each([
      {
        desc:     'index 0',
        index:    0,
        expected: 'route-0',
      },
      {
        desc:     'index 1',
        index:    1,
        expected: 'route-1',
      },
      {
        desc:     'index 99',
        index:    99,
        expected: 'route-99',
      },
    ])('returns $expected for $desc', ({ index, expected }) => {
      expect(createDefaultRouteName(index)).toStrictEqual(expected);
    });
  });

  describe('areRoutesSupportedFormat', () => {
    it('returns true when secret has no data', () => {
      const secret = makeSecret(null);

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(true);
    });

    it('returns true when config has no routes', () => {
      const secret = makeSecret('receivers: []\nroute: {}');

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(true);
    });

    it('returns true when all routes are non-empty', () => {
      const yaml = `
receivers: []
route:
  routes:
    - receiver: team-a
      match:
        severity: critical
`;
      const secret = makeSecret(yaml);

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(true);
    });

    it('returns false when any route is an empty object', () => {
      const yaml = `
receivers: []
route:
  routes:
    - {}
`;
      const secret = makeSecret(yaml);

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(false);
    });

    it('returns false when the yaml is invalid', () => {
      const secret = { data: { 'alertmanager.yaml': Buffer.from(': invalid: yaml: {').toString('base64') } };

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(false);
    });

    it('returns true when routes array is empty', () => {
      const yaml = `
route:
  routes: []
`;
      const secret = makeSecret(yaml);

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(true);
    });

    it('returns false when one of multiple routes is empty', () => {
      const yaml = `
receivers: []
route:
  routes:
    - receiver: team-a
    - {}
`;
      const secret = makeSecret(yaml);

      expect(areRoutesSupportedFormat(secret)).toStrictEqual(false);
    });
  });

  describe('canCreate', () => {
    it('returns true when secret type is creatable', () => {
      const rootGetters = { 'type-map/optionsFor': () => ({ isCreatable: true }) };

      expect(canCreate(rootGetters)).toStrictEqual(true);
    });

    it('returns false when secret type is not creatable', () => {
      const rootGetters = { 'type-map/optionsFor': () => ({ isCreatable: false }) };

      expect(canCreate(rootGetters)).toStrictEqual(false);
    });
  });
});
