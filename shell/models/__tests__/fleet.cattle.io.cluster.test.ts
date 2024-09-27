import FleetCluster from '@shell/models/fleet.cattle.io.cluster';

describe('class FleetCluster', () => {
  it('should provide bundleInfo if correct data is present', () => {
    const fleetCluster = new FleetCluster({
      metadata: {},
      spec:     {},
      status:   { display: { readyBundles: '0/1' } },
    });

    expect(fleetCluster.bundleInfo.ready).toBe(0);
    expect(fleetCluster.bundleInfo.total).toBe(1);
    expect(Object.getOwnPropertyNames(fleetCluster.bundleInfo)).not.toContain('noValidData');
  });
  describe('should provide bundleInfo with error', () => {
    it.each([
      [''],
      ['/'],
      ['1/'],
      ['/1'],
      ['1/1/2'],
      ['a/1'],
      ['a/b'],
      ['any-string'],
      ['any-string1/string2']
    ])('with multiple scenarios of wrongful "readyBundles" data', (readyBundles) => {
      const fleetCluster = new FleetCluster({
        metadata: {},
        spec:     {},
        status:   { display: { readyBundles } },
      });

      expect(Object.getOwnPropertyNames(fleetCluster.bundleInfo)).toContain('noValidData');
    });
  });
});
