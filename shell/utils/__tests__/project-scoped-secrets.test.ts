import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { SAVED_COUNTS } from '@shell/config/types';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';
import { projectScopedSecretsCountRequest, projectScopedSecretsFilters, projectScopedSecretsProjectFilter, selectedProjectNames } from '@shell/utils/project-scoped-secrets';

describe('fx: projectScopedSecretsFilters', () => {
  const clusterId = 'c-abc123';
  const { labelFilter, annotationFilter, clusterFilter } = projectScopedSecretsFilters(clusterId);

  it('filters in project scoped secrets via the project scoped label', () => {
    expect(labelFilter.fields[0].field).toStrictEqual(`metadata.labels[${ UI_PROJECT_SECRET }]`);
    expect(labelFilter.fields[0].exists).toStrictEqual(true);
  });

  it('filters out project scoped secret copies via the copy annotation', () => {
    expect(annotationFilter.fields[0].field).toStrictEqual(`metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`);
    expect(annotationFilter.fields[0].value).toStrictEqual('true');
    expect(annotationFilter.fields[0].equals).toStrictEqual(false);
    expect(annotationFilter.fields[0].exact).toStrictEqual(true);
  });

  it('filters in secrets belonging to the given cluster', () => {
    expect(clusterFilter.fields[0].field).toStrictEqual('spec.clusterName');
    expect(clusterFilter.fields[0].value).toStrictEqual(clusterId);
    expect(clusterFilter.fields[0].equals).toStrictEqual(true);
    expect(clusterFilter.fields[0].exact).toStrictEqual(true);
  });
});

describe('fx: projectScopedSecretsCountRequest', () => {
  const clusterId = 'c-abc123';
  const request = projectScopedSecretsCountRequest(clusterId);

  it('requests a single transient row so only the count is retained', () => {
    expect(request.pagination.page).toStrictEqual(1);
    expect(request.pagination.pageSize).toStrictEqual(1);
    expect(request.transient).toStrictEqual(true);
  });

  it('saves the count under the project scoped secrets name', () => {
    expect(request.saveCountAs).toStrictEqual(SAVED_COUNTS.PROJECT_SCOPED_SECRETS);
  });

  it('applies all three project scoped secret filters', () => {
    const fields = request.pagination.filters.map((f) => f.fields[0].field);

    expect(fields).toStrictEqual([
      `metadata.labels[${ UI_PROJECT_SECRET }]`,
      `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`,
      'spec.clusterName',
    ]);
  });

  it('scopes the count to the selected projects via a project label IN filter', () => {
    const scoped = projectScopedSecretsCountRequest(clusterId, ['p-aaaaa', 'p-bbbbb']);
    const projectField = scoped.pagination.filters[0].fields[0];

    expect(projectField.field).toStrictEqual(`metadata.labels[${ UI_PROJECT_SECRET }]`);
    expect(projectField.value).toStrictEqual('p-aaaaa,p-bbbbb');
    expect(projectField.equality).toStrictEqual(PaginationFilterEquality.IN);
  });
});

describe('fx: selectedProjectNames', () => {
  it('returns the project names from a project selection', () => {
    expect(selectedProjectNames(['project://p-aaaaa', 'project://p-bbbbb'])).toStrictEqual(['p-aaaaa', 'p-bbbbb']);
  });

  it('ignores namespace and all selections', () => {
    expect(selectedProjectNames(['ns://my-namespace', 'all://user', 'project://p-aaaaa'])).toStrictEqual(['p-aaaaa']);
  });

  it('handles an empty or missing selection', () => {
    expect(selectedProjectNames([])).toStrictEqual([]);
    expect(selectedProjectNames()).toStrictEqual([]);
  });
});

describe('fx: projectScopedSecretsProjectFilter', () => {
  it('builds a project label IN filter for the selected projects', () => {
    const filter = projectScopedSecretsProjectFilter(['p-aaaaa', 'p-bbbbb']);

    expect(filter?.fields[0].field).toStrictEqual(`metadata.labels[${ UI_PROJECT_SECRET }]`);
    expect(filter?.fields[0].value).toStrictEqual('p-aaaaa,p-bbbbb');
    expect(filter?.fields[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('returns undefined when no project is selected', () => {
    expect(projectScopedSecretsProjectFilter([])).toBeUndefined();
    expect(projectScopedSecretsProjectFilter()).toBeUndefined();
  });
});
