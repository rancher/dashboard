<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';
import NamespaceList from '@/components/form/NamespaceList';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import Footer from '@/components/form/Footer';
import { NAMESPACE } from '@/config/types';
import { UNITS, FRACTIONAL } from '@/utils/units';
import ResourceQuotaList from './ResourceQuotaList';
import { RESOURCE_MAPPING } from './ResourceQuota';

const PROJECT_ID_KEY = 'field.cattle.io/projectId';

export default {
  name: 'Project',

  components: {
    ContainerResourceLimit,
    Footer,
    NameNsDescription,
    NamespaceList,
    ResourceQuotaList,
    ResourceTabs,
    Tab,
  },
  mixins: [CreateEditView],

  data() {
    const allNamespaces = this.$store.getters['cluster/all'](NAMESPACE);
    const namespaces = allNamespaces
      .filter(namespace => namespace.metadata.annotations[PROJECT_ID_KEY] === this.value.longId)
      .map(namespace => namespace.metadata.name);
    const resourceQuotas = this.mapSpecToResourceQuotas();

    return {
      allNamespaces, namespaces, resourceQuotas
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },
  methods: {
    done() {
      this.navigateToNamespaceList();
    },

    willSave() {
      this.mapResourceQuotasToSpec();
      this.saveNamespaceChanges();
    },

    navigateToNamespaceList() {
      this.$router.replace({
        name:   'c-cluster-resource',
        params: {
          ...this.$route.params,
          resource: NAMESPACE
        }
      });
    },

    fillEmptyQuotas() {
      if (!this.value.spec.resourceQuota) {
        this.value.spec.resourceQuota = {};
      }

      if (!this.value.spec.resourceQuota.limit) {
        this.value.spec.resourceQuota.limit = {};
      }

      if (!this.value.spec.namespaceDefaultResourceQuota) {
        this.value.spec.namespaceDefaultResourceQuota = {};
      }

      if (!this.value.spec.namespaceDefaultResourceQuota.limit) {
        this.value.spec.namespaceDefaultResourceQuota.limit = {};
      }
    },

    mapSpecToResourceQuotas() {
      this.fillEmptyQuotas();

      return Object.keys(this.value.spec.resourceQuota.limit || {}).map((key) => {
        return {
          resource:     key,
          projectLimit: this.value.spec.resourceQuota.limit[key],
          defaultLimit: this.value.spec.namespaceDefaultResourceQuota.limit[key]
        };
      });
    },

    mapResourceQuotasToSpec() {
      this.value.spec.resourceQuota.limit = {};
      this.value.spec.namespaceDefaultResourceQuota.limit = {};
      this.resourceQuotas.forEach((quota) => {
        const resource = quota.resource;
        const inputExponent = RESOURCE_MAPPING[resource].inputExponent || 0;
        const suffix = inputExponent < 0 ? FRACTIONAL[-1 * inputExponent] : UNITS[inputExponent];

        this.value.spec.resourceQuota.limit[resource] = quota.projectLimit + suffix;
        this.value.spec.namespaceDefaultResourceQuota.limit[resource] = quota.defaultLimit + suffix;
      });
    },

    saveNamespaceChanges() {
      this.allNamespaces.forEach((namespace) => {
        namespace.metadata.annotations = namespace.metadata.annotations || {};
        namespace.metadata.labels = namespace.metadata.labels || {};
        let edited = false;

        const currentlyInProject = namespace.metadata.annotations[PROJECT_ID_KEY] === this.originalValue.longId;
        const shouldBeInProject = this.namespaces.includes(namespace.id);

        if (!shouldBeInProject && currentlyInProject) {
          namespace.metadata.annotations[PROJECT_ID_KEY] = null;
          namespace.metadata.labels[PROJECT_ID_KEY] = null;
          edited = true;
        }

        if (shouldBeInProject && !currentlyInProject) {
          namespace.metadata.annotations[PROJECT_ID_KEY] = this.value.longId;
          namespace.metadata.labels[PROJECT_ID_KEY] = this.value.metadata.name;
          edited = true;
        }

        if (edited) {
          namespace.save();
        }
      });
    }
  }
};
</script>

<template>
  <div class="project">
    <NameNsDescription
      :name-editable="true"
      :value="value"
      :mode="mode"
      :namespaced="false"
      name-label="Name"
      :register-before-hook="registerBeforeHook"
    />
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h2>{{ t('projectPage.namespaces') }}</h2>
        <NamespaceList v-model="namespaces" :mode="mode" />
      </div>
    </div>
    <div class="spacer"></div>
    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab :label="t('projectPage.tabs.resourceQuota.label')" name="resource-quota">
          <ResourceQuotaList :value="resourceQuotas" :mode="mode" />
        </Tab>
        <Tab :label="t('projectPage.tabs.containerResourceLimit.label')" name="container-resource-limit">
          <ContainerResourceLimit
            v-model="value.spec.containerDefaultResourceLimit"
            :mode="mode"
            :register-before-hook="registerBeforeHook"
          />
        </Tab>
      </template>
    </ResourceTabs>
    <Footer :errors="errors" :mode="mode" @save="save" @done="done" />
  </div>
</template>
