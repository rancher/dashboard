import IngressDetailEditHelper from '@shell/utils/ingress';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

const makeHelper = () => new IngressDetailEditHelper({
  $store:    {} as any,
  namespace: 'default',
});

describe('ingress', () => {
  describe('findAndMapCerts', () => {
    it.each([
      {
        desc:     'returns empty array when given empty secrets list',
        secrets:  [],
        expected: [],
      },
      {
        desc:    'returns empty array when no secrets are of TLS type',
        secrets: [
          { _type: 'Opaque', id: 'default/opaque-secret' },
          { _type: 'kubernetes.io/basic-auth', id: 'default/basic-secret' },
        ],
        expected: [],
      },
      {
        desc:     'extracts name part (after slash) from TLS secret id',
        secrets:  [{ _type: TYPES.TLS, id: 'default/my-tls-cert' }],
        expected: ['my-tls-cert'],
      },
      {
        desc:    'filters to TLS secrets only from a mixed list',
        secrets: [
          { _type: TYPES.TLS, id: 'default/tls-one' },
          { _type: 'Opaque', id: 'default/not-tls' },
          { _type: TYPES.TLS, id: 'default/tls-two' },
        ],
        expected: ['tls-one', 'tls-two'],
      },
      {
        desc:     'handles TLS secret id with no slash by returning full id',
        secrets:  [{ _type: TYPES.TLS, id: 'no-slash-id' }],
        expected: ['no-slash-id'],
      },
      {
        desc:     'handles multiple slashes by splitting on the first slash only',
        secrets:  [{ _type: TYPES.TLS, id: 'ns/name/extra' }],
        expected: ['name/extra'],
      },
    ])('$desc', ({ secrets, expected }) => {
      const helper = makeHelper();

      expect(helper.findAndMapCerts(secrets)).toStrictEqual(expected);
    });
  });

  describe('findAndMapServiceTargets', () => {
    it.each([
      {
        desc:     'returns empty array when given empty services list',
        services: [],
        expected: [],
      },
      {
        desc:     'maps service to label, value, and ports',
        services: [{
          metadata: { name: 'my-service' },
          spec:     { ports: [{ port: 80 }, { port: 443 }] },
        }],
        expected: [{
          label: 'my-service',
          value: 'my-service',
          ports: [80, 443],
        }],
      },
      {
        desc:     'includes port names alongside port numbers when available',
        services: [{
          metadata: { name: 'named-ports-service' },
          spec:     { ports: [{ port: 80, name: 'http' }, { port: 443, name: 'https' }] },
        }],
        expected: [{
          label: 'named-ports-service',
          value: 'named-ports-service',
          ports: [80, 'http', 443, 'https'],
        }],
      },
      {
        desc:     'returns undefined ports when service has no spec.ports',
        services: [{
          metadata: { name: 'headless-service' },
          spec:     {},
        }],
        expected: [{
          label: 'headless-service',
          value: 'headless-service',
          ports: undefined,
        }],
      },
      {
        desc:     'returns empty ports array when spec.ports is empty',
        services: [{
          metadata: { name: 'no-port-service' },
          spec:     { ports: [] },
        }],
        expected: [{
          label: 'no-port-service',
          value: 'no-port-service',
          ports: [],
        }],
      },
      {
        desc:     'maps multiple services correctly',
        services: [
          {
            metadata: { name: 'svc-a' },
            spec:     { ports: [{ port: 8080 }] },
          },
          {
            metadata: { name: 'svc-b' },
            spec:     { ports: [{ port: 9090 }, { port: 9091 }] },
          },
        ],
        expected: [
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
        ],
      },
      {
        desc:     'includes only port numbers when ports have no names',
        services: [{
          metadata: { name: 'unnamed-service' },
          spec:     { ports: [{ port: 3000 }] },
        }],
        expected: [{
          label: 'unnamed-service',
          value: 'unnamed-service',
          ports: [3000],
        }],
      },
    ])('$desc', ({ services, expected }) => {
      const helper = makeHelper();

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual(expected);
    });
  });
});
