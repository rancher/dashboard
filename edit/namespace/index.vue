<script>

import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceQuota from '@/edit/namespace/ResourceQuota';
import Footer from '@/components/form/Footer';
import LabelsAndAnnotationsEditor from '@/components/LabelsAndAnnotations/Editor';
import LabeledSelect from '@/components/form/LabeledSelect';
import { EXTERNAL } from '@/config/types';
import { PROJECT } from '@/config/labels-annotations';

export default {
  components: {
    ResourceQuota, Footer, LabeledSelect, LabelsAndAnnotationsEditor, NameNsDescription
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
      <NameNsDescription v-model="value" :namespaced="false" :mode="mode" :extra-columns="extraColumns">
        <template #project-col>
          <LabeledSelect v-model="project" label="Project" :options="projectOpts" />
        </template>
      </NameNsDescription>

      <h4 class="mb-10">
        Container Default Resource Limit
      </h4>
      <div class="row">
        <ResourceQuota
          :original-id="originalQuotaId"
          class="col span-12"
          :register-after-hook="registerAfterHook"
          :mode="mode"
          :namespace="value"
        />
      </div>
      <LabelsAndAnnotationsEditor :mode="mode" :labels.sync="value.metadata.labels" :annotations.sync="value.metadata.annotations" />
      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </form>
  </div>
</template>
