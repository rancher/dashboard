<script>
import {
  NAMESPACE,
  MANAGEMENT,
  EXTERNAL,
  GATEKEEPER,
  SYSTEM_PROJECT_LABEL,
} from '@/config/types';
import GatekeeperConfig from '@/components/GatekeeperConfig';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import InfoBox from '@/components/InfoBox';
import GatekeeperViolationsTable from '@/components/GatekeeperViolationsTable';

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
        id:   GATEKEEPER.TEMPLATE_ID
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
      let gatekeeper = apps.find(app => app.id === `${ namespace }/${ GATEKEEPER.APP_ID }`);

      const namespaces = await store.dispatch('cluster/findAll', { type: NAMESPACE });

      if ( !gatekeeper ) {
        mode = _CREATE;

        const gatekeeperVersionsMap = template.spec.versions;
        const latestGKVersion = gatekeeperVersionsMap[0] ? gatekeeperVersionsMap[0] : null;

        gatekeeper = await store.dispatch('clusterExternal/create', {
          type:       'app',
          metadata:   {
            namespace,
            name:        GATEKEEPER.APP_ID
          },
          spec: {
            projectName:     targetSystemProject.namespacedName,
            externalId:      latestGKVersion.externalId,
            targetNamespace: 'gatekeeper-system',
            timeout:         300,
            valuesYaml:      GATEKEEPER.CONFIG,
          }
        });
      }

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
          name:      GATEKEEPER.APP_ID
        },
        spec: {
          targetNamespace: 'gatekeeper-system',
          timeout:         300,
          valuesYaml:      GATEKEEPER.CONFIG,
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
        <t k="gatekeeperIndex.unavailable" />
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
          <h2><t k="gatekeeperIndex.violations" /></h2>
        </div>
        <div>
          <GatekeeperViolationsTable :include-constraint="true" />
        </div>
      </InfoBox>
    </div>
  </div>
</template>
