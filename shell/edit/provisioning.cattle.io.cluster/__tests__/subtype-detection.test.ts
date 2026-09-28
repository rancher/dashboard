import { resolveSubType } from '@shell/edit/provisioning.cattle.io.cluster/subtype-detection';
import { SUB_TYPE } from '@shell/config/query-params';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';

describe('CruCluster: resolveSubType()', () => {
  describe('annotation-based detection (ui.rancher/provider)', () => {
    it('should use UI_CUSTOM_PROVIDER annotation when matching extension exists', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'k3k' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('k3k');
    });

    it('should fall back to imported when annotation has no matching extension', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'aks' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('imported');
    });

    it('should prioritize annotation over isImported', () => {
      // This is the exact virtual cluster (k3k) scenario https://github.com/rancher/dashboard/issues/18544
      // - isImported is true (k3k uses k3s, so status.provider = 'k3s', status.driver = 'k3s')
      // - provisioner is 'K3S' (doesn't match extension ID 'k3k')
      // - annotation 'ui.rancher/provider' = 'k3k' (matches extension)
      const result = resolveSubType({
        query: {},
        value: {
          id:          'fleet-default/my-vcluster',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [
          { id: 'k3k' },
          { id: 'aks' },
        ],
        realMode: 'edit',
      });

      expect(result).toStrictEqual('k3k');
    });

    it('should use annotation even when cluster is not classified as imported', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  false,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'SomeDriver',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'k3k' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('k3k');
    });
  });

  describe('imported cluster handling', () => {
    it('should use imported subType for generic imported clusters without annotation', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'imported',
          annotations: {},
        },
        extensions: [],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('imported');
    });

    it('should override imported subType when provisioner matches an extension (GKE)', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'GKE',
          annotations: {},
        },
        extensions: [{ id: 'gke' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('gke');
    });

    it('should remain imported when provisioner does not match any extension', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: {},
        },
        extensions: [{ id: 'aks' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('imported');
    });
  });

  describe('local cluster handling', () => {
    it('should set local subType for local clusters', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'fleet-local/local',
          isImported:  false,
          isLocal:     true,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: {},
        },
        extensions: [],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('local');
    });
  });

  describe('query parameter priority', () => {
    it('should prefer SUB_TYPE query parameter over annotation', () => {
      const result = resolveSubType({
        query: { [SUB_TYPE]: 'custom' },
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'K3S',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'k3k' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('custom');
    });

    it('should prefer SUB_TYPE query parameter over isImported', () => {
      const result = resolveSubType({
        query: { [SUB_TYPE]: 'amazonec2' },
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'imported',
          annotations: {},
        },
        extensions: [],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('amazonec2');
    });
  });

  describe('RKE2 cluster auto-detection', () => {
    it('should detect custom RKE2 cluster in edit mode', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  false,
          isLocal:     false,
          isRke2:      true,
          isCustom:    true,
          provisioner: 'rke2',
          annotations: {},
        },
        extensions: [],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('custom');
    });

    it('should detect custom RKE2 cluster in view mode when as=config', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  false,
          isLocal:     false,
          isRke2:      true,
          isCustom:    true,
          provisioner: 'rke2',
          annotations: {},
        },
        extensions: [],
        realMode:   'view',
        as:         'config',
      });

      expect(result).toStrictEqual('custom');
    });

    it('should use machineProvider for RKE2 clusters with machine pools', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:              'some-cluster-id',
          isImported:      false,
          isLocal:         false,
          isRke2:          true,
          isCustom:        false,
          provisioner:     'rke2',
          machineProvider: 'amazonec2',
          annotations:     {},
        },
        extensions: [],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('amazonec2');
    });
  });

  describe('create mode (new cluster, no id)', () => {
    it('should return null when no query param and cluster has no id', () => {
      const result = resolveSubType({
        query: {},
        value: {
          isImported:  false,
          isLocal:     false,
          isRke2:      false,
          annotations: {},
        },
        extensions: [],
        realMode:   'create',
      });

      expect(result).toStrictEqual(null);
    });

    it('should still respect query param even without cluster id', () => {
      const result = resolveSubType({
        query: { [SUB_TYPE]: 'amazonec2' },
        value: {
          isImported:  false,
          isLocal:     false,
          isRke2:      false,
          annotations: {},
        },
        extensions: [],
        realMode:   'create',
      });

      expect(result).toStrictEqual('amazonec2');
    });
  });

  describe('edge cases with undefined/empty values', () => {
    it('should handle undefined annotations gracefully', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:         'some-cluster-id',
          isImported: true,
          isLocal:    false,
          isRke2:     false,
        },
        extensions: [{ id: 'k3k' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('imported');
    });

    it('should handle empty string annotation value', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: '' },
        },
        extensions: [{ id: '' }],
        realMode:   'edit',
      });

      // Empty string is falsy, so annotation check is skipped
      expect(result).toStrictEqual('imported');
    });

    it('should handle undefined provisioner for imported cluster', () => {
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: undefined,
          annotations: {},
        },
        extensions: [{ id: 'aks' }],
        realMode:   'edit',
      });

      // No provisioner means the provisioner-to-extension override is skipped
      expect(result).toStrictEqual('imported');
    });
  });

  describe('priority conflicts between annotation and provisioner', () => {
    it('should use annotation over provisioner-to-extension match when both apply', () => {
      // Cluster is imported, has annotation=k3k, AND provisioner=AKS with AKS extension loaded
      // Annotation should win since it's checked first
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'AKS',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'k3k' }, { id: 'aks' }],
        realMode:   'edit',
      });

      expect(result).toStrictEqual('k3k');
    });

    it('should use provisioner-to-extension match when annotation is present but extension not loaded', () => {
      // Annotation = k3k (no extension), provisioner = AKS (extension loaded)
      const result = resolveSubType({
        query: {},
        value: {
          id:          'some-cluster-id',
          isImported:  true,
          isLocal:     false,
          isRke2:      false,
          provisioner: 'AKS',
          annotations: { [CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER]: 'k3k' },
        },
        extensions: [{ id: 'aks' }],
        realMode:   'edit',
      });

      // Annotation doesn't match any extension → falls to imported → provisioner override kicks in
      expect(result).toStrictEqual('aks');
    });
  });
});
