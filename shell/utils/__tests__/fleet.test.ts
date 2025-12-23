import { Target } from '@shell/types/fleet';
import FleetUtils from '@shell/utils/fleet';

describe('fx: util.getTargetMode', () => {
  const util = FleetUtils.Application;

  it('should return "all" when targets contain excludeHarvesterRule and namespace is not fleet-local', () => {
    const targets = [{
      clusterSelector: {
        matchExpressions: [{
          key:      'provider.cattle.io',
          operator: 'NotIn',
          values:   ['harvester'],
        }],
      },
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });

  it('should return "clusters" when targets include clusterName and clusterSelector', () => {
    const targets = [{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" when targets only include multiple clusterSelectors', () => {
    const targets: Target[] = [{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "advanced" when a target contains clusterGroupSelector', () => {
    const targets = [{ clusterGroupSelector: {} }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "advanced" when any target contains clusterGroup or clusterGroupSelector', () => {
    const targets = [{
      clusterGroup:         'cg1',
      clusterGroupSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['string']
        }],
        matchLabels: { foo: 'bar' }
      },
      clusterName:     'pippo',
      clusterSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['vvv']
        }],
        matchLabels: { foo: 'bar' }
      },
      name: 'tt1',
    }, {
      clusterGroup:         'cg2',
      clusterGroupSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['string']
        }],
        matchLabels: { foo: 'bar' }
      },
      clusterName:     'pippo',
      clusterSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['vvv']
        }],
        matchLabels: { foo: 'bar' }
      },
      name: 'tt1',
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "none" when targets is an empty array', () => {
    const targets: Target[] = [];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('none');
  });

  it('should return "local" when namespace is "fleet-local" regardless of targets', () => {
    const targets: Target[] = [{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }];
    const namespace = 'fleet-local';

    expect(util.getTargetMode(targets, namespace)).toBe('local');
  });

  it('should return "all" if no specific target type (clusterName, clusterSelector, clusterGroup, clusterGroupSelector) is present', () => {
    const targets = [{ name: 'target1' }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });

  it('should return "clusters" if multiple targets include only clusterName', () => {
    const targets = [{ clusterName: 'cluster-a' }, { clusterName: 'cluster-b' }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" if a mix of clusterName and empty clusterSelector is present', () => {
    const targets = [{ clusterName: 'cluster-c' }, { clusterSelector: {} },
    ];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" if one target has clusterGroup but others have clusterName or clusterSelector', () => {
    const targets = [{ clusterName: 'cluster-x' }, { clusterGroup: 'my-group' }, { clusterSelector: { matchLabels: { env: 'prod' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "advanced" if one target has clusterGroupSelector but others have clusterName or clusterSelector', () => {
    const targets = [{ clusterName: 'cluster-x' }, { clusterGroupSelector: {} }, { clusterSelector: { matchLabels: { env: 'prod' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "all" when targets contain excludeHarvesterRule along with other irrelevant properties', () => {
    const targets = [{
      clusterSelector: {
        matchExpressions: [{
          key:      'provider.cattle.io',
          operator: 'NotIn',
          values:   ['harvester'],
        }],
      },
      name: 'some-other-name'
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });
});
