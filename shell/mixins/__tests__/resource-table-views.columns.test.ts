import ResourceTableViews from '@shell/mixins/resource-table-views';
import { canQueryDescription } from '@shell/utils/table-views/server-support';
import {
  CAPI, CONFIG_MAP, FLEET, MANAGEMENT, NAMESPACE, WORKLOAD_TYPES
} from '@shell/config/types';
import {
  AGE, DESCRIPTION, DESCRIPTION_ANNOTATION_COL, NAME, STATE
} from '@shell/config/table-headers';

// Whether the api indexes the description is asked of the server; here it says yes unless a test says no
jest.mock('@shell/utils/table-views/server-support', () => ({
  ...jest.requireActual('@shell/utils/table-views/server-support'),
  canQueryDescription: jest.fn(() => true),
}));

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

    expect(names(ctx)).toStrictEqual(['state', 'name', 'cpu', 'memory', 'pods', 'autoscaler', 'machines', 'description', 'age']);
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

    it('should go in before Age, which stays the last column', () => {
      const { ctx } = page(CONFIG_MAP, [STATE, NAME, AGE]);

      expect(names(ctx)).toStrictEqual(['state', 'name', 'description', 'age']);
    });

    it('should be sorted and filtered on by the api on a paginated list, where the api indexes the annotation', () => {
      const { ctx } = page(CONFIG_MAP, [STATE, NAME], false, true);

      expect(description(ctx)).toStrictEqual(expect.objectContaining({ sort: 'metadata.annotations[field.cattle.io/description]', search: 'metadata.annotations[field.cattle.io/description]' }));
    });

    it('should show on a paginated list without asking the api for it, where the api has no index for it', () => {
      jest.mocked(canQueryDescription).mockReturnValueOnce(false);
      const { ctx } = page(CONFIG_MAP, [STATE, NAME], false, true);

      expect(description(ctx)).toStrictEqual(expect.objectContaining({ sort: false, search: false }));
    });

    it('should be offered on both lists of clusters, read from the annotation the management cluster is given', () => {
      expect(names(page(MANAGEMENT.CLUSTER).ctx)).toContain('description');
      expect(description(page(CAPI.RANCHER_CLUSTER, [STATE, NAME], false, true).ctx)).toStrictEqual(expect.objectContaining({ sort: 'metadata.annotations[field.cattle.io/description]' }));
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

  describe('free text', () => {
    const { viewQueryFields } = (ResourceTableViews as unknown as { computed: Record<string, (this: object) => { id: string, notInFreeText?: boolean }[]> }).computed;
    const field = (header: { name: string, freeTextWhenShown?: boolean }) => ({
      id: header.name, label: header.name, isLabel: false, header
    });
    const cpu = { name: 'cpu' };
    const fields = [field(STATE), field(NAME), field(DESCRIPTION_ANNOTATION_COL), field(cpu)];
    const offFreeText = (shown: { name: string }[]) => viewQueryFields.call({
      viewHeaders: shown, viewFields: fields, queryFields: []
    })
      .filter((f) => f.notInFreeText).map((f) => f.id);

    it('should leave the description out while its column is not on the table', () => {
      expect(offFreeText([STATE, NAME])).toStrictEqual(['description']);
    });

    it('should search the description once its column is on the table', () => {
      expect(offFreeText([STATE, NAME, DESCRIPTION_ANNOTATION_COL])).toStrictEqual([]);
    });

    it('should search every other column, shown or not', () => {
      expect(offFreeText([NAME])).toStrictEqual(['description']);
    });
  });
});
