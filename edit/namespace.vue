<script>
import { mapGetters } from 'vuex';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledSelect from '@/components/form/LabeledSelect';
import { MANAGEMENT } from '@/config/types';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT, PROJECT } from '@/config/labels-annotations';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import { PROJECT_ID } from '@/config/query-params';
import MoveModal from '@/components/MoveModal';

export default {
  components: {
    ContainerResourceLimit,
    CruResource,
    LabeledSelect,
    Labels,
    NameNsDescription,
    Tab,
    Tabbed,
    MoveModal
  },

  mixins: [CreateEditView],

  data() {
    let originalQuotaId = null;

    if ( this.originalValue?.metadata?.name ) {
      originalQuotaId = `${ this.originalValue.metadata.name }/default-quota`;
    }
    let projectName = this.value?.metadata?.labels?.[PROJECT] || this.$route.query[PROJECT_ID];
    const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

    const project = projects.find(p => p.id.includes(projectName));

    // namespaces' project label remains when a project has been deleted: verify this project still exists
    if (!project && this.value?.metadata?.labels?.[PROJECT]) {
      delete this.value.metadata.labels[PROJECT];
      projectName = null;
    }

    return {
      originalQuotaId,
      project:                 projectName,
      containerResourceLimits: this.value.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT] || this.getDefaultContainerResourceLimits(projectName)
    };
  },

  computed: {
    ...mapGetters(['isSingleVirtualCluster']),
    extraColumns() {
      if ( this.$store.getters['isRancher'] && !this.isSingleVirtualCluster) {
        return ['project-col'];
      }

      return [];
    },

    projectOpts() {
      const clusterId = this.$store.getters['currentCluster'].id;
      let projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      // Filter out projects not for the current cluster
      projects = projects.filter(c => c.spec?.clusterName === clusterId);

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

    doneLocationOverride() {
      return this.value.listLocation;
    }
  },

  watch: {
    project(newProject) {
      const limits = this.getDefaultContainerResourceLimits(newProject);

      this.$set(this, 'containerResourceLimits', limits);
    }
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
    },

    getDefaultContainerResourceLimits(projectName) {
      if (!projectName) {
        return;
      }

      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      const project = projects.find(p => p.id.includes(projectName));

      return project.spec.containerDefaultResourceLimit || {};
    }
  }

};
</script>

<template>
  <CruResource
    :done-route="doneLocationOverride.name"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :apply-hooks="applyHooks"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
      :extra-columns="extraColumns"
    >
      <template v-if="!isSingleVirtualCluster" #project-col>
        <LabeledSelect v-model="project" :label="t('namespace.project.label')" :options="projectOpts" />
      </template>
    </NameNsDescription>

    <Tabbed :side-tabs="true">
      <Tab v-if="!isSingleVirtualCluster" name="container-resource-limit" :label="t('namespace.containerResourceLimit')">
        <ContainerResourceLimit
          :key="JSON.stringify(containerResourceLimits)"
          :value="containerResourceLimits"
          :mode="mode"
          :namespace="value"
          :register-before-hook="registerBeforeHook"
        />
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
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
    <MoveModal />
  </CruResource>
</template>
