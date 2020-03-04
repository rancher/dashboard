<script>
import { PROJECT, NAMESPACE, MANAGEMENT } from '@/config/types';
import GatekeeperConfig from '@/components/GatekeeperConfig';
import GatekeeperTables from '@/components/GatekeeperTables';
import { _CREATE, _VIEW } from '@/config/query-params';
import { allHash } from '@/utils/promise';

const gatekeeprInfo = {
  name:              'rancher-gatekeeper-operator',
  catalogTemplateId: 'cattle-global-data/system-library-rancher-gatekeeper-operator',
  type:              MANAGEMENT.CATALOG_TEMPLATE,
};

const SYSTEM_PROJECT_LABEL = 'authz.management.cattle.io/system-project';

export default {
  components: { GatekeeperConfig, GatekeeperTables },

  data() {
    return { gateKeeperUnAvailable: false };
  },

  asyncData(ctx) {
    let mode = _VIEW;

    return ctx.store.dispatch('management/find', { type: gatekeeprInfo.type, id: gatekeeprInfo.catalogTemplateId }).then((resp) => {
      if (resp && resp.id) {
        const promises = allHash({
          apps:             ctx.store.dispatch('management/findAll', { type: PROJECT.APPS }),
          namespaces:       ctx.store.getters['cluster/all'](NAMESPACE),
          projects:         ctx.store.dispatch('management/findAll', { type: MANAGEMENT.PROJECTS }),
          schema:           ctx.store.getters['management/schemaFor'](PROJECT.APPS),
          systemCatalogApp: resp,
        });

        return promises.then((hash) => {
          const { namespaces, projects, apps } = hash;
          const gatekeeper = apps.find(app => app.metadata.name === gatekeeprInfo.name);
          // clusterID is on router.state.clusterid and find
          const targetClusterId = ctx.store.state.clusterId;
          const targetSystemProject = projects.find(( proj ) => {
            // find the management project with "authz.management.cattle.io/system-project": "true", label and namespace === current cluster id
            if (proj.metadata.namespace === targetClusterId &&
                Object.prototype.hasOwnProperty.call(proj.metadata.labels, SYSTEM_PROJECT_LABEL) &&
                proj.metadata.labels[SYSTEM_PROJECT_LABEL]) {
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

          const gatekeeperVersionsMap = hash.systemCatalogApp.spec.versions;
          const latestGKVersion = gatekeeperVersionsMap.pop();

          return ctx.store.dispatch('clusterExternal/create', {
            type:       PROJECT.APPS,
            kind:       'App',
            apiVersion: `${ hash.schema.attributes.group }/${ hash.schema.attributes.version }`,
            metadata:   {
              namespace,
              name:        gatekeeprInfo.name,
            },
            spec: {
              projectName,
              externalId:      latestGKVersion.externalId,
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
      } else {
        return { gateKeeperUnAvailable: true };
      }
    }).catch(() => {
      return { gateKeeperUnAvailable: true };
    });
  },
};
</script>

<template>
  <div>
    <div v-if="gateKeeperUnAvailable">
      <h2 class="text-center mt-50">
        OPA + Gatekeeper is not available in the system-charts catalog.
      </h2>
    </div>
    <div v-else>
      <GatekeeperConfig
        :config="gatekeeper"
        :mode="mode"
        :namespaces="namespaces"
        :projects="projects"
      />
      <GatekeeperTables />
    </div>
  </div>
</template>
