<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import Labels from '@shell/components/form/Labels';
import DetailText from '@shell/components/DetailText';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { saveAs } from 'file-saver';
import { addParams } from '@shell/utils/url';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  name:       'MachineRegistrationEditView',
  components: {
    Loading, LabeledInput, CruResource, YamlEditor, Labels, Banner, FileSelector, DetailText, AsyncButton
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
    return { cloudConfig: typeof this.value.spec.cloudConfig === 'string' ? this.value.spec.cloudConfig : saferDump(this.value.spec.cloudConfig), yamlErrors: null };
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
    async downloadRegistrationUrl(btnCb) {
      const url = this.value.status.registrationURL;

      // url = addParams(url, {
      //   // previous:   this.previous,
      //   pretty:     true,
      //   limitBytes: 750 * 1024 * 1024,
      // });

      try {
        const inStore = this.$store.getters['currentStore']();
        const res = await this.$store.dispatch(`${ inStore }/request`, { url, responseType: 'blob' });
        const fileName = `${ this.value.metadata.name }_registrationURL.yaml`;

        saveAs(res.data, fileName);
        btnCb(true);
      } catch (e) {
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
    :can-yaml="false"
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
      <div class="col span-6">
        <h3>{{ t('elemental.machineRegistration.create.registrationToken') }}</h3>
        <DetailText
          :value="value.status.registrationToken"
          :label="t('elemental.machineRegistration.create.registrationToken')"
          :conceal="true"
        />
      </div>
      <div class="col span-6">
        <h3>{{ t('elemental.machineRegistration.create.registrationURL') }}</h3>
        <DetailText
          :value="value.status.registrationURL"
          :label="t('elemental.machineRegistration.create.registrationURL')"
          :conceal="true"
        />
      </div>
    </div>
    <div
      v-if="hasBeenCreated"
      class="row mb-40"
    >
      <div class="col span-12">
        <h3>Setting up an OS image</h3>
        <ul class="instructions">
          <li>
            <span class="instructionsTitle">1) Download the Machine Registration</span>
            <span class="ml-10"><AsyncButton mode="download" @click="downloadRegistrationUrl" /></span>
            <p class="mt-10">
              <i>(or click <a :href="value.status.registrationURL" rel="noopener" target="_blank">here</a> to get the file content)</i>
            </p>
          </li>
          <li>
            <p class="instructionsTitle">
              2) Create a generic OS image with additional tooling (like cos-toolkit and e.g. xorriso for ISO creation)
            </p>
            <p><code>git clonehttps://github.com/rancher-sandbox/os2.git</code></p>
            <p><code>cd os2</code></p>
            <p><code>docker build -f Dockerfile .</code></p>
          </li>
          <li>
            <p class="instructionsTitle">
              3) Create the required ISO/vm/cloud image with the embedded token
            </p>
            <p><code>git clone https://github.com/rancher-sandbox/rancher-node-image.git</code></p>
            <p><code>cd rancher-node-image</code></p>
            <p><code>./elemental-iso-build "--the-image-you-built-in-step1--" "--format--" "-registrationData-"</code></p>
            <p>Example: <code>elemental-iso-build 2641311c7f67 iso ./cxggjsnlppn9sl7g69j9srnzl7v9ljhv8qp8h9b7kmfxkfgl4br4mr</code></p>
          </li>
          <li>
          </li>
        </ul>
      </div>
    </div>
    <div
      class="row mb-40"
      :class="{'mt-40': !hasBeenCreated }"
    >
      <div class="col span-6">
        <h3>{{ t('elemental.machineRegistration.create.configuration') }}</h3>
        <LabeledInput
          v-model.trim="value.metadata.name"
          :required="true"
          :label="t('elemental.machineRegistration.create.name.label')"
          :placeholder="t('elemental.machineRegistration.create.name.placeholder', null, true)"
          :mode="mode"
          :disabled="!isCreate"
        />
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
.instructions {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    margin-bottom: 20px;

    .instructionsTitle {
      text-decoration: underline;
      margin-bottom: 10px;
    }

    code {
      margin-bottom: 10px;
    }
  }
}
</style>
