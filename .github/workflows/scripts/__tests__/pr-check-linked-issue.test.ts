/* eslint-disable @typescript-eslint/no-var-requires */
// Unit tests for pr-check-linked-issue.js, which fails a PR that neither fixes an issue
// nor has a label allowing it to proceed without one.
const { getReferencedIssues, hasLabel, checkLinkedIssue } = require('../pr-check-linked-issue');

const labels = (...names: string[]) => names.map((name) => ({ name }));

describe('getReferencedIssues', () => {
  it.each([
    ['Fixes #123', [123]],
    ['fixes #123', [123]],
    ['Fix #123', [123]],
    ['Fixed #123', [123]],
    ['Closes #123', [123]],
    ['closed #123', [123]],
    ['Resolves #123', [123]],
    ['resolved #123', [123]],
    ['Fixes https://github.com/rancher/dashboard/issues/123', [123]],
    ['Fixes #123\nFixes #456', [123, 456]],
    ['Related to #123', []],
    ['', []],
  ])('parses %p as %p', (body, expected) => {
    expect(getReferencedIssues(body)).toStrictEqual(expected);
  });
});

describe('hasLabel', () => {
  it.each([
    ['matches an exact label', labels('QA/None'), true],
    ['matches regardless of case', labels('qa/none'), true],
    ['does not match a different label', labels('QA/manual-test'), false],
    ['handles no labels', [], false],
  ])('%s', (_desc, prLabels, expected) => {
    expect(hasLabel({ labels: prLabels }, 'QA/None')).toStrictEqual(expected);
  });

  it('handles a missing labels property', () => {
    expect(hasLabel({}, 'QA/None')).toStrictEqual(false);
  });
});

describe('checkLinkedIssue', () => {
  it.each([
    ['fixes an issue', 'Fixes #123', [], true],
    ['fixes an issue and has QA/None', 'Fixes #123', labels('QA/None'), true],
    ['has the QA/None label', 'No issue', labels('QA/None'), true],
    ['has the area/dependencies label', 'Bump foo', labels('area/dependencies'), true],
    ['has neither an issue nor an allowed label', 'No issue', labels('kind/bug'), false],
    ['has no body and no labels', null, [], false],
  ])('PR that %s passes: %p', (_desc, body, prLabels, expected) => {
    const { ok } = checkLinkedIssue({ body, labels: prLabels });

    expect(ok).toStrictEqual(expected);
  });

  it('explains how to fix a failing PR', () => {
    const { message } = checkLinkedIssue({ body: '', labels: [] });

    expect(message).toStrictEqual('Error: A PR MUST either declare which issues it fixes (e.g. \'Fixes #1234\') OR must have the \'QA/None\' label');
  });
});
