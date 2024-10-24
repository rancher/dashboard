<script>
import { mapGetters } from 'vuex';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { MANAGEMENT } from '@shell/config/types';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT, PROJECT } from '@shell/config/labels-annotations';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import CruResource from '@shell/components/CruResource';
import { PROJECT_ID, _VIEW, FLAT_VIEW, _CREATE } from '@shell/config/query-params';
import MoveModal from '@shell/components/MoveModal';
import ResourceQuota from '@shell/components/form/ResourceQuota/Namespace';
import Loading from '@shell/components/Loading';
import { HARVESTER_TYPES, RANCHER_TYPES } from '@shell/components/form/ResourceQuota/shared';
import Labels from '@shell/components/form/Labels';
import { randomStr } from '@shell/utils/string';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';

export default {
  emits:      ['input'],
  components: {
    ContainerResourceLimit,
    CruResource,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    PodSecurityAdmission,
    ResourceQuota,
    Tab,
    ResourceTabs,
    MoveModal
  },

  mixins:       [CreateEditView],
  inheritAttrs: false,

  async fetch() {
    if (this.$store.getters['management/schemaFor'](MANAGEMENT.PROJECT)) {
      this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });

      this.project = this.projects.find((p) => p.id.includes(this.projectName));
    }
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
      containerResourceLimits: this.value.annotations?.[CONTAINER_DEFAULT_RESOURCE_LIMIT] || this.getDefaultContainerResourceLimits(projectName),
      rerenderNums:            randomStr(4),
      projectName,
      HARVESTER_TYPES,
      RANCHER_TYPES,
    };
  },

  computed: {
    ...mapGetters(['isStandaloneHarvester']),

    isCreate() {
      return this.mode === _CREATE;
    },

    projectOpts() {
      const clusterId = this.$store.getters['currentCluster'].id;
      let projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      // Filter out projects not for the current cluster
      projects = projects.filter((c) => c.spec?.clusterName === clusterId);
      const out = projects.map((project) => {
        return {
          label: project.nameDisplay,
          value: project.metadata.name,
        };
      });

      out.unshift({
        label: this.t('namespace.project.none'),
        value: null,
      });

      return out;
    },

    doneLocationOverride() {
      return this.value.listLocation;
    },

    showResourceQuota() {
      return (!this.isStandaloneHarvester) && Object.keys(this.project?.spec?.resourceQuota?.limit || {}).length > 0;
    },

    showContainerResourceLimit() {
      return !this.isStandaloneHarvester;
    },

    flatView() {
      return (this.$route.query[FLAT_VIEW] || false);
    },

    showPodSecurityAdmission() {
      return !this.isStandaloneHarvester;
    },

    showHarvesterHelpText() {
      return !this.isStandaloneHarvester && this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
  },

  watch: {
    project() {
      const limits = this.getDefaultContainerResourceLimits(this.projectName);

      this['containerResourceLimits'] = limits;
    },

    projectName(newProjectName) {
      this['project'] = this.projects.find((p) => p.id.includes(newProjectName));
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
      const project = projects.find((p) => p.id.includes(projectName));

      return project?.spec?.containerDefaultResourceLimit || {};
    },

    PSAChanged($event) {
      this.value.setLabels($event);
      this.rerenderNums = randomStr(4);
    }
  },
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
      :extra-columns="['project-col']"
    >
      <template
        v-if="flatView && isCreate"
        #project-col
      >
        <LabeledSelect
          v-model:value="projectName"
          data-testid="name-ns-description-project"
          :label="t('namespace.project.label')"
          :options="projectOpts"
        />
      </template>
    </NameNsDescription>
    <ResourceTabs
      :value="value"
      :mode="mode"
      :side-tabs="true"
      @update:value="$emit('input', $event)"
    >
      <Tab
        v-if="showResourceQuota"
        :weight="1"
        name="container-resource-quotas"
        :label="t('namespace.resourceQuotas')"
      >
        <div class="row">
          <div class="col span-12">
            <p class="helper-text mb-10">
              <t
                v-if="mode === viewMode"
                k="resourceQuota.helpTextDetail"
              />
              <t
                v-else
                k="resourceQuota.helpText"
              />
              <span v-if="showHarvesterHelpText">
                {{ t('resourceQuota.helpTextHarvester') }}
              </span>
            </p>
          </div>
        </div>
        <ResourceQuota
          :value="value"
          :mode="mode"
          :project="project"
          :types="isStandaloneHarvester ? HARVESTER_TYPES : RANCHER_TYPES"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        v-if="showContainerResourceLimit"
        :weight="0"
        name="container-resource-limit"
        :label="t('namespace.containerResourceLimit')"
      >
        <ContainerResourceLimit
          :value="containerResourceLimits"
          :mode="mode"
          :namespace="value"
          :register-before-hook="registerBeforeHook"
          data-testid="namespace-container-resource-limit"
        />
      </Tab>
      <Tab
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
      <Tab
        v-if="showPodSecurityAdmission"
        name="pod-security-admission"
        label-key="podSecurityAdmission.name"
        :label="t('podSecurityAdmission.name')"
      >
        <PodSecurityAdmission
          :labels="value.labels"
          :mode="mode"
          labels-prefix="pod-security.kubernetes.io/"
          @updateLabels="PSAChanged"
        />
      </Tab>
    </ResourceTabs>
    <MoveModal v-if="projects" />
  </CruResource>
</template>
