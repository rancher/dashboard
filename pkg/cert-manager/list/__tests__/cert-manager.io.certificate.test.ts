import { shallowMount } from '@vue/test-utils';
import ListCertificate from '../cert-manager.io.certificate.vue';

/**
 * This list has one job: filter the client-side rows by the model `state` getter, driven by a
 * `?stateFilter=` query param. These tests pin that behaviour down.
 */
const HEADERS = [{ name: 'state' }, { name: 'name' }];

const rows = [
  { id: 'a', state: 'active' },
  { id: 'b', state: 'expiring' },
  { id: 'c', state: 'error' },
  { id: 'd', state: 'expiring' },
  { id: 'e', state: 'expired' },
];

function mountWith(stateFilter?: string) {
  return shallowMount(ListCertificate as any, {
    props: {
      resource: 'cert-manager.io.certificate',
      schema:   { id: 'cert-manager.io.certificate' },
      rows,
    },
    global: {
      mocks: {
        $route: { query: stateFilter === undefined ? {} : { stateFilter } },
        $store: { getters: { 'type-map/headersFor': () => HEADERS } },
      },
      stubs: { ResourceTable: true },
    },
  });
}

describe('list: cert-manager.io.certificate', () => {
  it('shows every row when no stateFilter is present', () => {
    const wrapper = mountWith(undefined);

    expect((wrapper.vm as any).filteredRows).toStrictEqual(rows);
  });

  it('keeps only rows whose computed state matches a single filter', () => {
    const wrapper = mountWith('expiring');

    expect((wrapper.vm as any).filteredRows.map((r: any) => r.id)).toStrictEqual(['b', 'd']);
  });

  it('supports a comma-separated set of states', () => {
    const wrapper = mountWith('expiring,error');

    expect((wrapper.vm as any).filteredRows.map((r: any) => r.id)).toStrictEqual(['b', 'c', 'd']);
  });

  it('matches the client-computed states the backend cannot filter on (expired)', () => {
    const wrapper = mountWith('expired');

    expect((wrapper.vm as any).filteredRows.map((r: any) => r.id)).toStrictEqual(['e']);
  });

  it('returns an empty list when no row matches', () => {
    const wrapper = mountWith('pending');

    expect((wrapper.vm as any).filteredRows).toStrictEqual([]);
  });

  it('ignores empty segments in the query param', () => {
    const wrapper = mountWith('expiring,,');

    expect((wrapper.vm as any).filteredRows.map((r: any) => r.id)).toStrictEqual(['b', 'd']);
  });

  it('passes the filtered rows to the table headers it resolves for the non-paginated path', () => {
    const wrapper = mountWith(undefined);

    expect((wrapper.vm as any).headers).toStrictEqual(HEADERS);
  });
});
