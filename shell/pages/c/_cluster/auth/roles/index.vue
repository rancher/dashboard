<script>
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';
import { NAME } from '@shell/config/product/auth';
import { BLANK_CLUSTER } from '@shell/store';

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;
const CLUSTER = SUBTYPE_MAPPING.CLUSTER.key;
const PROJECT = SUBTYPE_MAPPING.NAMESPACE.key;

const createGlobalRole = {
  name:   `c-cluster-${ NAME }-roles-resource-create`,
  params: {
    cluster:  BLANK_CLUSTER,
    resource: MANAGEMENT.GLOBAL_ROLE,
  }
};
const createRoleTemplate = {
  name:   `c-cluster-${ NAME }-roles-resource-create`,
  params: {
    cluster:  BLANK_CLUSTER,
    resource: MANAGEMENT.ROLE_TEMPLATE,
  }
};

const createVerbs = new Set(['PUT', 'blocked-PUT']);

export default {
  name: 'Roles',

  components: {
    Tab, Tabbed, ResourceTable, Loading
  },

  async asyncData({ store }) {
    const globalRoleSchema = store.getters[`management/schemaFor`](MANAGEMENT.GLOBAL_ROLE);
    const roleTemplatesSchema = store.getters[`management/schemaFor`](MANAGEMENT.ROLE_TEMPLATE);

    return {
      globalRoles:   globalRoleSchema ? await store.dispatch(`management/findAll`, { type: MANAGEMENT.GLOBAL_ROLE }) : [],
      roleTemplates: roleTemplatesSchema ? await store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }) : [],
    };
  },

  data() {
    const globalRoleSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.GLOBAL_ROLE);
    const roleTemplatesSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.ROLE_TEMPLATE);

    const roleTemplateHeaders = this.$store.getters['type-map/headersFor'](roleTemplatesSchema);
    const defaultHeaderIndex = roleTemplateHeaders.findIndex(header => header.name === 'default');

    return {
      tabs: {
        [GLOBAL]: {
          canFetch:       globalRoleSchema?.collectionMethods.find(verb => verb === 'GET'),
          canCreate:      globalRoleSchema?.resourceMethods.find(verb => createVerbs.has(verb)),
          weight:         3,
          labelKey:       SUBTYPE_MAPPING.GLOBAL.labelKey,
          schema:         globalRoleSchema,
          createLocation: {
            ...createGlobalRole,
            query: { roleContext: GLOBAL }
          },
        },
        [CLUSTER]: {
          canFetch:       roleTemplatesSchema?.collectionMethods.find(verb => verb === 'GET'),
          canCreate:      roleTemplatesSchema?.resourceMethods.find(verb => createVerbs.has(verb)),
          labelKey:       SUBTYPE_MAPPING.CLUSTER.labelKey,
          weight:         2,
          schema:         roleTemplatesSchema,
          headers:        this.applyDefaultHeaderLabel(roleTemplateHeaders, defaultHeaderIndex, 'tableHeaders.authRoles.clusterDefault'),
          createLocation: {
            ...createRoleTemplate,
            query: { roleContext: CLUSTER }
          },
        },
        [PROJECT]: {
          canFetch:       roleTemplatesSchema?.collectionMethods.find(verb => verb === 'GET'),
          canCreate:      roleTemplatesSchema?.resourceMethods.find(verb => createVerbs.has(verb)),
          labelKey:       SUBTYPE_MAPPING.NAMESPACE.labelKey,
          weight:         1,
          schema:         roleTemplatesSchema,
          headers:        this.applyDefaultHeaderLabel(roleTemplateHeaders, defaultHeaderIndex, 'tableHeaders.authRoles.projectDefault'),
          createLocation: {
            ...createRoleTemplate,
            query: { roleContext: PROJECT }
          },
        },
      },

      GLOBAL,
      CLUSTER,
      PROJECT,

      globalRoles:   null,
      roleTemplates: null,
    };
  },

  computed: {
    globalResources() {
      return this.globalRoles;
    },

    clusterResources() {
      return this.roleTemplates.filter(r => r.context === SUBTYPE_MAPPING.CLUSTER.context);
    },

    namespaceResources() {
      return this.roleTemplates.filter(r => r.context === SUBTYPE_MAPPING.NAMESPACE.context);
    },

    type() {
      if (this.$route.hash.endsWith(PROJECT)) {
        return PROJECT;
      }
      if (this.$route.hash.endsWith(CLUSTER)) {
        return CLUSTER;
      }

      return GLOBAL;
    },

    canCreate() {
      return this.tabs[this.type].canCreate;
    },

    createLabel() {
      return this.t(`rbac.roletemplate.subtypes.${ this.type }.createButton`);
    },

    createLocation() {
      return this.tabs[this.type].createLocation;
    }

  },

  methods: {
    applyDefaultHeaderLabel(roleTemplateHeaders, defaultHeaderIndex, labelKey) {
      const headers = [...roleTemplateHeaders];

      headers[defaultHeaderIndex] = {
        ...roleTemplateHeaders[defaultHeaderIndex],
        labelKey,
      };

      return headers;
    }
  }

};
</script>

<template>
  <Loading v-if="!globalRoles || !roleTemplates" />
  <div v-else>
    <header class="header-layout">
      <div class="title">
        <h1 class="m-0">
          {{ t('rbac.roletemplate.label') }}
        </h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <n-link
            v-if="canCreate"
            :to="createLocation"
            class="btn role-primary"
          >
            {{ createLabel }}
          </n-link>
        </div>
      </div>
    </header>
    <Tabbed>
      <Tab
        v-if="tabs[GLOBAL].canFetch"
        :name="GLOBAL"
        :weight="tabs[GLOBAL].weight"
        :label-key="tabs[GLOBAL].labelKey"
      >
        <ResourceTable
          :schema="tabs[GLOBAL].schema"
          :rows="globalResources"
        />
      </Tab>

      <Tab
        v-if="tabs[CLUSTER].canFetch"
        :name="CLUSTER"
        :weight="tabs[CLUSTER].weight"
        :label-key="tabs[CLUSTER].labelKey"
      >
        <ResourceTable
          :schema="tabs[CLUSTER].schema"
          :headers="tabs[CLUSTER].headers"
          :rows="clusterResources"
        />
      </Tab>

      <Tab
        v-if="tabs[PROJECT].canFetch"
        :name="PROJECT"
        :weight="tabs[PROJECT].weight"
        :label-key="tabs[PROJECT].labelKey"
      >
        <ResourceTable
          :schema="tabs[PROJECT].schema"
          :headers="tabs[PROJECT].headers"
          :rows="namespaceResources"
        />
      </Tab>
    </Tabbed>
  </div>
</template>
