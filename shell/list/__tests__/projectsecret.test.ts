import { shallowMount } from '@vue/test-utils';
import ProjectSecretList from '@shell/list/projectsecret.vue';
import { SECRET } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

const CLUSTER_ID = 'c-abc123';

const mountList = () => {
  return shallowMount(ProjectSecretList, {
    props:  { resource: SECRET },
    global: {
      mocks: {
        t:      (key: string) => key,
        $store: {
          getters: {
            currentCluster:                      { id: CLUSTER_ID },
            [`${ STORE.MANAGEMENT }/schemaFor`]: () => ({ id: SECRET }),
            [`${ STORE.CLUSTER }/schemaFor`]:    () => ({ id: SECRET }),
            'prefs/get':                         () => 'none',
          }
        }
      },
      stubs: { Masthead: true, PaginatedResourceTable: true }
    }
  });
};

describe('component: ProjectSecretList', () => {
  describe('filterRowsApi', () => {
    it('strips the injected ns/project selection and applies the project scoped secret filters', () => {
      const wrapper = mountList();

      const pagination = {
        sort:                 [],
        projectsOrNamespaces: [{ param: 'projectsornamespaces' }],
        filters:              [
          PaginationParamFilter.createSingleField({
            field: 'metadata.namespace', value: 'p-aaaaa', equals: false
          })
        ]
      };

      const out = (wrapper.vm as any).filterRowsApi(pagination);

      // injected ns/project selection is removed
      expect(out.projectsOrNamespaces).toStrictEqual([]);
      expect(out.filters.some((f: PaginationParamFilter) => f.fields.some((ff) => ff.field === 'metadata.namespace'))).toStrictEqual(false);

      // project scoped secret filters are applied
      const fields = out.filters.map((f: PaginationParamFilter) => f.fields[0].field);

      expect(fields).toStrictEqual([
        'spec.clusterName',
        `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`,
        `metadata.labels[${ UI_PROJECT_SECRET }]`,
      ]);
    });

    it('maps the local sort field onto the one vai understands', () => {
      const wrapper = mountList();

      const out = (wrapper.vm as any).filterRowsApi({ sort: [{ field: 'groupByProject' }], filters: [] });

      expect(out.sort[0].field).toStrictEqual(`metadata.labels[${ UI_PROJECT_SECRET }]`);
    });
  });

  describe('filterRowsLocal', () => {
    const secret = (over: any = {}) => ({
      isProjectScoped:          true,
      projectScopedClusterId:   CLUSTER_ID,
      projectScopedProjectName: 'p-aaaaa',
      ...over,
    });

    it('filters out copies and secrets from other clusters', () => {
      const wrapper = mountList();
      const rows = [
        secret(),
        secret({ isProjectScoped: false }),
        secret({ projectScopedClusterId: 'c-other' }),
      ];

      const out = (wrapper.vm as any).filterRowsLocal(rows);

      expect(out).toStrictEqual([rows[0]]);
    });
  });
});
