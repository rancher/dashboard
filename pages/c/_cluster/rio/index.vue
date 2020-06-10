<script>
import demos from '@/config/demos';
import Card from '@/components/Card';
import {
  NAMESPACE,
  MANAGEMENT,
  EXTERNAL,
  RIO,
} from '@/config/types';
import { SYSTEM_PROJECT } from '@/config/labels-annotations';
import { _VIEW, _CREATE, DEMO } from '@/config/query-params';
import { TEMPLATE_NAME, APP_ID, CONFIG } from '@/config/chart/rio';
import RioConfig from '@/components/chart/rio/Config';
import { findBy } from '@/utils/array';

export default {
  components: { Card, RioConfig },

  async asyncData({ store, route }) {
    let mode = route?.query?.mode ? route.query.mode : _VIEW;
    const hasSchemas = !!store.getters['cluster/schemaFor'](RIO.SERVICE);

    try {
      const templates = await store.dispatch('management/findAll', { type: MANAGEMENT.CATALOG_TEMPLATE });
      const template = findBy(templates, 'spec.displayName', TEMPLATE_NAME);

      if (!template?.id ) {
        return {
          available:     false,
          enabled:       hasSchemas,
          template:      null,
          systemProject: null,
          mode,
        };
      }

      // clusterID is on router.state.clusterid and find
      const projects = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT });
      const targetSystemProject = projects.find(( proj ) => {
        const labels = proj.metadata?.labels || {};

        if ( labels[SYSTEM_PROJECT] === 'true' ) {
          return true;
        }
      });

      if ( !targetSystemProject ) {
        return {
          available:     false,
          enabled:       hasSchemas,
          template:      null,
          systemProject: null,
          mode,
        };
      }

      const namespace = targetSystemProject.metadata.name; // name of system project in management cluster

      // @TODO externalCluster service doesn't like getting things by ID, so load them all and find it...
      const apps = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.APP });
      let app = apps.find(app => app.id === `${ namespace }/${ APP_ID }`);

      const namespaces = await store.dispatch('cluster/findAll', { type: NAMESPACE });

      if ( !app ) {
        mode = _CREATE;

        const latestVersion = template?.spec?.versions?.[0];

        app = await store.dispatch('clusterExternal/create', {
          type:     'app',
          metadata: {
            namespace,
            name: APP_ID
          },
          spec: {
            projectName:     targetSystemProject.namespacedName,
            externalId:      latestVersion.externalId,
            targetNamespace: 'rio-system',
            timeout:         300,
            valuesYaml:      CONFIG,
          }
        });
      }

      return {
        available:     !hasSchemas,
        enabled:       !!app?.id || hasSchemas,
        template,
        systemProject: targetSystemProject,
        app,
        mode,
        namespaces,
        projects
      };
    } catch (e) {
      console.error(e); // eslint-disable-line no-console

      return {
        available: false,
        enabled:   hasSchemas,
        mode,
      };
    }
  },

  data() {
    return { demos };
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
    <div v-if="enabled">
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

    <RioConfig
      v-if="available"
      :config="app"
      :mode="mode"
      :namespaces="namespaces"
      :projects="projects"
    />
    <div v-else-if="!enabled">
      Rio is not currently available
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
