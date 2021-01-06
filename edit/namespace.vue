<script>

import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledSelect from '@/components/form/LabeledSelect';
import { MANAGEMENT } from '@/config/types';
import { PROJECT } from '@/config/labels-annotations';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';

export default {
  components: {
    ContainerResourceLimit,
    CruResource,
    LabeledSelect,
    Labels,
    NameNsDescription,
    Tab,
    Tabbed
  },

  mixins: [CreateEditView],

  data() {
    let originalQuotaId = null;

    if ( this.originalValue?.metadata?.name ) {
      originalQuotaId = `${ this.originalValue.metadata.name }/default-quota`;
    }

    return {
      originalQuotaId,
      project: this.value?.metadata?.labels?.[PROJECT],
    };
  },

  computed: {
    extraColumns() {
      if ( this.$store.getters['isMultiCluster'] ) {
        return ['project-col'];
      }

      return [];
    },

    projectOpts() {
      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      const out = projects.map((project) => {
        return {
          label: project.nameDisplay,
          value: project.metadata.name,
        };
      });

      out.unshift({
        label: '(None)',
        value: null,
      });

      return out;
    },
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
      const cluster = this.$store.getters['currentCluster'];
      const annotation = this.project ? `${ cluster.id }:${ this.project }` : null;

      this.value.setLabel(PROJECT, this.project);
      this.value.setAnnotation(PROJECT, annotation);
    }
  }

};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
    @apply-hooks="applyHooks"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
      :extra-columns="extraColumns"
    >
      <template #project-col>
        <LabeledSelect v-model="project" :label="t('namespace.project.label')" :options="projectOpts" />
      </template>
    </NameNsDescription>

    <Tabbed :side-tabs="true">
      <Tab name="container-resource-limit" :label="t('namespace.containerResourceLimit')">
        <ContainerResourceLimit
          :mode="mode"
          :namespace="value"
          :register-before-hook="registerBeforeHook"
        />
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        :label="t('generic.labelsAndAnnotations')"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
