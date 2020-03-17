<script>
import { NAMESPACE, MANAGEMENT, EXTERNAL } from '@/config/types';
import GatekeeperConfig from '@/components/GatekeeperConfig';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import InfoBox from '@/components/InfoBox';
import GatekeeperViolationsTable from '@/components/GatekeeperViolationsTable';

const TEMPLATE_ID = 'cattle-global-data/system-library-rancher-gatekeeper-operator';
const APP_ID = 'rancher-gatekeeper-operator';
const CONFIG = `---
replicas: 1
auditInterval: 60
constraintViolationsLimit: 20
auditFromCache: false
image:
  repository: quay.io/open-policy-agent/gatekeeper
  release: v3.1.0-beta.7
  pullPolicy: IfNotPresent
nodeSelector: {"beta.kubernetes.io/os": "linux"}
tolerations: []
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi
global:
  systemDefaultRegistry: ""
`;

const SYSTEM_PROJECT_LABEL = 'authz.management.cattle.io/system-project';

export default {
  components: {
    GatekeeperConfig, GatekeeperViolationsTable, InfoBox
  },

  data() {
    return {
      gateKeeperUnavailable: false,
      mode:                  _VIEW,
    };
  },

  async asyncData({ store, route }) {
    let mode = route?.query?.mode ? route.query.mode : _VIEW;

    try {
      const template = await store.dispatch('management/find', {
        type: MANAGEMENT.CATALOG_TEMPLATE,
        id:   TEMPLATE_ID
      });

      if (!template?.id ) {
        return {
          gateKeeperUnavailable: true,
          gatekeeperEnabled:     false,
          mode,
        };
      }

      // clusterID is on router.state.clusterid and find
      const projects = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT });
      const targetSystemProject = projects.find(( proj ) => {
        const labels = proj.metadata?.labels || {};

        if ( labels[SYSTEM_PROJECT_LABEL] === 'true' ) {
          return true;
        }
      });

      if ( !targetSystemProject ) {
        return {
          gateKeeperUnAvailable: true,
          gatekeeperEnabled:     false,
          mode,
        };
      }

      const namespace = targetSystemProject.metadata.name; // name of system project in management cluster

      // @TODO externalCluster service doesn't like getting things by ID, so load them all and find it...
      const apps = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.APP });
      let gatekeeper = apps.find(app => app.id === `${ namespace }/${ APP_ID }`);

      const namespaces = await store.dispatch('cluster/findAll', { type: NAMESPACE });

      if ( !gatekeeper ) {
        mode = _CREATE;

        const gatekeeperVersionsMap = template.spec.versions;
        const latestGKVersion = gatekeeperVersionsMap[0] ? gatekeeperVersionsMap[0] : null;

        gatekeeper = await store.dispatch('clusterExternal/create', {
          type:       'app',
          metadata:   {
            namespace,
            name:        APP_ID
          },
          spec: {
            projectName:     targetSystemProject.namespacedName,
            externalId:      latestGKVersion.externalId,
            targetNamespace: 'gatekeeper-system',
            timeout:         300,
            valuesYaml:      CONFIG,
          }
        });
      }

      await store.dispatch('type-map/addRecent', 'workload');

      return {
        gatekeeperEnabled: !!gatekeeper?.id,
        gatekeeper,
        mode,
        namespaces,
        projects
      };
    } catch (e) {
      console.error(e);

      return {
        gateKeeperUnavailable: true,
        gatekeeperEnabled:     false,
        mode,
      };
    }
  },

  beforeRouteEnter(to, from, next) {
    next(( vm ) => {
      if (to.query?.mode === _EDIT) {
        vm.mode = _EDIT;
      } else if (from.query?.mode === _EDIT && !to.query?.mode) {
        vm.mode = _VIEW;
      }
    });
  },

  beforeRouteUpdate(to, from, next) {
    if (to.query?.mode === _EDIT) {
      this.mode = _EDIT;
    } else if (from.query?.mode === _EDIT && !to.query?.mode) {
      this.mode = _VIEW;
    }
    next();
  },
};
</script>

<template>
  <div>
    <div v-if="gateKeeperUnavailable">
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
        @gatekeeperEnabled="status => gatekeeperEnabled = status"
      />
      <InfoBox v-if="gatekeeperEnabled">
        <div class="mb-15">
          <h2>OPA Gatekeeper Violations</h2>
        </div>
        <div>
          <GatekeeperViolationsTable :include-constraint="true" />
        </div>
      </InfoBox>
    </div>
  </div>
</template>
