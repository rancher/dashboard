import AddCustomBadgeDialog from '@shell/dialog/AddCustomBadgeDialog.vue';

describe('component: AddCustomBadgeDialog', () => {
  const dialog = AddCustomBadgeDialog as any;

  // The dialog's own state for an existing cluster, without mounting it
  const previewOf = (currentCluster: object | null, isCreate = false) => dialog.computed.previewCluster.call({
    isCreate,
    currentCluster,
    badgeAsIcon:         false,
    badgeComment:        '',
    badgeBgColor:        'transparent',
    letter:              '',
    previewName:         'prod',
    generateBadgeObject: dialog.methods.generateBadgeObject,
  });

  // `ready` on the management model is its count of ready machines: 0 for an imported or hosted cluster
  it.each([
    ['a cluster with no machines that can be explored', { ready: 0, canExplore: true }, true],
    ['a cluster with ready machines that cannot be explored', { ready: 3, canExplore: false }, false],
  ])('should preview the chip of %s as the side nav shows it', (_label, cluster, ready) => {
    expect(previewOf({ isLocal: false, ...cluster }).ready).toBe(ready);
  });

  it('should preview a new cluster at full strength', () => {
    expect(previewOf(null, true).ready).toBe(true);
  });
});
