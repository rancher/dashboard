import { diffUpstreamSpec } from '@pkg/aks/util/aks.ts';

describe('fx: diffUpstreamSpec', () => {
  it.each([
    [{ a: 'a' }, { a: 'a' }, { }],
    [{ a: 'a', b: 'b' }, { a: 'a', b: 'b1' }, { b: 'b1' }],
    [{ a: [1, 2], b: [1, 2, 3] }, { a: [1, 2], b: [1, 2, 3, 4] }, { b: [1, 2, 3, 4] }],
    [{ a: { aa: 'a', ab: 'b' }, b: { ba: 'a', bb: 'b' } }, { a: { aa: 'a', ab: 'b' }, b: { ba: 'a1', bb: 'b' } }, { b: { ba: 'a1' } }]
  ])('should exclude fields that are unchanged between upstream and local spec', (upstream, local, diff) => {
    expect(diffUpstreamSpec(upstream, local)).toStrictEqual(diff);
  });

  it.each([
    [{ a: 'a' }, { a: null }, { }],
    [{ a: 'a' }, { b: null }, { }],
  ])('should exclude fields that are null on the local object regardless of upstream definition', (upstream, local, diff) => {
    expect(diffUpstreamSpec(upstream, local)).toStrictEqual(diff);
  });

  it.each([
    [{ a: null }, { a: {} }, {}],
    [{ a: null }, { a: [] }, {}],
    [{ a: null }, { a: '' }, {}],
  ])('should consider null upstream and empty object/string/array locally as unchanged and exclude those fields', (upstream, local, diff) => {
    expect(diffUpstreamSpec(upstream, local)).toStrictEqual(diff);
  });

  it.each([
    [{
      nodePools: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }, {
      nodePools: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }, {
      nodePools: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }],
    [{
      nodeGroups: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }, {
      nodeGroups: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }, {
      nodeGroups: [{
        a: 'a', b: [1, 2, 3], c: { ca: 'a', cb: [1, 2, 3] }
      }, { a1: 'a1' }]
    }],
    [{
      nodePools: [{
        a: 'a',
        b: [1, 2, 3],
        c: {
          ca: 'a', cb: [1, 2, 3], cc: { cca: 'a' }
        }
      }, { a1: 'a1' }]
    }, {
      nodePools: [{
        a: 'a',
        b: [],
        c: {
          ca: 'a', cb: [1], cc: {}
        }
      }, {}]
    }, {
      nodePools: [{
        a: 'a',
        b: [],
        c: {
          ca: 'a', cb: [1], cc: {}
        }
      }, {}]
    }],
    [{ nodePools: [{ a: 'a' }, { b: 'b' }] }, { nodePools: [] }, { nodePools: [] }]
  ])('should include entirety of nodePools and nodeGroups from the local object', (upstream, local, diff) => {
    expect(diffUpstreamSpec(upstream, local)).toStrictEqual(diff);
  });

  it.each([
    [{ labels: { a: 'a', b: 'b' } }, { labels: { a: 'a', b: 'b1' } }, { labels: { a: 'a', b: 'b1' } }],
    [{ tags: { a: 'a', b: 'b' } }, { tags: { a: 'a', b: 'b1' } }, { tags: { a: 'a', b: 'b1' } }],
    [{ labels: { a: 'a', b: 'b' } }, { labels: { a: 'a', b: 'b' } }, {}],
  ])('should include all of tags and labels unless upstream and local are deeply equal', (upstream, local, diff) => {
    expect(diffUpstreamSpec(upstream, local)).toStrictEqual(diff);
  });
});
