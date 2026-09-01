import AlertmanagerConfig from '@shell/models/monitoring.coreos.com.alertmanagerconfig';

const base = {
  apiVersion: 'monitoring.coreos.com/v1alpha1',
  kind:       'AlertmanagerConfig',
  metadata:   { name: 'test', namespace: 'default' },
};

const build = (data: Record<string, any>) => new AlertmanagerConfig(data) as any;

describe('class AlertmanagerConfig', () => {
  describe('applyDefaults', () => {
    it('on a fresh resource, seeds the route with defaults and no match/matchRe', () => {
      const amc = build({ ...base });

      amc.applyDefaults();

      expect(amc.spec.receivers).toStrictEqual([]);
      expect(amc.spec.route).toStrictEqual({
        groupBy:        [],
        groupWait:      '30s',
        groupInterval:  '5m',
        repeatInterval: '4h',
        matchers:       [],
      });
    });

    it('backfills route defaults on a resource loaded without a route', () => {
      const amc = build({
        ...base,
        spec: { receivers: [{ name: 'existing' }] },
      });

      amc.applyDefaults();

      expect(amc.spec.route).toBeDefined();
      expect(amc.spec.route.receiver).toBeUndefined();
      expect(amc.spec.route.matchers).toStrictEqual([]);
    });

    it('preserves existing matchers on load', () => {
      const matchers = [{
        name: 'severity', value: 'warning', matchType: '='
      }];
      const amc = build({
        ...base,
        spec: {
          receivers: [{ name: 'existing' }],
          route:     { receiver: 'existing', matchers },
        },
      });

      amc.applyDefaults();

      expect(amc.spec.route.matchers).toStrictEqual(matchers);
    });
  });

  describe('cleanForSave', () => {
    it('drops spec.route when no receiver is set — this is what fixes #17347 on 109+ charts', () => {
      const amc = build({ ...base });

      const out = amc.cleanForSave({
        ...base,
        spec: {
          receivers: [],
          route:     {
            groupBy:        [],
            groupWait:      '30s',
            groupInterval:  '5m',
            repeatInterval: '4h',
            matchers:       [],
          },
        },
      }, true);

      expect(out.spec.route).toBeUndefined();
      expect(out.spec.receivers).toStrictEqual([]);
    });

    it('keeps spec.route when a receiver is set', () => {
      const amc = build({ ...base });

      const out = amc.cleanForSave({
        ...base,
        spec: {
          receivers: [{ name: 'existing' }],
          route:     {
            receiver: 'existing', groupBy: [], matchers: []
          },
        },
      }, false);

      expect(out.spec.route).toBeDefined();
      expect(out.spec.route.receiver).toBe('existing');
    });
  });
});
