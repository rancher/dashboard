import IngressDetailEditHelper from '@shell/utils/ingress';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

/**
 * Mirrors the port parsing logic used in RulePath.vue and DefaultBackend.vue
 * to decide whether to write port.number or port.name
 */
function parseServicePort(rawPort: string | number): string | number {
  const parsed = Number.parseInt(String(rawPort));

  return Number.isNaN(parsed) ? rawPort : parsed;
}

/**
 * Mirrors the portRequired validation rule from index.vue.
 * Handles both scalar values (from component-level validation)
 * and port objects (from form-validation mixin).
 */
function portRequired(port: any): string | undefined {
  if (typeof port === 'string' || typeof port === 'number') {
    if (!port) {
      return 'Port is required';
    }
  } else if (!port || (!port.number && !port.name)) {
    return 'Port is required';
  }

  return undefined;
}

/**
 * Mirrors the portRange validation rule from index.vue.
 * Checks that a numeric port is within 1-65535 (handles both scalar and object inputs).
 */
function portRange(port: any): string | undefined {
  let num;

  if (typeof port === 'number') {
    num = port;
  } else if (typeof port === 'string') {
    num = Number.parseInt(port);
  } else if (port?.number) {
    num = port.number;
  }

  if (num !== undefined && !Number.isNaN(num) && (num < 1 || num > 65535)) {
    return 'Port number must be between 1 and 65535';
  }

  return undefined;
}

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
      {
        desc:     'skips empty-string port names',
        services: [{
          metadata: { name: 'empty-name-svc' },
          spec:     { ports: [{ port: 8080, name: '' }] },
        }],
        expected: [{
          label: 'empty-name-svc',
          value: 'empty-name-svc',
          ports: [8080],
        }],
      },
      {
        desc:     'handles mix of named and unnamed ports on the same service',
        services: [{
          metadata: { name: 'mixed-svc' },
          spec:     { ports: [{ port: 80, name: 'http' }, { port: 9090 }] },
        }],
        expected: [{
          label: 'mixed-svc',
          value: 'mixed-svc',
          ports: [80, 'http', 9090],
        }],
      },
    ])('$desc', ({ services, expected }) => {
      const helper = makeHelper();

      expect(helper.findAndMapServiceTargets(services)).toStrictEqual(expected);
    });
  });

  describe('parseServicePort', () => {
    it.each([
      {
        desc:     'parses numeric string to number',
        input:    '80',
        expected: 80,
      },
      {
        desc:     'parses large port number',
        input:    '65535',
        expected: 65535,
      },
      {
        desc:     'keeps string port name as-is',
        input:    'http',
        expected: 'http',
      },
      {
        desc:     'keeps string port name with hyphens',
        input:    'my-port',
        expected: 'my-port',
      },
      {
        desc:     'handles zero as a number (not as falsy)',
        input:    '0',
        expected: 0,
      },
      {
        desc:     'handles already-numeric input',
        input:    443 as any,
        expected: 443,
      },
      {
        desc:     'keeps empty string as empty string',
        input:    '',
        expected: '',
      },
    ])('$desc', ({ input, expected }) => {
      expect(parseServicePort(input)).toStrictEqual(expected);
    });

    it('routes numeric result to port.number path', () => {
      const servicePort = parseServicePort('80');

      expect(typeof servicePort).toBe('number');
    });

    it('routes string result to port.name path', () => {
      const servicePort = parseServicePort('http');

      expect(typeof servicePort).toBe('string');
    });
  });

  describe('portRequired validation', () => {
    describe('object input (form mixin)', () => {
      it.each([
        {
          desc: 'passes when port.number is set',
          port: { number: 80 },
        },
        {
          desc: 'passes when port.name is set',
          port: { name: 'http' },
        },
        {
          desc: 'passes when both are set',
          port: {
            number: 80,
            name:   'http',
          },
        },
        {
          desc: 'passes when port.number is 0 but name is set',
          port: {
            number: 0,
            name:   'http',
          },
        },
      ])('valid: $desc', ({ port }) => {
        expect(portRequired(port)).toBeUndefined();
      });

      it.each([
        {
          desc: 'port is undefined',
          port: undefined,
        },
        {
          desc: 'port is null',
          port: null,
        },
        {
          desc: 'port is empty object',
          port: {},
        },
        {
          desc: 'port.number is 0 and no name',
          port: { number: 0 },
        },
        {
          desc: 'port.name is empty string and no number',
          port: { name: '' },
        },
      ])('invalid: $desc', ({ port }) => {
        expect(portRequired(port)).toBeDefined();
      });
    });

    describe('scalar input (component)', () => {
      it.each([
        {
          desc: 'passes for numeric port',
          port: 80,
        },
        {
          desc: 'passes for string port name',
          port: 'http',
        },
      ])('valid: $desc', ({ port }) => {
        expect(portRequired(port)).toBeUndefined();
      });

      it.each([
        {
          desc: 'empty string',
          port: '',
        },
        {
          desc: 'zero',
          port: 0,
        },
      ])('invalid: $desc', ({ port }) => {
        expect(portRequired(port)).toBeDefined();
      });
    });
  });

  describe('portRange validation', () => {
    describe('object input (form mixin)', () => {
      it.each([
        {
          desc: 'passes for port.number 1 (minimum)',
          port: { number: 1 },
        },
        {
          desc: 'passes for port.number 65535 (maximum)',
          port: { number: 65535 },
        },
        {
          desc: 'passes when only port.name is set',
          port: { name: 'http' },
        },
      ])('valid: $desc', ({ port }) => {
        expect(portRange(port)).toBeUndefined();
      });

      it.each([
        {
          desc: 'port.number exceeds 65535',
          port: { number: 70000 },
        },
        {
          desc: 'port.number is negative',
          port: { number: -1 },
        },
      ])('invalid: $desc', ({ port }) => {
        expect(portRange(port)).toBeDefined();
      });
    });

    describe('scalar input (component)', () => {
      it.each([
        {
          desc: 'passes for port 1 (minimum)',
          port: 1,
        },
        {
          desc: 'passes for port 65535 (maximum)',
          port: 65535,
        },
        {
          desc: 'passes for numeric string "443"',
          port: '443',
        },
        {
          desc: 'passes for string port name',
          port: 'http',
        },
      ])('valid: $desc', ({ port }) => {
        expect(portRange(port)).toBeUndefined();
      });

      it.each([
        {
          desc: 'number exceeds 65535',
          port: 70000,
        },
        {
          desc: 'negative number',
          port: -1,
        },
        {
          desc: 'string "70000" exceeds range',
          port: '70000',
        },
      ])('invalid: $desc', ({ port }) => {
        expect(portRange(port)).toBeDefined();
      });
    });
  });
});
