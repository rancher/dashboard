import NormanCluster from '@shell/models/cluster';

describe('class NormanCluster', () => {
  const t = jest.fn(() => 'abc');
  const ctx = { rootGetters: { 'i18n/t': t }, dispatch: jest.fn() };

  it('should return empty arrays of system labels and system annotations if cluster labels and annotations are undefined', () => {
    const cluster = new NormanCluster({}, ctx);

    expect(cluster.systemLabels).toStrictEqual([]);
    expect(cluster.systemAnnotations).toStrictEqual([]);
  });

  it('should list all the cluster\'s annotation keys that contain coreos.com, cattle.io, k3s.io, kubernetes.io, or k3s.io', () => {
    const testAnnotations = ['cattle.io/test', 'coreos.com', 'test.cattle.io/something', 'kubernetes.io/test'];
    const cluster = new NormanCluster({
      annotations: {
        'cattle.io/test':           'abc',
        'coreos.com':               'abc',
        'k3s.io/test':              'abc',
        'test.cattle.io/something': 'abc',
        'kubernetes.io/test':       'abc',
        'other-label':              'abc'
      }
    }, ctx);

    expect(testAnnotations.find((annotation) => !cluster.systemAnnotations.includes(annotation))).toBeUndefined();
  });

  it('should list all the cluster\'s label keys that contain io.cattle.lifecycle, kubernetes.io, cattle.io, or k3s.io', () => {
    const testLabels = ['cattle.io/test', 'test.io.cattle.lifecycle', 'test.kubernetes.io/test', 'k3s.io/test'];
    const cluster = new NormanCluster({
      labels: {
        'cattle.io/test':           'abc',
        'test.io.cattle.lifecycle': 'abc',
        'k3s.io/test':              'abc',
        'test.kubernetes.io/test':  'abc',
        'other-label':              'abc'
      }
    }, ctx);

    expect(testLabels.find((label) => !cluster.systemLabels.includes(label))).toBeUndefined();
  });
});
