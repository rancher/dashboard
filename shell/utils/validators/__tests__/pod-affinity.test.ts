import { podAffinity } from '@shell/utils/validators/pod-affinity';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/pod-affinity', () => {
  describe('podAffinity', () => {
    it('returns without error when spec is null', () => {
      const errors: string[] = [];

      podAffinity(null, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });

    it('returns without error when spec is undefined', () => {
      const errors: string[] = [];

      podAffinity(undefined, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });

    it('returns without error when spec has no affinity fields', () => {
      const errors: string[] = [];

      podAffinity({}, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });

    it('returns without error when podAffinity is empty object', () => {
      const errors: string[] = [];

      podAffinity({ podAffinity: {} }, mockGetters, errors);
      expect(errors).toStrictEqual([]);
    });

    describe('podAffinity.preferredDuringSchedulingIgnoredDuringExecution', () => {
      it('validates weight must be between 1-100 (above 100)', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          101,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });

      it('validates weight must be between 1-100 (below 1)', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          0,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });

      it('accepts valid weight of 50', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.filter((e) => e.includes('validation.number.between'))).toHaveLength(0);
      });

      it('validates topologyKey is required', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {}
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });

      it('validates topologyKey format (no alphanumeric chars)', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: { topologyKey: '!!!' }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });

      it('validates labelSelector matchExpressions operator', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: {
                    matchExpressions: [
                      { operator: 'InvalidOp', values: [] }
                    ]
                  }
                }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.matchExpressions.operator'))).toBe(true);
      });

      it('validates In/NotIn operators require values', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: {
                    matchExpressions: [
                      { operator: 'In', values: [] }
                    ]
                  }
                }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.matchExpressions.valuesMustBeDefined'))).toBe(true);
      });

      it('validates Exists/DoesNotExist operators require empty values', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: {
                    matchExpressions: [
                      { operator: 'Exists', values: ['some-value'] }
                    ]
                  }
                }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.matchExpressions.valueMustBeEmpty'))).toBe(true);
      });

      it('accepts valid In operator with values', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: {
                    matchExpressions: [
                      { operator: 'In', values: ['value1'] }
                    ]
                  }
                }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.filter((e) => e.includes('matchExpressions'))).toHaveLength(0);
      });

      it('accepts valid DoesNotExist operator with no values', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: {
                    matchExpressions: [
                      { operator: 'DoesNotExist', values: [] }
                    ]
                  }
                }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.filter((e) => e.includes('matchExpressions'))).toHaveLength(0);
      });
    });

    describe('podAffinity.requiredDuringSchedulingIgnoredDuringExecution', () => {
      it('validates topologyKey is required', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              { labelSelector: {} }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });

      it('accepts valid requiredDuring term', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              { topologyKey: 'kubernetes.io/hostname' }
            ]
          }
        }, mockGetters, errors);

        expect(errors).toHaveLength(0);
      });
    });

    describe('podAntiAffinity', () => {
      it('validates weight for preferredDuring antiAffinity', () => {
        const errors: string[] = [];

        podAffinity({
          podAntiAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          200,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' }
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });

      it('validates topologyKey for requiredDuring antiAffinity', () => {
        const errors: string[] = [];

        podAffinity({
          podAntiAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              {}
            ]
          }
        }, mockGetters, errors);

        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });

      it('returns without error for empty podAntiAffinity', () => {
        const errors: string[] = [];

        podAffinity({ podAntiAffinity: {} }, mockGetters, errors);
        expect(errors).toStrictEqual([]);
      });

      it('accepts valid antiAffinity term', () => {
        const errors: string[] = [];

        podAffinity({
          podAntiAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              { topologyKey: 'kubernetes.io/zone' }
            ]
          }
        }, mockGetters, errors);

        expect(errors).toHaveLength(0);
      });
    });

    describe('error context', () => {
      it('includes index in error context for preferred affinity', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {}
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors[0]).toContain('"index":0');
      });

      it('includes group for affinity (affinityTitle)', () => {
        const errors: string[] = [];

        podAffinity({
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {}
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors[0]).toContain('validation.podAffinity.affinityTitle');
      });

      it('includes group for antiAffinity (antiAffinityTitle)', () => {
        const errors: string[] = [];

        podAffinity({
          podAntiAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {}
              }
            ]
          }
        }, mockGetters, errors);

        expect(errors[0]).toContain('validation.podAffinity.antiAffinityTitle');
      });
    });
  });
});
