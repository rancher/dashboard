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
auditInterval: 300
constraintViolationsLimit: 20
auditFromCache: false
image:
  repository: rancher/opa-gatekeeper
  tag: v3.1.0-beta.7
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
  kubectl:
    repository: rancher/istio-kubectl
    tag: 1.4.6
`;

const SYSTEM_PROJECT_LABEL = 'authz.management.cattle.io/system-project';

export default {
  components: {
    GatekeeperConfig, GatekeeperViolationsTable, InfoBox
  },

  data() {
    return {
      gateKeeperUnavailable:    false,
      gatekeeperSystemTemplate: null,
      mode:                     _VIEW,
      systemProject:            null,
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
          gateKeeperUnavailable:    true,
          gatekeeperEnabled:        false,
          gatekeeperSystemTemplate: null,
          systemProject:            null,
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
          gateKeeperUnAvailable:    true,
          gatekeeperEnabled:        false,
          gatekeeperSystemTemplate: null,
          systemProject:            null,
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

      // Don't add to recent for now, it doesn't handle the parent of nested types well
      // and it's always at the top anyway.
      // await store.dispatch('type-map/addRecent', 'gatekeeper');

      return {
        gatekeeperEnabled:        !!gatekeeper?.id,
        gatekeeperSystemTemplate: template,
        systemProject:            targetSystemProject,
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

  methods: {
    async syncGatekeeperStatus(status) {
      const gatekeeperVersionsMap = this.gatekeeperSystemTemplate?.spec?.versions || [];
      const latestGKVersion = gatekeeperVersionsMap[0] ? gatekeeperVersionsMap[0] : null;
      let newApp = null;

      this.gatekeeperEnabled = status;

      if (!status && latestGKVersion) {
        try {
          newApp = await this.createGatekeeperDefaultApp(this.systemProject, latestGKVersion.externalId);
          this.gatekeeper = newApp;
          this.mode = _CREATE;
        } catch (err) {
          console.error('could not create new gatekeeper app', err);
        }
      }
    },
    createGatekeeperDefaultApp(systemProject, externalId) {
      return this.$store.dispatch('clusterExternal/create', {
        type:       'app',
        metadata:   {
          namespace: systemProject.metadata.name,
          name:      APP_ID
        },
        spec: {
          targetNamespace: 'gatekeeper-system',
          timeout:         300,
          valuesYaml:      CONFIG,
          projectName:     systemProject.namespacedName,
          externalId,
        }
      });
    },
  }
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
        @gatekeeperEnabled="syncGatekeeperStatus"
      />
      <InfoBox v-if="gatekeeperEnabled">
        <div class="mb-15">
          <h2>Violations</h2>
        </div>
        <div>
          <GatekeeperViolationsTable :include-constraint="true" />
        </div>
      </InfoBox>
    </div>
  </div>
</template>
