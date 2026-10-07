import { decodeLinkedViews, encodeLinkedViews, linkedTableKey, sharedViewsIn } from '@shell/utils/table-views/link';
import type { LinkedTableView } from '@shell/utils/table-views/link';
import { TABLE_VIEWS_QUERY, TABLE_VIEWS_USER_QUERY } from '@shell/config/query-params';

const running: LinkedTableView = {
  name:           'Running',
  query:          'state:running namespace:"kube-system"',
  columns:        ['name', 'namespace', 'age'],
  columnOrder:    ['namespace', 'name', 'age'],
  labelColumns:   ['label:app'],
  groupBy:        'namespace',
  sort:           'age',
  sortDescending: true,
};

const linkFrom = (user: string, tables: Record<string, LinkedTableView>, sender = user) => ({
  [TABLE_VIEWS_QUERY]:      encodeLinkedViews({ user, tables }),
  [TABLE_VIEWS_USER_QUERY]: sender,
});

describe('table views link', () => {
  it('keys a table by its type, and by the page keeping views of its own', () => {
    expect(linkedTableKey('pod')).toBe('pod');
    expect(linkedTableKey('management.cattle.io.cluster', 'home')).toBe('management.cattle.io.cluster@home');
  });

  it('decodes what it encodes, for every table on the page', () => {
    const tables = { pod: running, 'apps.deployment': { ...running, name: 'Mine' } };

    expect(decodeLinkedViews(encodeLinkedViews({ user: 'u-1', tables }))).toStrictEqual({ user: 'u-1', tables });
  });

  it('is safe in a URL as it is, names in any script included', () => {
    const encoded = encodeLinkedViews({ user: 'u-1', tables: { pod: { ...running, name: 'Vue d’ensemble 日本 ✓' } } });

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeLinkedViews(encoded)?.tables.pod.name).toBe('Vue d’ensemble 日本 ✓');
  });

  it('leaves the empty values out, and puts them back as the table has them', () => {
    const bare: LinkedTableView = {
      name: 'Sorted', query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: 'name', sortDescending: false
    };
    const encoded = encodeLinkedViews({ user: 'u-1', tables: { pod: bare } });

    expect(JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).t.pod).toStrictEqual({ n: 'Sorted', s: 'name' });
    expect(decodeLinkedViews(encoded)?.tables.pod).toStrictEqual(bare);
  });

  it.each([
    ['not base64', '%%%'],
    ['not JSON', btoa('nope')],
    ['no user', btoa(JSON.stringify({ t: {} }))],
  ])('decodes to nothing when it is %s', (_, encoded) => {
    expect(decodeLinkedViews(encoded)).toBeNull();
  });

  it('drops a table whose view has no name, and the values of the wrong type', () => {
    const encoded = btoa(JSON.stringify({
      u: 'u-1',
      t: {
        pod:    { q: 'a', c: 'name' },
        secret: {
          n: 'X', c: [1], d: 'yes'
        }
      }
    }));

    expect(decodeLinkedViews(encoded)?.tables).toStrictEqual({
      secret: {
        name: 'X', query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
      }
    });
  });

  describe('views sent with a link', () => {
    it('are the sender\'s tables when another user sent it', () => {
      expect(sharedViewsIn(linkFrom('u-sender', { pod: running }), 'u-me')).toStrictEqual({ pod: running });
    });

    it('are none in a link of one\'s own, which is not decoded', () => {
      const query = { [TABLE_VIEWS_QUERY]: 'not even encoded', [TABLE_VIEWS_USER_QUERY]: 'u-me' };

      expect(sharedViewsIn(query, 'u-me')).toBeNull();
    });

    it('are none when the user beside them is not the one inside', () => {
      expect(sharedViewsIn(linkFrom('u-sender', { pod: running }, 'u-other'), 'u-me')).toBeNull();
    });

    it('are none without a user to compare with, or without the views', () => {
      expect(sharedViewsIn(linkFrom('u-sender', { pod: running }), null)).toBeNull();
      expect(sharedViewsIn({ [TABLE_VIEWS_USER_QUERY]: 'u-sender' }, 'u-me')).toBeNull();
      expect(sharedViewsIn({}, 'u-me')).toBeNull();
    });
  });
});
