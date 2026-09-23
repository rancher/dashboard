import workloadMixin from '@shell/edit/workload/mixins/workload.js';

describe('workload mixin: container validation', () => {
  const mockT = (key: string) => key;
  const mockStore = {
    getters: {
      'i18n/t':     mockT,
      currentStore: () => 'cluster',
    },
  };

  function buildCtx(containers: any[], initContainers: any[] = []) {
    return {
      podTemplateSpec:          { containers, initContainers },
      idKey:                    '_id',
      $store:                   mockStore,
      t:                        mockT,
      volumeClaimTemplateNames: [],
      volumeMountsOf:           (workloadMixin.methods as any).volumeMountsOf,
    } as any;
  }

  describe('computed: containerNameRules', () => {
    it('returns an array with a required validator', () => {
      const ctx = buildCtx([]);
      const rules = (workloadMixin.computed as any).containerNameRules.call(ctx);

      expect(rules).toHaveLength(1);
      expect(rules[0]('')).toStrictEqual('validation.required');
      expect(rules[0]('some-name')).toBeUndefined();
    });
  });

  describe('computed: containerImageRules', () => {
    it('returns an array with a required validator', () => {
      const ctx = buildCtx([]);
      const rules = (workloadMixin.computed as any).containerImageRules.call(ctx);

      expect(rules).toHaveLength(1);
      expect(rules[0]('')).toStrictEqual('validation.required');
      expect(rules[0]('nginx:latest')).toBeUndefined();
    });
  });

  describe('computed: volumeMountPathRules', () => {
    it('returns an array with a required validator', () => {
      const ctx = buildCtx([]);
      const rules = (workloadMixin.computed as any).volumeMountPathRules.call(ctx);

      expect(rules).toHaveLength(1);
      expect(rules[0]('')).toStrictEqual('validation.required');
      expect(rules[0]('/data')).toBeUndefined();
    });
  });

  describe('computed: allContainers', () => {
    it('sets error.storage when a volume mount has no mount path', () => {
      const ctx = buildCtx([{
        name: 'container-0', image: 'nginx', volumeMounts: [{ name: 'vol', mountPath: '/data' }, { name: 'vol' }]
      }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result[0].error.storage).toStrictEqual('workload.validation.volumeMountPath');
    });

    it('clears error.storage when every volume mount has a mount path', () => {
      const ctx = buildCtx([{
        name: 'container-0', image: 'nginx', volumeMounts: [{ name: 'vol', mountPath: '/data' }]
      }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result[0].error.storage).toBeUndefined();
    });

    it('validates init container mount paths the same as regular containers', () => {
      const ctx = buildCtx(
        [{ name: 'main', image: 'nginx' }],
        [{
          name: 'init', image: 'busybox', volumeMounts: [{ name: 'vol' }]
        }],
      );
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result[0].error.storage).toBeUndefined();
      expect(result[1].error.storage).toStrictEqual('workload.validation.volumeMountPath');
    });

    it('sets error.general when container is missing both name and image', () => {
      const ctx = buildCtx([{ image: '' }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].error.general).toBeTruthy();
    });

    it('sets error.general when container is missing name', () => {
      const ctx = buildCtx([{ image: 'nginx' }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].error.general).toBeTruthy();
    });

    it('sets error.general when container is missing image', () => {
      const ctx = buildCtx([{ name: 'container-0' }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].error.general).toBeTruthy();
    });

    it('clears error.general when container has both name and image', () => {
      const ctx = buildCtx([{ name: 'container-0', image: 'nginx' }]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].error.general).toBeUndefined();
    });

    it('validates init containers the same as regular containers', () => {
      const ctx = buildCtx(
        [{ name: 'main', image: 'nginx' }],
        [{ image: 'busybox' }],
      );
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(2);
      expect(result[0].error.general).toBeUndefined();
      expect(result[1].error.general).toBeTruthy();
    });

    it('reports per-container errors independently', () => {
      const ctx = buildCtx([
        { name: 'valid', image: 'nginx' },
        { name: '', image: 'nginx' },
        { name: 'no-image' },
      ]);
      const result = (workloadMixin.computed as any).allContainers.call(ctx);

      expect(result).toHaveLength(3);
      expect(result[0].error.general).toBeUndefined();
      expect(result[1].error.general).toBeTruthy();
      expect(result[2].error.general).toBeTruthy();
    });
  });
});
