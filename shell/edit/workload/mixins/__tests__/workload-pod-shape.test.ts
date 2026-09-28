import workloadMixin from '@shell/edit/workload/mixins/workload.js';
import { POD } from '@shell/config/types';

/**
 * Unit tests for https://github.com/rancher/dashboard/issues/10171
 *
 * A standalone Pod should be created/edited in its native shape (spec.*),
 * NOT wrapped in a Workload's spec.template.spec. These tests invoke the real
 * mixin computeds/methods with a controlled `this` to prove the pod branch keeps
 * the native shape so "Edit as YAML" serialises a valid Pod without reshaping.
 */
describe('workload mixin: Pod uses native shape', () => {
  const podCtx = () => {
    const value: any = {
      type:     POD,
      metadata: { name: 'my-pod', namespace: 'default' },
      spec:     { containers: [{ name: 'container-0', image: 'nginx' }], initContainers: [] },
    };

    // The model's `containers` getter prefers spec.containers when present
    Object.defineProperty(value, 'containers', {
      get() {
        return value.spec.containers;
      }
    });

    return {
      value,
      spec:      value.spec,
      isPod:     true,
      isCronJob: false,
    } as any;
  };

  describe('computed: podTemplateSpec', () => {
    it('get returns spec itself (not spec.template.spec)', () => {
      const ctx = podCtx();

      const out = (workloadMixin.computed as any).podTemplateSpec.get.call(ctx);

      expect(out).toBe(ctx.spec);
      expect(out.containers[0].name).toBe('container-0');
      expect(out.template).toBeUndefined();
    });

    it('set writes back to spec and keeps value.spec in sync', () => {
      const ctx = podCtx();
      const neu = { containers: [{ name: 'replaced' }] };

      (workloadMixin.computed as any).podTemplateSpec.set.call(ctx, neu);

      expect(ctx.spec).toBe(neu);
      expect(ctx.value.spec).toBe(neu);
    });
  });

  describe('computed: podLabels / podAnnotations', () => {
    it('read and write pod metadata directly', () => {
      const ctx = podCtx();

      const labels = (workloadMixin.computed as any).podLabels.get.call(ctx);

      expect(labels).toBe(ctx.value.metadata.labels);

      (workloadMixin.computed as any).podAnnotations.set.call(ctx, { foo: 'bar' });
      expect(ctx.value.metadata.annotations).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('method: saveWorkload', () => {
    it('saves a Pod in native shape with no template or selector', () => {
      const ctx = {
        ...podCtx(),
        type:             POD,
        mode:             'create',
        realMode:         'create',
        container:        undefined,
        portsForServices: [],
        fixNodeAffinity:  jest.fn(),
        fixPodAffinity:   jest.fn(),
        nvidiaIsValid:    jest.fn(() => true),
      } as any;

      (workloadMixin.methods as any).saveWorkload.call(ctx);

      // No workload wrapping and no workload-only selector on a Pod
      expect(ctx.spec.template).toBeUndefined();
      expect(ctx.spec.selector).toBeUndefined();

      // Containers stay at spec.containers, and value.spec points at the pod spec
      expect(ctx.spec.containers[0].name).toBe('container-0');
      expect(ctx.value.spec).toBe(ctx.spec);

      // Namespace is carried onto the pod metadata
      expect(ctx.value.metadata.namespace).toBe('default');
    });
  });

  describe('method: saveWorkload — edit mode', () => {
    it('does not throw and preserves native shape when saving a Pod in edit mode', () => {
      const ctx = {
        ...podCtx(),
        type:             POD,
        mode:             'edit',
        realMode:         'edit',
        container:        undefined,
        portsForServices: [],
        fixNodeAffinity:  jest.fn(),
        fixPodAffinity:   jest.fn(),
        nvidiaIsValid:    jest.fn(() => true),
      } as any;

      // Seed the empty affinity shape that #18238 was triggered by
      ctx.value.spec.affinity = {
        podAntiAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution:  [],
          preferredDuringSchedulingIgnoredDuringExecution: [],
        },
      };
      ctx.spec = ctx.value.spec;

      expect(() => (workloadMixin.methods as any).saveWorkload.call(ctx)).not.toThrow();

      // Still native Pod shape — no template wrapping introduced
      expect(ctx.spec.template).toBeUndefined();
      expect(ctx.spec.selector).toBeUndefined();
    });
  });
});
