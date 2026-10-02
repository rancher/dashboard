import ResourceTableViews from '@shell/mixins/resource-table-views';
import { FLEET, MANAGEMENT, NAMESPACE } from '@shell/config/types';
import { NAME, STATE } from '@shell/config/table-headers';

const { availableHeaders } = ResourceTableViews.computed as unknown as Record<string, (this: object) => { name: string }[]>;

/** A page that names its own columns, of the type given; the type's own columns include a Status */
const page = (type: string, own: { name: string }[] = [STATE, NAME], autoscaler = false) => {
  const headersFor = jest.fn(() => [STATE, NAME, {
    name: 'status', labelKey: 'tableHeaders.status', value: 'status.phase'
  }]);

  return {
    ctx: {
      _headers:                  own,
      headers:                   own,
      schema:                    { id: type },
      externalPaginationEnabled: false,
      $store:                    { getters: { 'type-map/headersFor': headersFor, 'features/get': () => autoscaler } },
    },
    headersFor,
  };
};

const names = (ctx: object) => availableHeaders.call(ctx).map((header) => header.name);

describe('the columns a list offers', () => {
  it('should offer a page that names its columns only those, not every column of its type', () => {
    const { ctx, headersFor } = page(NAMESPACE);

    expect(names(ctx)).toStrictEqual(['state', 'name']);
    expect(headersFor).not.toHaveBeenCalled();
  });

  it('should offer a list of clusters the columns the other list of them shows', () => {
    const { ctx } = page(MANAGEMENT.CLUSTER, [STATE, NAME], true);

    expect(names(ctx)).toStrictEqual(['state', 'name', 'cpu', 'memory', 'pods', 'autoscaler', 'machines', 'age']);
  });

  it('should keep a page\'s own column rather than offer it twice', () => {
    const { ctx } = page(MANAGEMENT.CLUSTER, [STATE, NAME, { name: 'machines' }, { name: 'age' }]);

    expect(names(ctx).filter((name) => name === 'machines' || name === 'age')).toStrictEqual(['machines', 'age']);
  });

  it('should offer a git repo\'s commit', () => {
    const { ctx } = page(FLEET.GIT_REPO);

    expect(names(ctx)).toStrictEqual(['state', 'name', 'commit']);
  });
});
