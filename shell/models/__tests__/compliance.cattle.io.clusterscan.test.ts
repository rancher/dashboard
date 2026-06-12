import ClusterScan from '@shell/models/compliance.cattle.io.clusterscan';

/**
 * Build a ClusterScan model wired to a mocked store `dispatch`.
 * `$dispatch` resolves to `this.$ctx.dispatch`, so injecting it via the
 * constructor context is enough to exercise `_resolveExportMetadata`.
 */
const makeScan = (dispatch: jest.Mock) => new ClusterScan({}, {
  getters:     {},
  rootGetters: {},
  dispatch,
} as any) as any;

const benchmarkWithConfigMap = {
  spec: {
    customBenchmarkConfigMapName:      'metadata-cm',
    customBenchmarkConfigMapNamespace: 'compliance',
  },
};

describe('class: ClusterScan', () => {
  describe('method: _resolveExportMetadata', () => {
    it('returns empty metadata and decorations when the benchmark is undefined', async() => {
      const dispatch = jest.fn();
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(undefined);

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns empty when the ConfigMap name is missing', async() => {
      const dispatch = jest.fn();
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata({ spec: { customBenchmarkConfigMapNamespace: 'compliance' } });

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns empty when the ConfigMap namespace is missing', async() => {
      const dispatch = jest.fn();
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata({ spec: { customBenchmarkConfigMapName: 'metadata-cm' } });

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('fetches the ConfigMap by namespace/name from the configmap type', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: {} });
      const scan = makeScan(dispatch);

      await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(dispatch).toHaveBeenCalledWith('find', { type: 'configmap', id: 'compliance/metadata-cm' });
    });

    it('returns empty when the ConfigMap has no metadata.yaml data key', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: { 'other.yaml': 'title: x' } });
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
    });

    it('returns empty when the ConfigMap itself is not found', async() => {
      const dispatch = jest.fn().mockResolvedValue(undefined);
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
    });

    it('splits top-level fields into metadata and the checks map into decorations', async() => {
      const yaml = [
        'title: CIS Kubernetes Benchmark',
        'description: A CIS profile',
        'referenceType: cis',
        'checks:',
        '  "5.1.1":',
        '    ruleId: CIS-5.1.1-rule',
        '    severity: high',
        '    idents:',
        '      - system: https://www.cisecurity.org/controls/',
        '        value: CIS-CSC-3',
        '  "5.1.2":',
        '    ruleId: CIS-5.1.2-rule',
      ].join('\n');
      const dispatch = jest.fn().mockResolvedValue({ data: { 'metadata.yaml': yaml } });
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result.metadata).toStrictEqual({
        title:         'CIS Kubernetes Benchmark',
        description:   'A CIS profile',
        referenceType: 'cis',
      });
      expect(result.decorations).toStrictEqual({
        '5.1.1': {
          ruleId:   'CIS-5.1.1-rule',
          severity: 'high',
          idents:   [{ system: 'https://www.cisecurity.org/controls/', value: 'CIS-CSC-3' }],
        },
        '5.1.2': { ruleId: 'CIS-5.1.2-rule' },
      });
    });

    it('returns empty decorations when metadata.yaml has no checks map', async() => {
      const yaml = ['title: STIG', 'source: disa'].join('\n');
      const dispatch = jest.fn().mockResolvedValue({ data: { 'metadata.yaml': yaml } });
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result.metadata).toStrictEqual({ title: 'STIG', source: 'disa' });
      expect(result.decorations).toStrictEqual({});
    });

    it('returns empty when the ConfigMap lookup rejects', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('not found'));
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
    });

    it('returns empty when metadata.yaml is malformed YAML', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: { 'metadata.yaml': 'title: "unterminated' } });
      const scan = makeScan(dispatch);

      const result = await scan._resolveExportMetadata(benchmarkWithConfigMap);

      expect(result).toStrictEqual({ metadata: {}, decorations: {} });
    });
  });
});
