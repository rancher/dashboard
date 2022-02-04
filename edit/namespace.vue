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
import { PROJECT_ID, _VIEW } from '@/config/query-params';
import MoveModal from '@/components/MoveModal';
import ResourceQuota from '@/components/form/ResourceQuota/Namespace';
import Loading from '@/components/Loading';
import { HARVESTER_TYPES, RANCHER_TYPES } from '@/components/form/ResourceQuota/shared';
import { NAME as HARVESTER } from '@/config/product/harvester';

export default {
  components: {
    ContainerResourceLimit,
    CruResource,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    ResourceQuota,
    Tab,
    Tabbed,
    MoveModal
  },

  mixins: [CreateEditView],

  async fetch() {
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });

    this.project = this.projects.find(p => p.id.includes(this.projectName));
  },

  data() {
    let originalQuotaId = null;

    if ( this.liveValue?.metadata?.name ) {
      originalQuotaId = `${ this.liveValue.metadata.name }/default-quota`;
    }

    const projectName = this.value?.metadata?.labels?.[PROJECT] || this.$route.query[PROJECT_ID];

    return {
      originalQuotaId,
      project:                 null,
      projects:                null,
      viewMode:                _VIEW,
      containerResourceLimits: this.value.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT] || this.getDefaultContainerResourceLimits(projectName),
      projectName,
      HARVESTER_TYPES,
      RANCHER_TYPES,
    };
  },

  computed: {
    ...mapGetters(['isSingleProduct']),
    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
    extraColumns() {
      if ( this.$store.getters['isRancher'] && !this.isSingleProduct) {
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
    },

    showResourceQuota() {
      return Object.keys(this.project?.spec?.resourceQuota?.limit || {}).length > 0;
    }
  },

  watch: {
    project(newProject) {
      const limits = this.getDefaultContainerResourceLimits(newProject);

      this.$set(this, 'containerResourceLimits', limits);
    },

    projectName(newProjectName) {
      this.$set(this, 'project', this.projects.find(p => p.id.includes(newProjectName)));
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
      const cluster = this.$store.getters['currentCluster'];
      const projectId = this.project?.id.split('/')[1];
      const annotation = projectId ? `${ cluster.id }:${ projectId }` : null;

      this.value.setLabel(PROJECT, projectId);
      this.value.setAnnotation(PROJECT, annotation);
    },

    getDefaultContainerResourceLimits(projectName) {
      if (!projectName) {
        return;
      }

      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      const project = projects.find(p => p.id.includes(projectName));

      return project?.spec?.containerDefaultResourceLimit || {};
    }
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
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
      <template v-if="!isSingleVirtualCluster2" #project-col>
        <LabeledSelect v-model="projectName" :label="t('namespace.project.label')" :options="projectOpts" />
      </template>
    </NameNsDescription>

    <Tabbed :side-tabs="true">
      <Tab v-if="!isSingleVirtualCluster2 && showResourceQuota" :weight="1" name="container-resource-quotas" :label="t('namespace.resourceQuotas')">
        <div class="row">
          <div class="col span-12">
            <p class="helper-text mb-10">
              <t v-if="mode === viewMode" k="resourceQuota.helpTextDetail" />
              <t v-else k="resourceQuota.helpText" />
            </p>
          </div>
        </div>
        <ResourceQuota v-model="value" :mode="mode" :project="project" :types="isHarvester ? HARVESTER_TYPES : RANCHER_TYPES" />
      </Tab>
      <Tab v-if="!isSingleVirtualCluster2" :weight="0" name="container-resource-limit" :label="t('namespace.containerResourceLimit')">
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
