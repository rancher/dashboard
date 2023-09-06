import Pod from '@shell/detail/pod.vue';

describe('detail: pod computed containers', () => {
  it('should support downloadFile', () => {
    const localThis = { allContainers: [{ name: 'test' }], value: { containerIsInit: (t) => t } };

    const result = Pod.computed.containers.call(localThis);

    expect(result[0].downloadFile).toBeDefined();
  });
});
