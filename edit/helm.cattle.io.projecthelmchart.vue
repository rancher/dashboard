<script>
import Tabbed from '@/components/Tabbed';
import createEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import Questions from '@/components/Questions';

export default {
  components: {
    CruResource,
    NameNsDescription,
    Tabbed,
    Questions
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
      repoType:      'cluster',
      repoName:      'museum',
      chartName:     'chartmuseum',
      versionName: '2.7.0'
    });
  },

  data() {
    return { questions: null, versionInfo: null };
  },

  methods: {
    namespaceFilter(namespace) {
      // we only want the namespaces that match this format
      // ToDo: this is returning the system namespace for some reason and it shouldn't
      // ToDo: this should also filter out namespaces in projects that already have a project monitor
      return namespace.id === `cattle-project-${ namespace.projectId }`;
    },
    namespaceMapper(namespace) {
      return {
        label: namespace.project.spec.displayName,
        value: namespace.id,
      };
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="save"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :namespace-filter="namespaceFilter"
      :namespace-mapper="namespaceMapper"
      name-disabled
      namespace-label="namespace.project.label"
    />
    <!-- ToDo: go back and see where questions.yaml landed in the chart -->
    <!-- <Tabbed
      v-if="versionInfo"
      ref="tabs"
      :side-tabs="true"
    >
      <Questions
        v-model="value"
        tabbed="multiple"
        :target-namespace="value.metadata.namespace"
        :source="versionInfo"
      />
    </Tabbed> -->
  </CruResource>
</template>
