import Csi from '@shell/edit/workload/storage/csi/index.vue';
import LonghornDriver from '@shell/edit/workload/storage/csi/driver.longhorn.io.vue';

describe('component: workload storage csi', () => {
  it('should offer the drivers that have a form', () => {
    expect((Csi as any).computed.driverOpts.call({})).toStrictEqual(['driver.longhorn.io']);
  });

  it.each([
    ['driver.longhorn.io', LonghornDriver],
    ['example.com/unknown', undefined],
  ])('should use the form for driver %p', (driver, expected) => {
    expect((Csi as any).computed.driverComponent.call({ value: { csi: { driver } } })).toStrictEqual(expected);
  });
});
