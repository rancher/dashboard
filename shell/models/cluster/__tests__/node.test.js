import Node from '@shell/models/cluster/node.js';

describe('model: apps.deployment rollback', () => {
  it('should  be ramAllocatable', () => {
    const app = new Node({ status: { allocatable: { memory: '1024' } } });

    expect(app.ramAllocatable).toBe(1024);
  });

  it('should be ramUsagePercentage', () => {
    const ramUsage = '500';
    const ramAllocatable = '1000';
    const app = new Node({
      status: {
        allocatable: { memory: ramAllocatable },
        capacity:    { memory: '2048' }
      }
    }, {
      rootGetters: {
        'cluster/byId': () => ({ usage: { memory: ramUsage } }),
        currentCluster: { metadata: { labels: {} } }
      }
    });

    const res = ((ramUsage * 100) / ramAllocatable).toString();

    expect(app.ramUsagePercentage).toBe(res);
  });
});
