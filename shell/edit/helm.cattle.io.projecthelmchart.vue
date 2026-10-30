<script>
import Tabbed from '@shell/components/Tabbed';
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Questions from '@shell/components/Questions';
import { CONFIG_MAP, NAMESPACE } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import jsyaml from 'js-yaml';
import { PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP } from '@shell/utils/monitoring';

export default {
  components: {
    CruResource,
    LabeledSelect,
    LabeledInput,
    Tabbed,
    Questions,
    Loading,
    Banner
  },

  mixins: [createEditView],

  inheritAttrs: false,

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    let federatorSystemNamespacesConfigMap;

    try {
      federatorSystemNamespacesConfigMap = await this.$store.dispatch('cluster/find', {
        type: CONFIG_MAP, id: PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP, opt: { force: true, watch: false }
      });
    } catch (e) { // a 404 means the federator isn't installed
    }

    this.$store.commit('hasPrometheusFederator', !!federatorSystemNamespacesConfigMap);

    if (!federatorSystemNamespacesConfigMap) {
      this.loading = false;

      return;
    }

    await this.$store.dispatch('catalog/load');
    const inStore = this.$store.getters['currentStore'](NAMESPACE);

    this.systemNamespaces = JSON.parse(federatorSystemNamespacesConfigMap?.data?.['system-namespaces.json']);

    this.namespaces = this.$store.getters[`${ inStore }/all`](NAMESPACE)
      .filter(this.namespaceFilter)
      .map(this.namespaceMapper);

    this.loading = false;
  },

  data() {
    if (!this.value.spec.values) {
      this.value.spec['values'] = {};
    }

    return {
      systemNamespaces:           null,
      namespaces:                 [],
      loading:                    true,
      inStore:                    this.$store.getters['currentStore'](),
      selectedNamespaceQuestions: null,
    };
  },

  watch: {
    /**
     * Given the current namespace, fetch a specific secret from within which will contain a questions.yaml
     */
    async currentNamespace(neu, old) {
      if (!neu) {
        return;
      }

      const configMapRelationship = neu.metadata?.relationships.find((relationship) => relationship?.toType === CONFIG_MAP);

      if (!configMapRelationship?.toId) {
        return;
      }

      const res = await this.$store.dispatch(`${ this.inStore }/find`, { type: CONFIG_MAP, id: configMapRelationship.toId });
      const questionsYaml = res?.data?.['questions.yaml'];

      if (!questionsYaml) {
        return;
      }
      this.selectedNamespaceQuestions = jsyaml.load(questionsYaml)?.questions;
    }
  },

  computed: {
    hasPrometheusFederator() {
      return this.$store.getters['hasPrometheusFederator'];
    },

    currentNamespace() {
      return this.namespaces.find((namespace) => namespace.id === this.value?.metadata?.namespace);
    }
  },

  methods: {
    getNamespaceConfigMapId(namespace) {
      return this.currentNamespace?.metadata?.relationships.find((relationship) => relationship?.toType === 'configmap')?.toId;
    },
    namespaceFilter(namespace) {
      const excludeProjects = [...this.systemNamespaces?.systemProjectLabelValues || [], this.systemNamespaces?.projectReleaseLabelValue];

      return namespace?.project && namespace?.metadata?.labels?.['helm.cattle.io/helm-project-operated'] && !excludeProjects.includes(namespace.projectId);
    },
    namespaceMapper(namespace) {
      return {
        ...namespace,
        configMapId: this.getNamespaceConfigMapId(namespace),
        label:       namespace?.project?.spec?.displayName,
        value:       namespace?.id,
      };
    }
  }
};
</script>

<template>
  <Loading v-if="loading" />
  <Banner
    v-else-if="!hasPrometheusFederator"
    color="warning"
    :label="t('monitoring.projectMonitoring.federatorNotInstalled')"
    data-testid="project-monitoring-federator-not-installed"
  />
  <CruResource
    v-else
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="save"
  >
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.metadata.namespace"
          :label="t('namespace.project.label')"
          :options="namespaces"
          required
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.metadata.description"
          :label="t('nameNsDescription.description.label')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <Tabbed
          v-if="!!currentNamespace && selectedNamespaceQuestions"
          ref="tabs"
          :side-tabs="true"
          :use-hash="useTabbedHash"
          :default-tab="defaultTab"
        >
          <Questions
            v-model:value="value.spec.values"
            tabbed="multiple"
            :target-namespace="value.metadata.namespace"
            :source="selectedNamespaceQuestions"
            :mode="mode"
          />
        </Tabbed>
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
.row {
  margin-bottom: 20px;
}
</style>
