<script>
import { PROJECT, NAMESPACE, MANAGEMENT } from '@/config/types';
import GatekeeperConfig from '@/components/GatekeeperConfig';
import { _CREATE, _VIEW } from '@/config/query-params';
import { allHash } from '@/utils/promise';

export default {
  components: { GatekeeperConfig },

  asyncData(ctx) {
    let mode = _VIEW;

    const promises = allHash({
      apps:       ctx.store.dispatch('management/findAll', { type: PROJECT.APPS }),
      namespaces: ctx.store.getters['cluster/all'](NAMESPACE),
      projects:   ctx.store.dispatch('management/findAll', { type: MANAGEMENT.PROJECTS }),
      schema:     ctx.store.getters['management/schemaFor'](PROJECT.APPS),
    });

    return promises.then((hash) => {
      const { namespaces, projects } = hash;
      const gatekeeper = hash.apps.find(app => app.metadata.name === 'gatekeeper-operator');
      // clusterID is on router.state.clusterid and find
      const targetClusterId = ctx.store.state.clusterId;
      const targetSystemProject = projects.find(( proj ) => {
        // find the management project with "authz.management.cattle.io/system-project": "true", label and namespace === current cluster id
        if (proj.metadata.namespace === targetClusterId &&
            Object.prototype.hasOwnProperty.call(proj.metadata.labels, 'authz.management.cattle.io/system-project') &&
            proj.metadata.labels['authz.management.cattle.io/system-project']) {
          return proj;
        }
      });
      const namespace = targetSystemProject.metadata.name; // name of system project in management cluster
      const projectName = `${ targetSystemProject.metadata.namespace }:${ targetSystemProject.metadata.name }`; // project name of the system project

      if (gatekeeper) {
        return {
          gatekeeper,
          mode,
          namespaces,
          projects
        };
      }

      mode = _CREATE;

      return ctx.store.dispatch('management/create', {
        type:       PROJECT.APPS,
        kind:       'App',
        apiVersion: `${ hash.schema.attributes.group }/${ hash.schema.attributes.version }`,
        metadata:   {
          name:      'gatekeeper-operator',
          namespace,
        },
        spec: {
          projectName,
          externalId:      'catalog://?catalog=system-library&template=gatekeeper-operator&version=v3.1.0-beta.7',
          targetNamespace: 'gatekeeper-system',
          timeout:         300,
          valuesYaml:      `---\nreplicas: 1\nauditInterval: 60\nconstraintViolationsLimit: 20\nauditFromCache: false\nimage:\n  repository: quay.io/open-policy-agent/gatekeeper\n  release: v3.1.0-beta.7\n  pullPolicy: IfNotPresent\nnodeSelector: {\"beta.kubernetes.io/os\": \"linux\"}\ntolerations: []\nresources:\n  limits:\n    cpu: 1000m\n    memory: 512Mi\n  requests:\n    cpu: 100m\n    memory: 256Mi\nglobal:\n  systemDefaultRegistry: \"\"`
        }
      }).then((gatekeeper) => {
        return {
          gatekeeper,
          mode,
          namespaces,
          projects
        };
      });
    });
  },
};
</script>

<template>
  <GatekeeperConfig
    :config="gatekeeper"
    :mode="mode"
    :namespaces="namespaces"
    :projects="projects"
  />
</template>
