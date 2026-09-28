/* eslint-disable @typescript-eslint/no-var-requires */
// Unit tests for the pure helpers in weekly-stale-issue-manager.js.
// The module is plain CommonJS, so it is pulled in with require() (same pattern
// as shell/utils/__tests__/versions.test.ts).
const mgr = require('../weekly-stale-issue-manager');

const DAY = 24 * 60 * 60 * 1000;
const daysAgoIso = (n: number) => new Date(Date.now() - (n * DAY)).toISOString();

describe('planActions (per-run action budget, closes first)', () => {
  const close = (n: number) => Array.from({ length: n }, (_, i) => ({ number: 100 + i }));
  const mark = (n: number) => Array.from({ length: n }, (_, i) => ({ number: 200 + i }));

  it.each([
    // [numClose, numMark, budget, expectClose, expectMark, expectDeferred]
    ['under budget: everything runs', 2, 3, 20, 2, 3, 0],
    ['closes alone exceed budget: no marks', 25, 10, 20, 20, 0, 15],
    ['closes first, marks fill the remainder', 5, 30, 20, 5, 15, 15],
    ['no closes: marks up to budget', 0, 5, 20, 0, 5, 0],
    ['closes exactly fill the budget', 20, 5, 20, 20, 0, 5],
    ['zero budget defers everything', 3, 3, 0, 0, 0, 6],
  ])('%s', (_label, nClose, nMark, budget, expClose, expMark, expDeferred) => {
    const { closes, marks, deferred } = mgr.planActions(close(nClose as number), mark(nMark as number), budget as number);

    expect(closes.length).toStrictEqual(expClose);
    expect(marks.length).toStrictEqual(expMark);
    expect(deferred).toStrictEqual(expDeferred);
  });

  it('prioritises closes by returning them before marks are considered', () => {
    const { closes, marks } = mgr.planActions(close(3), mark(3), 4);

    expect(closes.map((c: any) => c.number)).toStrictEqual([100, 101, 102]);
    expect(marks.map((m: any) => m.number)).toStrictEqual([200]);
  });
});

describe('isOwnComment', () => {
  it('matches the stale warning comment', () => {
    expect(mgr.isOwnComment({ body: 'This issue has been automatically marked as stale because it has not had any comments...' })).toStrictEqual(true);
  });

  it('matches the closing comment', () => {
    expect(mgr.isOwnComment({ body: "We're closing this issue because it hasn't been active..." })).toStrictEqual(true);
  });

  it('does not match an unrelated comment', () => {
    expect(mgr.isOwnComment({ body: 'still relevant, please keep open' })).toStrictEqual(false);
  });

  it('handles a missing body', () => {
    expect(mgr.isOwnComment({})).toStrictEqual(false);
  });
});

describe('isMeaningfulComment', () => {
  it('counts a real user comment', () => {
    expect(mgr.isMeaningfulComment({ author: { login: 'user', __typename: 'User' }, body: 'still relevant' })).toStrictEqual(true);
  });

  it('ignores bot comments', () => {
    expect(mgr.isMeaningfulComment({ author: { login: 'github-actions', __typename: 'Bot' }, body: 'hi' })).toStrictEqual(false);
  });

  it('ignores comments from deleted accounts (null author)', () => {
    expect(mgr.isMeaningfulComment({ author: null, body: 'hi' })).toStrictEqual(false);
  });

  it("ignores the bot's own stale warning even from a non-bot author", () => {
    expect(mgr.isMeaningfulComment({
      author: { login: 'user', __typename: 'User' },
      body:   'This issue has been automatically marked as stale because it has not had any comments',
    })).toStrictEqual(false);
  });
});

describe('analyze (staleness signals)', () => {
  const CREATED_OLD = '2020-01-01T00:00:00Z';
  const noDetail = { comments: { nodes: [] }, timelineItems: { nodes: [] } };

  it('an old issue with no activity is stale', () => {
    expect(mgr.analyze({ createdAt: CREATED_OLD }, noDetail).isStale).toStrictEqual(true);
  });

  it('a recent user comment makes it not stale', () => {
    const detail = { comments: { nodes: [{ createdAt: daysAgoIso(5), body: 'hi', author: { login: 'u', __typename: 'User' } }] }, timelineItems: { nodes: [] } };

    expect(mgr.analyze({ createdAt: CREATED_OLD }, detail).isStale).toStrictEqual(false);
  });

  it("the bot's own recent warning does not reset staleness", () => {
    const detail = { comments: { nodes: [{ createdAt: daysAgoIso(1), body: 'automatically marked as stale because it has not had any comments', author: { login: 'bot', __typename: 'Bot' } }] }, timelineItems: { nodes: [] } };

    expect(mgr.analyze({ createdAt: CREATED_OLD }, detail).isStale).toStrictEqual(true);
  });

  it('a recent reopen counts as activity', () => {
    const detail = { comments: { nodes: [] }, timelineItems: { nodes: [{ __typename: 'ReopenedEvent', createdAt: daysAgoIso(3) }] } };

    expect(mgr.analyze({ createdAt: CREATED_OLD }, detail).isStale).toStrictEqual(false);
  });

  it('reports no activity since the stale label when only a bot comment followed it', () => {
    const labeled = daysAgoIso(10);
    const detail = {
      comments:      { nodes: [{ createdAt: labeled, body: 'automatically marked as stale because it has not had any comments', author: { login: 'bot', __typename: 'Bot' } }] },
      timelineItems: { nodes: [{ __typename: 'LabeledEvent', createdAt: labeled, label: { name: mgr.STALE_LABEL } }] },
    };
    const result = mgr.analyze({ createdAt: CREATED_OLD }, detail);

    expect(result.activitySinceLabel).toStrictEqual(false);
    expect(result.staleLabelAddedDate).not.toBeNull();
  });

  it('detects a user comment posted after the stale label was applied', () => {
    const detail = {
      comments:      { nodes: [{ createdAt: daysAgoIso(2), body: 'this is still needed', author: { login: 'u', __typename: 'User' } }] },
      timelineItems: { nodes: [{ __typename: 'LabeledEvent', createdAt: daysAgoIso(10), label: { name: mgr.STALE_LABEL } }] },
    };

    expect(mgr.analyze({ createdAt: CREATED_OLD }, detail).activitySinceLabel).toStrictEqual(true);
  });
});
