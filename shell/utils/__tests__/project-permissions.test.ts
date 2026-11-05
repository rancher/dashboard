import { fetchProjectMembershipPermissions } from '@shell/utils/project-permissions';

describe('fetchProjectMembershipPermissions', () => {
  const PROJECT_SCHEMA = 'management.cattle.io.project';
  const RTB = 'management.cattle.io.projectroletemplatebinding';

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty object when schema has no collection link', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: {} }) },
      dispatch: jest.fn(),
    };

    const result = await fetchProjectMembershipPermissions(store);

    expect(result).toStrictEqual({});
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('returns empty object when schema itself is missing', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue(undefined) },
      dispatch: jest.fn(),
    };

    const result = await fetchProjectMembershipPermissions(store);

    expect(result).toStrictEqual({});
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('requests the collection url with checkPermissions when no projectId is given', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: [] });
    const store = {
      getters: { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch,
    };

    await fetchProjectMembershipPermissions(store);

    expect(dispatch).toHaveBeenCalledWith('management/request', { url: `/v3/schemas/${ PROJECT_SCHEMA }?checkPermissions=${ RTB }` });
  });

  it('requests a single project url replacing the colon separator when projectId is given', async() => {
    const dispatch = jest.fn().mockResolvedValue({ id: 'local/p-abc', resourcePermissions: {} });
    const store = {
      getters: { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch,
    };

    await fetchProjectMembershipPermissions(store, 'local:p-abc');

    expect(dispatch).toHaveBeenCalledWith('management/request', { url: `/v3/schemas/${ PROJECT_SCHEMA }/local/p-abc?checkPermissions=${ RTB }` });
  });

  it('returns empty object when the request throws (fail closed)', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch: jest.fn().mockRejectedValue(new Error('forbidden')),
    };

    const result = await fetchProjectMembershipPermissions(store, 'local:p-abc');

    expect(result).toStrictEqual({});
  });

  it('maps an array response (all-projects listing) to a per-project permission record', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch: jest.fn().mockResolvedValue({
        data: [
          { id: 'local/p-1', resourcePermissions: { [RTB]: { create: true, delete: true } } },
          { id: 'local/p-2', resourcePermissions: { [RTB]: { create: false, delete: false } } },
        ],
      }),
    };

    const result = await fetchProjectMembershipPermissions(store);

    expect(result).toStrictEqual({
      'local/p-1': { create: true, remove: true },
      'local/p-2': { create: false, remove: false },
    });
  });

  it('maps a single-object response (one-project lookup) to a per-project permission record', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch: jest.fn().mockResolvedValue({ id: 'local/p-abc', resourcePermissions: { [RTB]: { create: true, delete: false } } }),
    };

    const result = await fetchProjectMembershipPermissions(store, 'local:p-abc');

    expect(result).toStrictEqual({ 'local/p-abc': { create: true, remove: false } });
  });

  it('defaults create and remove to false when resourcePermissions for the RTB verb is missing', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch: jest.fn().mockResolvedValue({ data: [{ id: 'local/p-1', resourcePermissions: {} }] }),
    };

    const result = await fetchProjectMembershipPermissions(store);

    expect(result).toStrictEqual({ 'local/p-1': { create: false, remove: false } });
  });

  it('returns an empty object when response has neither a data array nor an id', async() => {
    const store = {
      getters:  { 'management/schemaFor': jest.fn().mockReturnValue({ links: { collection: `/v3/schemas/${ PROJECT_SCHEMA }` } }) },
      dispatch: jest.fn().mockResolvedValue({}),
    };

    const result = await fetchProjectMembershipPermissions(store);

    expect(result).toStrictEqual({});
  });
});
