import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';

describe('component: rke2, computed: generateName', () => {
  const defaultGenerateName = 'registryconfig-auth-';

  it('should return default generate name when empty registry hostname', () => {
    const localThis = { registryHost: '' };

    expect(rke2.computed.generateName.call(localThis)).toBe(defaultGenerateName);
  });

  it('should return registry hostname generate name', () => {
    const localThis = { registryHost: 'a.a.a' };

    expect(rke2.computed.generateName.call(localThis)).toBe(`${ localThis.registryHost }-`);
  });
});
