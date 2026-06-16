import { useResourceCardRow, useResourceCardRowFromRelationships } from '@shell/components/Resource/Detail/Card/StateCard/composables';

describe('useResourceCardRow', () => {
  describe('with default keys', () => {
    it('should return undefined counts when resources is empty', () => {
      const result = useResourceCardRow('Test', []);

      expect(result.label).toBe('Test');
      expect(result.color).toBeUndefined();
      expect(result.counts).toBeUndefined();
    });

    it('should aggregate resources by stateDisplay', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'error', stateDisplay: 'Failed' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.label).toBe('Pods');
      expect(result.counts).toHaveLength(2);
    });

    it('should return highest alert color as the main color', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'error', stateDisplay: 'Failed' },
        { stateSimpleColor: 'warning', stateDisplay: 'Pending' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.color).toBe('error');
    });

    it('should sort counts by alert level (error first)', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'error', stateDisplay: 'Failed' },
        { stateSimpleColor: 'warning', stateDisplay: 'Pending' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.counts![0].color).toBe('error');
      expect(result.counts![1].color).toBe('warning');
      expect(result.counts![2].color).toBe('success');
    });

    it('should sort by count when colors are equal', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'success', stateDisplay: 'Running' },
        { stateSimpleColor: 'success', stateDisplay: 'Completed' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.counts![0].label).toBe('running');
      expect(result.counts![0].count).toBe(3);
      expect(result.counts![1].label).toBe('completed');
      expect(result.counts![1].count).toBe(1);
    });

    it('should use default color when stateSimpleColor is undefined', () => {
      const resources = [
        { stateDisplay: 'Unknown' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.color).toBe('disabled');
    });

    it('should include to parameter when provided', () => {
      const to = { hash: '#pods' };
      const result = useResourceCardRow('Pods', [], undefined, undefined, to);

      expect(result.to).toStrictEqual(to);
    });
  });

  describe('with custom keys', () => {
    it('should use custom stateColorKey', () => {
      const resources = [
        { customColor: 'error', stateDisplay: 'Failed' },
        { customColor: 'success', stateDisplay: 'Running' }
      ];

      const result = useResourceCardRow('Conditions', resources, 'customColor');

      expect(result.color).toBe('error');
    });

    it('should use custom stateDisplayKey', () => {
      const resources = [
        { stateSimpleColor: 'success', condition: 'Available' },
        { stateSimpleColor: 'success', condition: 'Available' },
        { stateSimpleColor: 'success', condition: 'Progressing' }
      ];

      const result = useResourceCardRow('Conditions', resources, undefined, 'condition');

      // Both have same color (success), so sorted by count (higher first)
      expect(result.counts![0].label).toBe('available');
      expect(result.counts![0].count).toBe(2);
      expect(result.counts![1].label).toBe('progressing');
      expect(result.counts![1].count).toBe(1);
    });

    it('should use both custom keys together', () => {
      const resources = [
        { statusColor: 'error', status: 'False' },
        { statusColor: 'disabled', status: 'True' }
      ];

      const result = useResourceCardRow('Status', resources, 'statusColor', 'status');

      expect(result.color).toBe('error');
      expect(result.counts).toContainEqual(expect.objectContaining({ label: 'false', color: 'error' }));
      expect(result.counts).toContainEqual(expect.objectContaining({ label: 'true', color: 'disabled' }));
    });
  });

  describe('lowercase handling', () => {
    it('should convert stateDisplay to lowercase', () => {
      const resources = [
        { stateSimpleColor: 'success', stateDisplay: 'RUNNING' },
        { stateSimpleColor: 'success', stateDisplay: 'Running' }
      ];

      const result = useResourceCardRow('Pods', resources);

      expect(result.counts).toHaveLength(1);
      expect(result.counts![0].label).toBe('running');
      expect(result.counts![0].count).toBe(2);
    });
  });
});

describe('useResourceCardRowFromRelationships', () => {
  it('should return empty props for empty relationships', () => {
    const result = useResourceCardRowFromRelationships('Refers to', []);

    expect(result.label).toBe('Refers to');
    expect(result.color).toBeUndefined();
    expect(result.counts).toBeUndefined();
  });

  it('should aggregate relationship states', () => {
    const rels = [
      { toType: 'configmap', state: 'active' },
      { toType: 'secret', state: 'active' },
      { toType: 'serviceaccount', state: 'error' }
    ];

    const result = useResourceCardRowFromRelationships('Refers to', rels);

    expect(result.counts).toHaveLength(2);
    expect(result.counts).toContainEqual(expect.objectContaining({ label: 'active', count: 2 }));
    expect(result.counts).toContainEqual(expect.objectContaining({ label: 'error', count: 1 }));
  });

  it('should default missing state to "missing"', () => {
    const rels = [
      { toType: 'configmap' },
      { toType: 'secret', state: 'active' }
    ];

    const result = useResourceCardRowFromRelationships('Refers to', rels);

    expect(result.counts).toContainEqual(expect.objectContaining({
      label: 'missing', count: 1, color: 'warning'
    }));
    expect(result.counts).toContainEqual(expect.objectContaining({
      label: 'active', count: 1, color: 'success'
    }));
  });

  it('should set the highest alert color as main color', () => {
    const rels = [
      { toType: 'configmap', state: 'active' },
      { toType: 'secret', state: 'error' }
    ];

    const result = useResourceCardRowFromRelationships('Refers to', rels);

    expect(result.color).toBe('error');
  });

  it('should sort by alert level then by count', () => {
    const rels = [
      { toType: 'a', state: 'active' },
      { toType: 'b', state: 'active' },
      { toType: 'c', state: 'active' },
      { toType: 'd', state: 'error' },
      { toType: 'e', state: 'warning' },
      { toType: 'f', state: 'warning' }
    ];

    const result = useResourceCardRowFromRelationships('Refers to', rels);

    expect(result.counts![0].color).toBe('error');
    expect(result.counts![1].color).toBe('warning');
    expect(result.counts![2].color).toBe('success');
  });

  it('should pass the to parameter through', () => {
    const to = { hash: '#related' };
    const result = useResourceCardRowFromRelationships('Refers to', [], to);

    expect(result.to).toStrictEqual(to);
  });

  it('should handle all relationships having no state', () => {
    const rels = [
      { toType: 'configmap' },
      { toType: 'secret' }
    ];

    const result = useResourceCardRowFromRelationships('Refers to', rels);

    expect(result.counts).toHaveLength(1);
    expect(result.counts![0]).toStrictEqual(expect.objectContaining({
      label: 'missing', count: 2, color: 'warning'
    }));
  });
});
