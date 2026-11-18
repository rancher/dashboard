import {
  decodeSharedViews, encodeSharedViews, importTableView, shareTableView, sharedTableKey, sharedTableType
} from '@shell/utils/table-views/share';
import type { SharedTableView } from '@shell/utils/table-views/share';

const running: SharedTableView = {
  name:           'Running',
  query:          'state:running namespace:"kube-system"',
  columns:        ['name', 'namespace', 'age'],
  columnOrder:    ['namespace', 'name', 'age'],
  labelColumns:   ['label:app'],
  groupBy:        'namespace',
  sort:           'age',
  sortDescending: true,
};

describe('a shared table view', () => {
  it('keys a table by its type, and by the page keeping views of its own', () => {
    expect(sharedTableKey('pod')).toBe('pod');
    expect(sharedTableKey('management.cattle.io.cluster', 'home')).toBe('management.cattle.io.cluster@home');
    expect(sharedTableType('management.cattle.io.cluster@home')).toBe('management.cattle.io.cluster');
  });

  it('decodes what it encodes, for every table in it', () => {
    const tables = { pod: running, 'apps.deployment': { ...running, name: 'Mine' } };

    expect(decodeSharedViews(encodeSharedViews({ key: 'k1', tables }))).toStrictEqual({ key: 'k1', tables });
  });

  it('is one word of letters, digits, - and _, names in any script included', () => {
    const encoded = shareTableView('pod', { ...running, name: 'Vue d’ensemble 日本 ✓' });

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSharedViews(encoded)?.tables.pod.name).toBe('Vue d’ensemble 日本 ✓');
  });

  it('leaves the empty values out, and puts them back as the table has them', () => {
    const bare: SharedTableView = {
      name: 'Sorted', query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: 'name', sortDescending: false
    };
    const encoded = encodeSharedViews({ key: 'k1', tables: { pod: bare } });

    expect(JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).t.pod).toStrictEqual({ n: 'Sorted', s: 'name' });
    expect(decodeSharedViews(encoded)?.tables.pod).toStrictEqual(bare);
  });

  it.each([
    ['not base64', '%%%'],
    ['not JSON', btoa('nope')],
    ['no views', btoa(JSON.stringify({ k: 'k1', t: {} }))],
  ])('decodes to nothing when it is %s', (_, encoded) => {
    expect(decodeSharedViews(encoded)).toBeNull();
  });

  it('drops a table whose view has no name, and the values of the wrong type', () => {
    const encoded = btoa(JSON.stringify({
      k: 'k1',
      t: {
        pod:    { q: 'a', c: 'name' },
        secret: {
          n: 'X', c: [1], d: 'yes'
        }
      }
    }));

    expect(decodeSharedViews(encoded)?.tables).toStrictEqual({
      secret: {
        name: 'X', query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
      }
    });
  });

  it('carries the persistence id it was shared with, or none, and checks neither', () => {
    expect(decodeSharedViews(shareTableView('pod', running, 'k-mine'))?.key).toBe('k-mine');
    expect(decodeSharedViews(shareTableView('pod', running))?.key).toBe('');
    expect(decodeSharedViews(btoa(JSON.stringify({ t: { pod: { n: 'Running' } } })))?.tables.pod.name).toBe('Running');
  });

  describe('imported', () => {
    it('is the view for the table it is imported on, whoever shared it', () => {
      expect(importTableView(shareTableView('pod', running, 'k-someone'), 'pod')).toStrictEqual({ view: running });
      expect(importTableView(`  ${ shareTableView('pod', running) }\n`, 'pod')).toStrictEqual({ view: running });
    });

    it('takes its table\'s view out of a string holding several', () => {
      const encoded = encodeSharedViews({ key: '', tables: { 'apps.deployment': { ...running, name: 'Other' }, pod: running } });

      expect(importTableView(encoded, 'pod')).toStrictEqual({ view: running });
    });

    it('names the table a view shared from another one is for', () => {
      expect(importTableView(shareTableView('pod', running), 'apps.deployment')).toStrictEqual({ problem: 'otherTable', tableKey: 'pod' });
      expect(importTableView(shareTableView('management.cattle.io.cluster@home', running), 'management.cattle.io.cluster')).toStrictEqual({ problem: 'otherTable', tableKey: 'management.cattle.io.cluster@home' });
    });

    it.each([
      ['nothing', ''],
      ['blank', '   '],
      ['not a view', 'hello'],
    ])('is a problem when it is %s', (_, text) => {
      expect(importTableView(text, 'pod')).toStrictEqual({ problem: 'invalid' });
    });
  });
});
