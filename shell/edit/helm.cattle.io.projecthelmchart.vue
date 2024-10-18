<script>
import Tabbed from '@shell/components/Tabbed';
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Questions from '@shell/components/Questions';
import { CONFIG_MAP, NAMESPACE } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import Loading from '@shell/components/Loading';
import jsyaml from 'js-yaml';

export default {
  components: {
    CruResource,
    LabeledSelect,
    LabeledInput,
    Tabbed,
    Questions,
    Loading
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
    await this.$store.dispatch('catalog/load');
    const inStore = this.$store.getters['currentStore'](NAMESPACE);
    const federatorSystemNamespacesConfigMap = await this.$store.dispatch('cluster/find', { type: CONFIG_MAP, id: 'cattle-monitoring-system/prometheus-federator-system-namespaces' });

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
  <CruResource
    v-if="!loading"
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
        >
          <Questions
            v-model:value="value.spec.values"
            tabbed="multiple"
            :target-namespace="value.metadata.namespace"
            :source="selectedNamespaceQuestions"
          />
        </Tabbed>
      </div>
    </div>
  </CruResource>
  <Loading v-else />
</template>

<style lang="scss" scoped>
.row {
  margin-bottom: 20px;
}
</style>
