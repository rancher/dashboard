import Pod from '@shell/models/pod.js';
import { POD } from '@shell/config/types';

const ctx = {
  getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
  dispatch:    jest.fn(),
  rootGetters: {
    'i18n/t':      jest.fn(),
    'i18n/exists': () => true,
  },
};

describe('class: Pod', () => {
  // The Pod form is shared with Workloads, which nest the pod spec under
  // spec.template.spec. "Edit as YAML" must serialize a valid, standalone Pod.
  // See https://github.com/rancher/dashboard/issues/10171
  describe('method: toYamlPreviewResource', () => {
    const container = {
      name:     'container-0',
      image:    'nginx',
      __active: true,
      active:   true,
      _init:    false,
      error:    'Container container-0 - "Container Image" is required.',
    };

    const workloadShapedPod = {
      type:     POD,
      metadata: { name: 'my-pod', namespace: 'default' },
      spec:     {
        selector: { matchLabels: { foo: 'bar' } },
        template: {
          metadata: { labels: { app: 'my-pod' } },
          spec:     {
            containers:     [{ ...container }],
            initContainers: [{ ...container, name: 'init-0' }],
          }
        }
      }
    };

    it('flattens spec.template into a valid Pod spec', () => {
      const pod = new Pod(workloadShapedPod, ctx);

      const out = pod.toYamlPreviewResource();

      // Pod spec should be at spec.*, not spec.template.spec.*
      expect(out.spec.template).toBeUndefined();
      expect(out.spec.containers).toHaveLength(1);
      expect(out.spec.containers[0].name).toBe('container-0');
      expect(out.spec.initContainers[0].name).toBe('init-0');

      // template.metadata should be merged into the pod metadata
      expect(out.metadata.labels).toStrictEqual({ app: 'my-pod' });
    });

    it('strips internal UI fields and the workload-only selector', () => {
      const pod = new Pod(workloadShapedPod, ctx);

      const out = pod.toYamlPreviewResource();

      ['__active', 'active', '_init', 'error'].forEach((key) => {
        expect(out.spec.containers[0]).not.toHaveProperty(key);
        expect(out.spec.initContainers[0]).not.toHaveProperty(key);
      });

      // spec.selector is added by the shared workload components but isn't valid on a Pod
      expect(out.spec.selector).toBeUndefined();
    });

    it('does not mutate the live model', () => {
      const pod = new Pod(workloadShapedPod, ctx);

      pod.toYamlPreviewResource();

      // The form still binds to spec.template.spec, so it must be left intact
      expect(pod.spec.template.spec.containers[0].name).toBe('container-0');
      expect(pod.spec.template.spec.containers[0]._init).toBe(false);
    });
  });

  describe('method: flattenPodTemplate', () => {
    it('returns the inputs unchanged when there is no template', () => {
      const pod = new Pod({
        type: POD, metadata: {}, spec: {}
      }, ctx);
      const spec = { containers: [{ name: 'c0' }] };
      const metadata = { name: 'already-flat' };

      const out = pod.flattenPodTemplate(spec, metadata);

      expect(out.spec).toBe(spec);
      expect(out.metadata).toBe(metadata);
    });
  });
});
