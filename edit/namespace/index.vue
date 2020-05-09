<script>

import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import LabeledSelect from '@/components/form/LabeledSelect';
import { EXTERNAL } from '@/config/types';
import { PROJECT } from '@/config/labels-annotations';
import ResourceTabs from '@/components/form/ResourceTabs';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import Tab from '@/components/Tabbed/Tab';

export default {
  components: {
    ContainerResourceLimit,
    Footer,
    LabeledSelect,
    NameNsDescription,
    ResourceTabs,
    Tab
  },

  mixins:     [CreateEditView],

  data() {
    let originalQuotaId = null;

    if (!!this.originalValue) {
      originalQuotaId = `${ this.originalValue.metadata.name }/default-quota`;
    }

    return {
      originalQuotaId,
      project: this.value?.metadata?.labels?.[PROJECT],
    };
  },

  computed: {
    extraColumns() {
      if ( this.$store.getters['isRancher'] ) {
        return ['project-col'];
      }

      return [];
    },

    projectOpts() {
      const projects = this.$store.getters['clusterExternal/all'](EXTERNAL.PROJECT);

      const out = projects.map((project) => {
        return {
          label: project.nameDisplay,
          value: project.id,
        };
      });

      out.unshift({
        label: '(None)',
        value: null,
      });

      return out;
    },
  },

  watch: {
    project(val) {
      this.value.setLabel(PROJECT, val);
    },
  },

};
</script>

<template>
  <div>
    <form>
      <NameNsDescription
        :value="value"
        :namespaced="false"
        :mode="mode"
        :extra-columns="extraColumns"
      >
        <template #project-col>
          <LabeledSelect v-model="project" label="Project" :options="projectOpts" />
        </template>
      </NameNsDescription>

      <div class="spacer"></div>

      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab name="container-resource-limit" label="Container Default Resource Limit">
            <ContainerResourceLimit
              :mode="mode"
              :namespace="value"
              :register-before-hook="registerBeforeHook"
            />
          </Tab>
        </template>
      </ResourceTabs>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </form>
  </div>
</template>
