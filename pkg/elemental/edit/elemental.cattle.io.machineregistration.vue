<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import Labels from '@shell/components/form/Labels';
import DetailText from '@shell/components/DetailText';
import AsyncButton from '@shell/components/AsyncButton';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { downloadFile, generateZip } from '@shell/utils/download';
import IsoBluildInstructions from '../utils/iso-build-instructions.md';

export default {
  name:       'MachineRegistrationEditView',
  components: {
    Loading, CruResource, YamlEditor, Labels, Banner, FileSelector, DetailText, AsyncButton, NameNsDescription
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  data() {
    return {
      cloudConfig:  typeof this.value.spec.cloudConfig === 'string' ? this.value.spec.cloudConfig : saferDump(this.value.spec.cloudConfig),
      yamlErrors:   null
    };
  },
  watch: {
    cloudConfig: {
      handler(neu) {
        try {
          const parsed = jsyaml.load(neu);

          this.value.spec.cloudConfig = parsed;
          this.yamlErrors = null;
        } catch (e) {
          this.yamlErrors = exceptionToErrorsArray(e);
        }
      },
      immediate: true
    }
  },
  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    isView() {
      return this.mode !== _CREATE && this.mode !== _EDIT;
    },
    editorMode() {
      if (!this.isView) {
        return EDITOR_MODES.EDIT_CODE;
      }

      return EDITOR_MODES.VIEW_CODE;
    },
    hasBeenCreated() {
      return !!this.value.id;
    }
  },
  methods: {
    async save(saveCb) {
      this.errors = [];
      try {
        await this.value.save();
        saveCb(true);

        if (this.isCreate) {
          this.$router.replace(this.value.detailLocation);
        } else {
          this.done();
        }
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        saveCb(false);
      }
    },
    onFileSelected(value) {
      const component = this.$refs.yamleditor;

      if (component) {
        component.updateValue(value);
      }
    },
    async getMachineRegistrationData() {
      const url = `${ window.location.origin }/elemental/registration/${ this.value.status.registrationToken }`;

      try {
        const inStore = this.$store.getters['currentStore']();
        const res = await this.$store.dispatch(`${ inStore }/request`, { url, responseType: 'blob' });
        const machineRegFileName = `${ this.value.metadata.name }_registrationURL.yaml`;

        return {
          data:     res.data,
          fileName: machineRegFileName
        };
      } catch (e) {
        return { error: e };
      }
    },
    async downloadZip(btnCb) {
      const machineReg = await this.getMachineRegistrationData();

      if (machineReg.data) {
        const zipData = {};
        const instructionsData = {
          data:     new Blob([IsoBluildInstructions.body], { type: 'text/markdown; charset=UTF-8' }),
          fileName: 'instructions.md'
        };

        zipData[machineReg.fileName] = machineReg.data;
        zipData[instructionsData.fileName] = instructionsData.data;

        try {
          const zip = await generateZip(zipData);

          downloadFile('generate_iso_image.zip', zip, 'application/zip');
          btnCb(true);
        } catch (error) {
          btnCb(false);
        }
      } else {
        btnCb(false);
      }
    }
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :can-yaml="true"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div
      v-if="hasBeenCreated"
      class="row mt-40 mb-40"
    >
      <div class="col span-8">
        <h3>{{ t('elemental.machineRegistration.create.registrationURL.title') }}</h3>
        <DetailText
          :value="value.status.registrationURL"
          :label="t('elemental.machineRegistration.create.registrationURL.label')"
        />
      </div>
    </div>
    <div
      v-if="hasBeenCreated"
      class="row mb-40"
    >
      <div class="col span-12">
        <h3>{{ t('elemental.machineRegistration.edit.imageSetup') }}</h3>
        <p>{{ t('elemental.machineRegistration.edit.imageInstructionsDownload') }} <AsyncButton class="ml-10" mode="download" @click="downloadZip" /></p>
      </div>
    </div>
    <div
      class="row mb-40"
      :class="{'mt-40': !hasBeenCreated }"
    >
      <div class="col span-12">
        <h3>{{ t('elemental.machineRegistration.create.configuration') }}</h3>
        <NameNsDescription v-model="value" :mode="mode" :description-hidden="true" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <h3>{{ t('elemental.machineRegistration.create.cloudConfiguration') }}</h3>
        <YamlEditor
          ref="yamleditor"
          v-model="cloudConfig"
          class="mb-20"
          :editor-mode="editorMode"
        />
        <div
          v-if="!isView"
          class="mb-20"
        >
          <FileSelector
            class="btn role-secondary"
            :label="t('elemental.machineRegistration.create.readFromFile')"
            @selected="onFileSelected"
          />
        </div>
        <Banner v-for="(err, i) in yamlErrors" :key="i" color="error" :label="err" />
      </div>
    </div>
    <div class="row mb-40">
      <div class="col span-6">
        <Labels
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
</style>
