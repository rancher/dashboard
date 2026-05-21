import { containerImages } from '@shell/utils/validators/container-images';
import { flowOutput } from '@shell/utils/validators/flow-output';
import { logdna } from '@shell/utils/validators/logging-outputs';
import { matching, interval } from '@shell/utils/validators/monitoring-route';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/container-images', () => {
  describe('containerImages', () => {
    it('adds error when containers list is missing', () => {
      const errors: string[] = [];
      const spec = { template: { spec: {} } };

      containerImages(spec, mockGetters, errors);
      expect(errors.some((e) => e.includes('validation.required'))).toBe(true);
    });

    it('adds error when containers list is empty', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [] } } };

      containerImages(spec, mockGetters, errors);
      expect(errors.some((e) => e.includes('validation.required'))).toBe(true);
    });

    it('adds error when a container has no image', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [{ name: 'web', image: '' }] } } };

      containerImages(spec, mockGetters, errors);
      expect(errors.some((e) => e.includes('workload.validation.containerImage'))).toBe(true);
    });

    it('includes container name in error message', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [{ name: 'my-container', image: '' }] } } };

      containerImages(spec, mockGetters, errors);
      expect(errors.some((e) => e.includes('my-container'))).toBe(true);
    });

    it('does not add error when all containers have images', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [{ name: 'web', image: 'nginx:latest' }] } } };

      containerImages(spec, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });

    it('adds error for each container missing an image', () => {
      const errors: string[] = [];
      const spec = {
        template: {
          spec: {
            containers: [
              { name: 'c1', image: '' },
              { name: 'c2', image: 'nginx' },
              { name: 'c3', image: '' },
            ]
          }
        }
      };

      containerImages(spec, mockGetters, errors);
      expect(errors.filter((e) => e.includes('workload.validation.containerImage'))).toHaveLength(2);
    });

    it('reads podSpec from cronjob jobTemplate path', () => {
      const errors: string[] = [];
      const spec = { jobTemplate: { spec: { template: { spec: { containers: [] } } } } };

      containerImages(spec, mockGetters, errors);
      expect(errors.some((e) => e.includes('validation.required'))).toBe(true);
    });

    it('does not error for cronjob with valid containers', () => {
      const errors: string[] = [];
      const spec = { jobTemplate: { spec: { template: { spec: { containers: [{ name: 'job', image: 'busybox' }] } } } } };

      containerImages(spec, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });
  });
});

describe('validators/flow-output', () => {
  describe('flowOutput', () => {
    it('adds error when verifyLocal and both refs are empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: [], globalOutputRefs: [] }, mockGetters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });

    it('does not add error when verifyLocal and localOutputRefs is populated', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: ['ref1'], globalOutputRefs: [] }, mockGetters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('does not add error when verifyLocal and globalOutputRefs is populated', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: [], globalOutputRefs: ['ref1'] }, mockGetters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when not verifyLocal and globalOutputRefs is empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: ['local'], globalOutputRefs: [] }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });

    it('does not add error when not verifyLocal and globalOutputRefs is populated', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: [], globalOutputRefs: ['global'] }, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('uses default empty array when localOutputRefs is missing', () => {
      const errors: string[] = [];

      flowOutput({ globalOutputRefs: [] }, mockGetters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });
  });
});

describe('validators/logging-outputs', () => {
  describe('logdna', () => {
    it('returns without error when value is empty', () => {
      const errors: string[] = [];

      logdna({}, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('returns without error when value is null', () => {
      const errors: string[] = [];

      logdna(null, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when api_key is missing', () => {
      const errors: string[] = [];

      logdna({ host: 'example.com' }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('adds error when api_key is empty string', () => {
      const errors: string[] = [];

      logdna({ api_key: '' }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('does not add error when api_key is provided', () => {
      const errors: string[] = [];

      logdna({ api_key: 'my-key-123' }, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });
  });
});

describe('validators/monitoring-route', () => {
  describe('matching', () => {
    it('adds error when both match and match_re are missing', () => {
      const errors: string[] = [];

      matching({}, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('adds error when both match and match_re are empty', () => {
      const errors: string[] = [];

      matching({ match: {}, match_re: {} }, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('does not add error when match has entries', () => {
      const errors: string[] = [];

      matching({ match: { alertname: 'myAlert' } }, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('does not add error when match_re has entries', () => {
      const errors: string[] = [];

      matching({ match_re: { alertname: '.*' } }, mockGetters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('does not add error when spec is null', () => {
      const errors: string[] = [];

      matching(null, mockGetters, errors, []);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });
  });

  describe('interval', () => {
    it.each([
      ['30s', true],
      ['5m', true],
      ['2h', true],
      ['0s', true],
    ])('accepts valid interval %s', (value, _valid) => {
      const errors: string[] = [];

      interval(value, mockGetters, errors, [], 'Group Wait');
      expect(errors).toStrictEqual([]);
    });

    it.each([
      ['30'],
      ['5min'],
      ['2 h'],
      ['abc'],
      [''],
      ['1d'],
    ])('rejects invalid interval %s', (value) => {
      const errors: string[] = [];

      interval(value, mockGetters, errors, [], 'Group Wait');
      expect(errors.some((e) => e.includes('validation.monitoring.route.interval'))).toBe(true);
    });

    it('includes displayKey in error message', () => {
      const errors: string[] = [];

      interval('invalid', mockGetters, errors, [], 'RepeatInterval');
      expect(errors.some((e) => e.includes('RepeatInterval'))).toBe(true);
    });
  });
});
