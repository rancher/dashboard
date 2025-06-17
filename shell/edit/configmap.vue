<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import KeyValue from '@shell/components/form/KeyValue';
import Labels from '@shell/components/form/Labels';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { UI_PROJECT_SCOPED } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { SCOPE as CONFIG_MAP_SCOPE, SCOPED_TABS as CONFIG_MAP_SCOPED_TABS } from '@shell/config/query-params';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name:         'CruConfigMap',
  inheritAttrs: false,
  components:   {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed,
    LabeledSelect
  },

  mixins: [CreateEditView, FormValidation],
  data() {
    const { binaryData = {}, data = {} } = this.value;

    return {
      data,
      binaryData,
      isProjectScoped: false,
      selectedProject: null,
      fvFormRuleSets:  [
        {
          path:  'metadata.name',
          rules: ['required'],
        },
        {
          path:  'metadata.namespace',
          rules: ['required'],
        },
      ]
    };
  },
  created() {
    const projectScopedLabel = this.value.metadata?.labels?.[UI_PROJECT_SCOPED];
    const isProjectScoped = !!projectScopedLabel || (this.isCreate && this.$route.query[CONFIG_MAP_SCOPE] === CONFIG_MAP_SCOPED_TABS.PROJECT_SCOPED);

    this.isProjectScoped = isProjectScoped;

    if (isProjectScoped) {
      const clusterId = this.$store.getters['currentCluster'].id;
      const allProjects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);
      const projects = allProjects.filter((p) => p.spec?.clusterName === clusterId);

      if (this.isCreate) {
        // Pick first project as default
        this.selectedProject = {
          label: projects[0].nameDisplay,
          value: projects[0].metadata.name
        };

        this.value.metadata.labels = this.value.metadata.labels || {};
        // Set namespace and project-scoped label
        this.value.metadata.namespace = `${ clusterId }-${ this.selectedProject.value }`;
        this.value.metadata.labels[UI_PROJECT_SCOPED] = this.selectedProject.value;
      } else {
        this.selectedProject = {
          label: projects.find((p) => p.metadata.name === projectScopedLabel).nameDisplay,
          value: projects.find((p) => p.metadata.name === projectScopedLabel).metadata.name
        };
      }
    }
  },
  computed: {
    hasBinaryData() {
      return Object.keys(this.binaryData).length > 0;
    },
    /**
     * Keep all newlines from end, see: https://yaml-multiline.info
     * Apply to 'data' field
     */
    yamlModifiers() {
      return {
        data: Object.keys(this.data).reduce((acc, key) => ({
          ...acc,
          lineWidth: -1,
          [key]:     { chomping: '+' },
        }), {}),
      };
    },

    clusterId() {
      return this.$store.getters['currentCluster'].id;
    },

    projectOpts() {
      let projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      // Filter out projects not for the current cluster
      projects = projects.filter((c) => c.spec?.clusterName === this.clusterId);
      const out = projects.map((project) => {
        return {
          label: project.nameDisplay,
          value: project.metadata.name,
        };
      });

      return out;
    },
  },

  watch: {
    data(neu) {
      this.updateValue(neu, 'data');
    },
    binaryData(neu) {
      this.updateValue(neu, 'binaryData');
    },
    selectedProject(newProject) {
      if (!this.isView) {
        if (newProject) {
          this.value.metadata.labels = this.value.metadata.labels || {};
          this.value.metadata.namespace = `${ this.clusterId }-${ newProject }`;
          this.value.metadata.labels[UI_PROJECT_SCOPED] = newProject;
        }
      }
    }
  },

  methods: {
    async saveConfigMap(saveCb) {
      this.errors = [];
      const yaml = await this.$refs.cru.createResourceYaml(this.yamlModifiers);

      try {
        await this.value.saveYaml(yaml);
        this.done();
      } catch (err) {
        this.errors.push(err);
        saveCb(false);
      }
    },

    updateValue(val, type) {
      this.value[type] = {};

      Object.keys(val).forEach((key) => {
        this.value[type][key] = val[key];
      });
    },
  }
};
</script>

<template>
  <CruResource
    ref="cru"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :yaml-modifiers="yamlModifiers"
    :errors="errors"
    @error="e=>errors = e"
    @finish="saveConfigMap"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isProjectScoped"
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />
    <NameNsDescription
      v-else
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
      :namespaced="false"
      :rules="{
        name: fvGetAndReportPathRules('metadata.name'),
        namespace: fvGetAndReportPathRules('metadata.namespace'),
      }"
    >
      <template #project-selector>
        <LabeledSelect
          v-model:value="selectedProject"
          class="mr-20"
          :disabled="!isCreate"
          :label="t('namespace.project.label')"
          :options="projectOpts"
          required
        />
      </template>
    </NameNsDescription>

    <Tabbed :side-tabs="true">
      <Tab
        name="data"
        :label="t('configmap.tabs.data.label')"
        :weight="2"
      >
        <KeyValue
          key="data"
          v-model:value="data"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
          :initial-empty-row="true"
          :value-can-be-empty="true"
          :value-trim="false"
          :value-markdown-multiline="true"
          :read-multiple="true"
          :read-accept="'*'"
        />
      </Tab>
      <Tab
        name="binary-data"
        :label="t('configmap.tabs.binaryData.label')"
        :weight="1"
      >
        <KeyValue
          key="binaryData"
          v-model:value="binaryData"
          :initial-empty-row="true"
          :handle-base64="true"
          :add-allowed="true"
          :read-allowed="true"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
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
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
.no-binary-data {
  opacity: 0.8;
}
</style>
