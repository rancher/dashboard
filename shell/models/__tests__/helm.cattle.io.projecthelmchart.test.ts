import ProjectHelmChart from '@shell/models/helm.cattle.io.projecthelmchart';
import { HELM, MANAGEMENT, NAMESPACE } from '@shell/config/types';

const project = { id: 'local/p-abcde', spec: { displayName: 'Default' } };
const namespaces = [{ id: 'monitored', projectId: 'p-abcde' }];

const createProjectHelmChart = ({ namespace = 'monitored', projects = [project] } = {}) => {
  const rootGetters = {
    currentProduct:    { inStore: 'cluster' },
    currentCluster:    { id: 'local' },
    'cluster/all':     (type: string) => (type === NAMESPACE ? namespaces : []),
    'management/byId': (type: string, id: string) => (type === MANAGEMENT.PROJECT ? projects.find((p) => p.id === id) : undefined),
  };

  return new ProjectHelmChart({
    type:     HELM.PROJECTHELMCHART,
    metadata: { name: 'project-monitoring', namespace }
  }, { rootGetters });
};

describe('class ProjectHelmChart', () => {
  describe('nameDisplay', () => {
    it('should be the display name of the project the monitor belongs to', () => {
      const projectHelmChart = createProjectHelmChart();

      expect(projectHelmChart.nameDisplay).toStrictEqual('Default');
    });

    it.each([
      ['project', { projects: [] }],
      ['namespace', { namespace: 'unknown' }],
    ])('should fall back to the resource name when the %s is not loaded', (_, options) => {
      const projectHelmChart = createProjectHelmChart(options);

      expect(projectHelmChart.nameDisplay).toStrictEqual('project-monitoring');
    });
  });
});
