import Workload from './workload';

export default class DaemonSet extends Workload {
  async rollBack(cluster, daemonSet, revision) {
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

    await this.rollBackWorkload(cluster, daemonSet, 'daemonsets', body);
  }
}
