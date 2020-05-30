<script>
import demos from '@/config/demos';
import Card from '@/components/Card';
import {
  NAMESPACE,
  MANAGEMENT,
  EXTERNAL,
  RIO,
  SYSTEM_PROJECT_LABEL,
} from '@/config/types';
import { _VIEW, _CREATE, DEMO } from '@/config/query-params';
import RioConfig from '@/components/chart/rio/Config';

export default {
  components: { Card, RioConfig },

  async asyncData({ store, route }) {
    let mode = route?.query?.mode ? route.query.mode : _VIEW;

    try {
      const template = await store.dispatch('management/find', {
        type: MANAGEMENT.CATALOG_TEMPLATE,
        id:   RIO.TEMPLATE_ID
      });

      if (!template?.id ) {
        return {
          rioUnavailable:    true,
          enabled:           false,
          rioSystemTemplate: null,
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
          rioUnavailable:    true,
          enabled:           false,
          rioSystemTemplate: null,
          systemProject:            null,
          mode,
        };
      }

      const namespace = targetSystemProject.metadata.name; // name of system project in management cluster

      // @TODO externalCluster service doesn't like getting things by ID, so load them all and find it...
      const apps = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.APP });
      let rio = apps.find(app => app.id === `${ namespace }/${ RIO.APP_ID }`);

      const namespaces = await store.dispatch('cluster/findAll', { type: NAMESPACE });

      if ( !rio ) {
        mode = _CREATE;

        const rioVersionsMap = template.spec.versions;
        const latestGKVersion = rioVersionsMap[0] ? rioVersionsMap[0] : null;

        rio = await store.dispatch('clusterExternal/create', {
          type:       'app',
          metadata:   {
            namespace,
            name: RIO.APP_ID
          },
          spec: {
            projectName:     targetSystemProject.namespacedName,
            externalId:      latestGKVersion.externalId,
            targetNamespace: 'rio-system',
            timeout:         300,
            valuesYaml:      RIO.CONFIG,
          }
        });
      }

      return {
        enabled:           !!rio?.id,
        rioSystemTemplate: template,
        systemProject:            targetSystemProject,
        rio,
        mode,
        namespaces,
        projects
      };
    } catch (e) {
      console.error(e); // eslint-disable-line no-console

      return {
        rioUnavailable: true,
        enabled:        false,
        mode,
      };
    }
  },

  data() {
    return {
      demos,
      fakeEnabled: !!this.$store.getters['cluster/schemaFor'](RIO.SERVICE),
    };
  },

  methods: {
    createDemo(name) {
      this.$router.push({
        name:   'c-cluster-resource-create',
        params: { resource: this.demos[name].resource },
        query:  { [DEMO]: name }
      });
    },
  }
};
</script>

<template>
  <div>
    <div v-if="fakeEnabled">
      <h1>
        Discover Rio
      </h1>
      <div class="row">
        <div class="col span-6">
          <div class="cards">
            <Card
              v-for="(demo, name) in demos"
              :key="demo.title"
              :content="demo.description"
            >
              <template v-slot:title>
                <span class="text-primary">{{ demo.title }}</span>
                <a v-if="demo.spec" target="_blank" class="icon icon-external-link role-multi-action" :href="demo.spec.build.repo" />
              </template>
              <template v-slot:actions>
                <button class="btn role-primary btn-sm" :disabled="!demo.spec" @click="createDemo(name)">
                  Start
                </button>
              </template>
            </Card>
          </div>
        </div>
        <div class="col span-6">
          <img src="~/assets/images/setup-step-one.svg" alt="landscape" />
        </div>
      </div>
    </div>
    <div v-else>
      <RioConfig
        :config="rio"
        :mode="mode"
        :namespaces="namespaces"
        :projects="projects"
      />
    </div>
  </div>
</template>

<style lang="scss">
    .subtitle {
        margin-top: 20px;
    }
    .cards {
         margin-right: 20px;
        // width: 50%;
        display: grid;
        grid-template-columns:  50% 50%;
        grid-row-gap: 20px;
        grid-column-gap: 20px;
        & > * {
            align-content: center;
        }
        & span.icon{
            padding: 3px;
        }
    }
</style>
