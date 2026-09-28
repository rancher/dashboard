import { labelSelectorToSelector } from '@shell/utils/selector-typed';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';

describe('selector-typed', () => {
  describe('labelSelectorToSelector', () => {
    describe('empty label selectors', () => {
      it('should return empty string for undefined label selector', () => {
        const result = labelSelectorToSelector(undefined);

        expect(result).toBe('');
      });

      it('should return empty string for label selector with no matchLabels and no matchExpressions', () => {
        const labelSelector: KubeLabelSelector = {};
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('');
      });

      it('should return empty string for label selector with empty matchLabels', () => {
        const labelSelector: KubeLabelSelector = { matchLabels: {} };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('');
      });

      it('should return empty string for label selector with empty matchExpressions', () => {
        const labelSelector: KubeLabelSelector = { matchExpressions: [] };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('');
      });

      it('should return empty string for label selector with both empty matchLabels and matchExpressions', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels:      {},
          matchExpressions: []
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('');
      });
    });

    describe('matchLabels conversion', () => {
      it('should convert single matchLabel to selector string', () => {
        const labelSelector: KubeLabelSelector = { matchLabels: { app: 'nginx' } };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app=nginx');
      });

      it('should convert multiple matchLabels to comma-separated selector string', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels: {
            app:     'nginx',
            version: 'v1.0',
            env:     'production'
          }
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app=nginx,version=v1.0,env=production');
      });

      it('should handle matchLabels with special characters', () => {
        const labelSelector: KubeLabelSelector = { matchLabels: { 'app.kubernetes.io/name': 'my-app' } };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app.kubernetes.io/name=my-app');
      });

      it('should handle matchLabels with numeric values', () => {
        const labelSelector: KubeLabelSelector = { matchLabels: { tier: '3' } };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('tier=3');
      });
    });

    describe('matchExpressions conversion with In operator', () => {
      it('should convert matchExpression with In operator and single value to equality selector', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'app',
              operator: 'In',
              values:   ['nginx']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app=nginx');
      });

      it('should convert matchExpression with In operator and multiple values to in() selector', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'env',
              operator: 'In',
              values:   ['dev', 'staging', 'prod']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('env in (dev,staging,prod)');
      });

      it('should convert multiple matchExpressions with In operator', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'app',
              operator: 'In',
              values:   ['nginx']
            },
            {
              key:      'env',
              operator: 'In',
              values:   ['dev', 'staging']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app=nginx,env in (dev,staging)');
      });

      it('should handle matchExpression with empty values array for In operator', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'app',
              operator: 'In',
              values:   []
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        // With empty values array, it should create an in() with no values
        expect(result).toBe('app in ()');
      });
    });

    describe('combined matchLabels and matchExpressions', () => {
      it('should combine matchLabels and matchExpressions with single values', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels:      { tier: 'frontend' },
          matchExpressions: [
            {
              key:      'env',
              operator: 'In',
              values:   ['prod']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('tier=frontend,env=prod');
      });

      it('should combine multiple matchLabels and matchExpressions', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels: {
            tier:    'frontend',
            version: 'v2'
          },
          matchExpressions: [
            {
              key:      'env',
              operator: 'In',
              values:   ['dev', 'staging']
            },
            {
              key:      'region',
              operator: 'In',
              values:   ['us-west-1']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('tier=frontend,version=v2,env in (dev,staging),region=us-west-1');
      });

      it('should combine matchLabels with multiple matchExpressions using in() notation', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels:      { 'app.kubernetes.io/name': 'myapp' },
          matchExpressions: [
            {
              key:      'env',
              operator: 'In',
              values:   ['dev', 'test', 'prod']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        expect(result).toBe('app.kubernetes.io/name=myapp,env in (dev,test,prod)');
      });
    });

    describe('unsupported operators', () => {
      it('should throw error for NotIn operator', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'env',
              operator: 'NotIn',
              values:   ['prod']
            }
          ]
        };

        expect(() => labelSelectorToSelector(labelSelector)).toThrow('Unsupported matchExpression found when converting to selector string.');
      });
    });

    describe('edge cases', () => {
      it('should handle matchExpression with In operator but undefined values', () => {
        const labelSelector: KubeLabelSelector = {
          matchExpressions: [
            {
              key:      'app',
              operator: 'In',
              values:   undefined
            }
          ]
        };

        // When values is undefined, the function throws an error
        expect(() => labelSelectorToSelector(labelSelector)).toThrow('Unsupported matchExpression found when converting to selector string.');
      });

      it('should preserve order of matchLabels and matchExpressions', () => {
        const labelSelector: KubeLabelSelector = {
          matchLabels: {
            first:  'value1',
            second: 'value2'
          },
          matchExpressions: [
            {
              key:      'third',
              operator: 'In',
              values:   ['value3']
            }
          ]
        };
        const result = labelSelectorToSelector(labelSelector);

        // matchLabels come before matchExpressions
        expect(result).toContain('first=value1');
        expect(result).toContain('second=value2');
        expect(result).toContain('third=value3');
        expect(result.indexOf('first')).toBeLessThan(result.indexOf('third'));
      });
    });
  });
});
