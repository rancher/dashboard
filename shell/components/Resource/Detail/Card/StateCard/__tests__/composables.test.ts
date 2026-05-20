import { effectScope, ref } from 'vue';
import { useResourceCardRow, useResourceCardRowFromSummary, useResourceCardRowFromRelationships, useResourceSummary } from '@shell/components/Resource/Detail/Card/StateCard/composables';
import type { SummaryResult } from '@shell/components/Resource/Detail/Card/StateCard/composables';

const generation = ref(0);
const mockStore: any = {
  getters: {
    'cluster/normalizeType': (type: string) => type,
    'cluster/generation':    () => generation.value,
  },
  dispatch: jest.fn(),
};

jest.mock('vuex', () => ({ useStore: () => mockStore }));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

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

describe('useResourceCardRowFromSummary', () => {
  it('should return empty props when summaryResult is null', () => {
    const result = useResourceCardRowFromSummary('Services', null);

    expect(result.label).toBe('Services');
    expect(result.color).toBeUndefined();
    expect(result.counts).toBeUndefined();
  });

  it('should return empty props when summary array is empty', () => {
    const result = useResourceCardRowFromSummary('Services', { count: 0, summary: [] });

    expect(result.color).toBeUndefined();
    expect(result.counts).toBeUndefined();
  });

  it('should return empty props when summary is null', () => {
    const result = useResourceCardRowFromSummary('Services', { count: 5, summary: null });

    expect(result.color).toBeUndefined();
    expect(result.counts).toBeUndefined();
  });

  it('should return a plain count when no metadata.state.name entry exists', () => {
    const summary: SummaryResult = {
      count:   3,
      summary: [{ property: 'some.other.field', counts: { foo: 3 } }]
    };

    const result = useResourceCardRowFromSummary('Pods', summary);

    expect(result.counts).toStrictEqual([{ label: '', count: 3 }]);
  });

  it('should map state names to colors and display labels', () => {
    const summary: SummaryResult = {
      count:   5,
      summary: [{ property: 'metadata.state.name', counts: { running: 3, error: 2 } }]
    };

    const result = useResourceCardRowFromSummary('Pods', summary);

    expect(result.counts).toHaveLength(2);
    expect(result.counts).toContainEqual(expect.objectContaining({
      label: 'running', count: 3, color: 'success'
    }));
    expect(result.counts).toContainEqual(expect.objectContaining({
      label: 'error', count: 2, color: 'error'
    }));
  });

  it('should set the highest alert color as main color', () => {
    const summary: SummaryResult = {
      count:   4,
      summary: [{ property: 'metadata.state.name', counts: { active: 3, error: 1 } }]
    };

    const result = useResourceCardRowFromSummary('Services', summary);

    expect(result.color).toBe('error');
  });

  it('should sort by alert level then by count', () => {
    const summary: SummaryResult = {
      count:   6,
      summary: [{
        property: 'metadata.state.name',
        counts:   {
          active: 3, error: 1, warning: 2
        }
      }]
    };

    const result = useResourceCardRowFromSummary('Pods', summary);

    expect(result.counts![0].color).toBe('error');
    expect(result.counts![1].color).toBe('warning');
    expect(result.counts![2].color).toBe('success');
  });

  it('should pass the to parameter through', () => {
    const to = { hash: '#pods' };
    const result = useResourceCardRowFromSummary('Pods', null, to);

    expect(result.to).toStrictEqual(to);
  });

  it('should handle a single state', () => {
    const summary: SummaryResult = {
      count:   2,
      summary: [{ property: 'metadata.state.name', counts: { active: 2 } }]
    };

    const result = useResourceCardRowFromSummary('Services', summary);

    expect(result.counts).toHaveLength(1);
    expect(result.counts![0]).toStrictEqual(expect.objectContaining({
      label: 'active', count: 2, color: 'success'
    }));
    expect(result.color).toBe('success');
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

describe('useResourceSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generation.value = 0;
  });

  it('should fetch initial summary data', async() => {
    mockStore.dispatch.mockResolvedValue({
      count:   5,
      summary: [{ property: 'metadata.state.name', counts: { active: 5 } }]
    });

    const scope = effectScope();
    const { count, summary } = scope.run(() => useResourceSummary('pod', { summaryField: 'metadata.state.name' }))!;

    await flushPromises();

    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/fetchResourceSummary', {
      type: 'pod',
      opt:  { summaryField: 'metadata.state.name' }
    });
    expect(count.value).toBe(5);
    expect(summary.value).toStrictEqual([{ property: 'metadata.state.name', counts: { active: 5 } }]);

    scope.stop();
  });

  it('should not update refs when fetch returns undefined', async() => {
    mockStore.dispatch.mockResolvedValue(undefined);

    const scope = effectScope();
    const { count, summary } = scope.run(() => useResourceSummary('pod', { summaryField: 'metadata.state.name' }))!;

    await flushPromises();

    expect(count.value).toBe(0);
    expect(summary.value).toBeNull();

    scope.stop();
  });

  it('should refetch when generation changes', async() => {
    mockStore.dispatch
      .mockResolvedValueOnce({ count: 2, summary: [{ property: 'metadata.state.name', counts: { active: 2 } }] })
      .mockResolvedValueOnce({ count: 3, summary: [{ property: 'metadata.state.name', counts: { active: 3 } }] });

    const scope = effectScope();
    const { count, summary } = scope.run(() => useResourceSummary('pod', { summaryField: 'metadata.state.name' }))!;

    await flushPromises();
    expect(count.value).toBe(2);

    generation.value++;
    await flushPromises();

    expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
    expect(count.value).toBe(3);
    expect(summary.value).toStrictEqual([{ property: 'metadata.state.name', counts: { active: 3 } }]);

    scope.stop();
  });

  it('should stop watching when scope is disposed', async() => {
    mockStore.dispatch.mockResolvedValue({ count: 1, summary: null });

    const scope = effectScope();

    scope.run(() => useResourceSummary('pod', { summaryField: 'metadata.state.name' }));
    await flushPromises();

    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);

    scope.stop();

    generation.value++;
    await flushPromises();

    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
  });
});
