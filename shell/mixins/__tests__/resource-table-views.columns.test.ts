import ResourceTableViews from '@shell/mixins/resource-table-views';
import {
  CONFIG_MAP, FLEET, MANAGEMENT, NAMESPACE, WORKLOAD_TYPES
} from '@shell/config/types';
import { DESCRIPTION, NAME, STATE } from '@shell/config/table-headers';

const { availableHeaders } = ResourceTableViews.computed as unknown as Record<string, (this: object) => { name: string }[]>;

/** A page that names its own columns, of the type given; the type's own columns include a Status */
const page = (type: string, own: { name: string }[] = [STATE, NAME], autoscaler = false, paginated = false) => {
  const headersFor = jest.fn(() => [STATE, NAME, {
    name: 'status', labelKey: 'tableHeaders.status', value: 'status.phase'
  }]);

  return {
    ctx: {
      _headers:                  own,
      headers:                   own,
      schema:                    { id: type },
      externalPaginationEnabled: paginated,
      $store:                    { getters: { 'type-map/headersFor': headersFor, 'features/get': () => autoscaler } },
    },
    headersFor,
  };
};

const names = (ctx: object) => availableHeaders.call(ctx).map((header) => header.name);

const description = (ctx: object) => availableHeaders.call(ctx).find((header) => header.name === 'description') as Record<string, unknown> | undefined;

describe('the columns a list offers', () => {
  it('should offer a page that names its columns only those, not every column of its type', () => {
    const { ctx, headersFor } = page(WORKLOAD_TYPES.REPLICA_SET);

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

    expect(names(ctx)).toStrictEqual(['state', 'name', 'commit', 'description']);
  });

  describe('a description', () => {
    it('should be offered where the edit form keeps it in its annotation, and read from there', () => {
      const { ctx } = page(CONFIG_MAP);

      expect(names(ctx)).toStrictEqual(['state', 'name', 'description']);
      expect(description(ctx)).toStrictEqual(expect.objectContaining({ value: 'metadata.annotations."field.cattle.io/description"', sort: ['metadata.annotations."field.cattle.io/description"'] }));
    });

    it('should be sorted and filtered on by the api on a paginated list, which indexes the annotation', () => {
      const { ctx } = page(CONFIG_MAP, [STATE, NAME], false, true);

      expect(description(ctx)).toStrictEqual(expect.objectContaining({ sort: 'metadata.annotations[field.cattle.io/description]', search: 'metadata.annotations[field.cattle.io/description]' }));
    });

    it('should not be offered where the description is kept somewhere else', () => {
      const { ctx } = page(MANAGEMENT.PROJECT);

      expect(names(ctx)).toStrictEqual(['state', 'name']);
    });

    it('should leave a list its own description column', () => {
      const { ctx } = page(NAMESPACE, [STATE, NAME, DESCRIPTION]);

      expect(availableHeaders.call(ctx).filter((header) => header.name === 'description')).toStrictEqual([DESCRIPTION]);
    });
  });
});
