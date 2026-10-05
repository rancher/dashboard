import { buildStatusSummaryCard, compareStateColors } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/utils';

describe('utils: StatusSummaryCard', () => {
  describe('compareStateColors', () => {
    it.each([
      ['error', 'warning', -1],
      ['warning', 'disabled', -1],
      ['disabled', 'info', -1],
      ['info', 'success', -1],
      ['success', 'error', 4],
      ['error', 'error', 0],
    ])('should compare %p with %p as %p', (a, b, expected) => {
      expect(compareStateColors(a, b)).toStrictEqual(expected);
    });

    it('should sort unknown colors last', () => {
      expect(['unknown', 'success', 'error'].sort(compareStateColors)).toStrictEqual(['error', 'success', 'unknown']);
    });
  });

  describe('buildStatusSummaryCard', () => {
    const listRoute = { name: 'list' };
    const stateRoute = (name: string) => ({ name: 'list', query: { stateFilter: name } });

    it('should build a card with rows sorted by severity', () => {
      const card = buildStatusSummaryCard({
        key:    'apps.deployment',
        title:  'Deployments',
        to:     listRoute,
        states: [
          {
            name: 'active', count: 3, color: 'success'
          },
          {
            name: 'error', count: 1, color: 'error'
          },
        ],
        stateRoute,
      });

      expect(card).toStrictEqual({
        key:      'apps.deployment',
        title:    'Deployments',
        to:       listRoute,
        total:    4,
        segments: [{ color: 'error', percent: 25 }, { color: 'success', percent: 75 }],
        rows:     [
          {
            label: 'Error', color: 'error', count: 1, to: stateRoute('error')
          },
          {
            label: 'Active', color: 'success', count: 3, to: stateRoute('active')
          },
        ],
      });
    });

    it('should keep the input order of states that share a color when no state order is given', () => {
      const card = buildStatusSummaryCard({
        key:    'k',
        title:  'Title',
        states: [
          {
            name: 'expired', count: 1, color: 'error'
          },
          {
            name: 'error', count: 1, color: 'error'
          },
        ],
      });

      expect(card.rows.map((r) => r.label)).toStrictEqual(['Expired', 'Error']);
    });

    it('should order states that share a color by the given state order', () => {
      const card = buildStatusSummaryCard({
        key:    'k',
        title:  'Title',
        states: [
          {
            name: 'unlisted', count: 1, color: 'error'
          },
          {
            name: 'expired', count: 1, color: 'error'
          },
          {
            name: 'active', count: 1, color: 'success'
          },
          {
            name: 'error', count: 1, color: 'error'
          },
        ],
        stateOrder: ['active', 'error', 'expired'],
      });

      expect(card.rows.map((r) => r.label)).toStrictEqual(['Error', 'Expired', 'Unlisted', 'Active']);
    });

    it('should sort by color before the state order', () => {
      const card = buildStatusSummaryCard({
        key:    'k',
        title:  'Title',
        states: [
          {
            name: 'active', count: 1, color: 'success'
          },
          {
            name: 'error', count: 1, color: 'error'
          },
        ],
        stateOrder: ['active', 'error'],
      });

      expect(card.rows.map((r) => r.label)).toStrictEqual(['Error', 'Active']);
    });

    it('should group segments by color', () => {
      const card = buildStatusSummaryCard({
        key:    'node',
        title:  'Nodes',
        states: [
          {
            name: 'active', count: 1, color: 'success'
          },
          {
            name: 'running', count: 1, color: 'success'
          },
        ],
      });

      expect(card.segments).toStrictEqual([{ color: 'success', percent: 100 }]);
    });

    it('should leave out the routes when none are given', () => {
      const card = buildStatusSummaryCard({
        key:    'node',
        title:  'Nodes',
        states: [{
          name: 'active', count: 1, color: 'success'
        }],
      });

      expect(card).toStrictEqual({
        key:      'node',
        title:    'Nodes',
        total:    1,
        segments: [{ color: 'success', percent: 100 }],
        rows:     [{
          label: 'Active', color: 'success', count: 1
        }],
      });
    });

    it('should build an empty card when there are no states', () => {
      const card = buildStatusSummaryCard({
        key: 'node', title: 'Nodes', states: []
      });

      expect(card).toStrictEqual({
        key: 'node', title: 'Nodes', total: 0, segments: [], rows: []
      });
    });

    it('should not divide by zero when every count is zero', () => {
      const card = buildStatusSummaryCard({
        key:    'node',
        title:  'Nodes',
        states: [{
          name: 'active', count: 0, color: 'success'
        }],
      });

      expect(card.segments).toStrictEqual([]);
    });
  });
});
