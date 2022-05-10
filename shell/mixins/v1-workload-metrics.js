import EmberPage from '@shell/components/EmberPage';
import { MANAGEMENT } from '@shell/config/types';
import { haveV1Monitoring } from '@shell/utils/monitoring';

export default {
  components: { EmberPage },

  data() {
    const { namespace, resource, id } = this.$route.params;
    const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);
    const p = projects.find((p) => {
      return !!p.namespaces.find((ns) => {
        return ns.metadata.name === namespace;
      });
    });

    let v1MonitoringUrl = null;
    let v1MonitoringContainerBaseUrl = null;

    if (p && haveV1Monitoring(this.$store.getters)) {
      const prjID = p.id.replace('/', ':');
      let prefix;

      if (resource !== 'pod') {
        const r = resource.split('.');
        const res = r.length === 2 ? r[1] : r[0];

        prefix = `workload-metrics/${ res }:`;
      } else {
        prefix = `workloads/pod-metrics/`;
        v1MonitoringContainerBaseUrl = `/p/${ prjID }/workloads/${ namespace }:${ id }/container-metrics/`;
      }

      v1MonitoringUrl = `/p/${ prjID }/${ prefix }${ namespace }:${ id }`;
    }

    return {
      project: p ? p.id : null,
      v1MonitoringUrl,
      v1MonitoringContainerBaseUrl,
    };
  },
};
