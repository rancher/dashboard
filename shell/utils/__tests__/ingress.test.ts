import IngressDetailEditHelper from '@shell/utils/ingress';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

const makeHelper = () => new IngressDetailEditHelper({
  $store:    {} as any,
  namespace: 'default',
});

describe('ingress', () => {
  describe('findAndMapCerts', () => {
    it('returns empty array when given empty secrets list', () => {
      const helper = makeHelper();

      expect(helper.findAndMapCerts([])).toStrictEqual([]);
    });

    it('returns empty array when no secrets are of TLS type', () => {
      const helper = makeHelper();
      const secrets = [
        { _type: 'Opaque', id: 'default/opaque-secret' },
        { _type: 'kubernetes.io/basic-auth', id: 'default/basic-secret' },
      ];

      expect(helper.findAndMapCerts(secrets)).toStrictEqual([]);
    });

    it('extracts name part (after slash) from TLS secret id', () => {
      const helper = makeHelper();
      const secrets = [{ _type: TYPES.TLS, id: 'default/my-tls-cert' }];

      expect(helper.findAndMapCerts(secrets)).toStrictEqual(['my-tls-cert']);
    });

    it('filters to TLS secrets only from a mixed list', () => {
      const helper = makeHelper();
      const secrets = [
        { _type: TYPES.TLS, id: 'default/tls-one' },
        { _type: 'Opaque', id: 'default/not-tls' },
        { _type: TYPES.TLS, id: 'default/tls-two' },
      ];

      expect(helper.findAndMapCerts(secrets)).toStrictEqual(['tls-one', 'tls-two']);
    });

    it('handles TLS secret id with no slash by returning full id', () => {
      const helper = makeHelper();
      const secrets = [{ _type: TYPES.TLS, id: 'no-slash-id' }];

      // indexOf('/') returns -1, so slice(0) returns the full string
      expect(helper.findAndMapCerts(secrets)).toStrictEqual(['no-slash-id']);
    });

    it('handles multiple slashes by splitting on the first slash only', () => {
      const helper = makeHelper();
      const secrets = [{ _type: TYPES.TLS, id: 'ns/name/extra' }];

      expect(helper.findAndMapCerts(secrets)).toStrictEqual(['name/extra']);
    });
  });

  describe('findAndMapServiceTargets', () => {
    it('returns empty array when given empty services list', () => {
      const helper = makeHelper();

      expect(helper.findAndMapServiceTargets([])).toStrictEqual([]);
    });

    it('maps service to label, value, and ports', () => {
      const helper = makeHelper();
      const services = [{
        metadata: { name: 'my-service' },
        spec:     { ports: [{ port: 80 }, { port: 443 }] },
      }];

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual([{
        label: 'my-service',
        value: 'my-service',
        ports: [80, 443],
      }]);
    });

    it('returns undefined ports when service has no spec.ports', () => {
      const helper = makeHelper();
      const services = [{
        metadata: { name: 'headless-service' },
        spec:     {},
      }];

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual([{
        label: 'headless-service',
        value: 'headless-service',
        ports: undefined,
      }]);
    });

    it('returns empty ports array when spec.ports is empty', () => {
      const helper = makeHelper();
      const services = [{
        metadata: { name: 'no-port-service' },
        spec:     { ports: [] },
      }];

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual([{
        label: 'no-port-service',
        value: 'no-port-service',
        ports: [],
      }]);
    });

    it('maps multiple services correctly', () => {
      const helper = makeHelper();
      const services = [
        {
          metadata: { name: 'svc-a' },
          spec:     { ports: [{ port: 8080 }] },
        },
        {
          metadata: { name: 'svc-b' },
          spec:     { ports: [{ port: 9090 }, { port: 9091 }] },
        },
      ];

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual([
        {
          label: 'svc-a',
          value: 'svc-a',
          ports: [8080],
        },
        {
          label: 'svc-b',
          value: 'svc-b',
          ports: [9090, 9091],
        },
      ]);
    });
  });
});
