import Workload from './workload';

export default class StatefulSet extends Workload {
  async rollBack(cluster, statefulSet, revision) {
    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: revision.data.spec.template.metadata,
          spec:     revision.data.spec.template.spec
        }
      }, {
        op:    'replace',
        path:  '/metadata/generation',
        value: revision.revision,
      }
    ];

    await this.rollBackWorkload(cluster, statefulSet, 'statefulsets', body);
  }
}
