<script>
import CruResource from '@shell/components/CruResource';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import LabeledInput from '@shell/components/form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import RadioGroup from '@shell/components/form/RadioGroup';
import LabelValue from '@shell/components/LabelValue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { VM_IMAGE_FILE_FORMAT } from '@shell/utils/validators/vm-image';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { exceptionToErrorsArray } from '@shell/utils/error';

const DOWNLOAD = 'download';
const UPLOAD = 'upload';

export default {
  name: 'EditImage',

  components: {
    Tab,
    Tabbed,
    KeyValue,
    CruResource,
    LabeledInput,
    NameNsDescription,
    RadioGroup,
    LabelValue,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    if ( !this.value.spec ) {
      this.$set(this.value, 'spec', { sourceType: DOWNLOAD });
    }
    this.value.metadata.generateName = 'image-';

    return {
      url:         this.value.spec.url,
      files:       [],
      resource:    '',
      headers:     {},
      fileUrl:     '',
      file:        '',
    };
  },

  computed: {
    uploadFileName() {
      return this.file?.name || '';
    },

    imageName() {
      return this.value?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_NAME] || '-';
    },

    isCreateEdit() {
      return this.isCreate || this.isEdit;
    },

    showEditAsYaml() {
      return this.value.spec.sourceType === DOWNLOAD;
    }
  },

  watch: {
    'value.spec.url'(neu) {
      const url = neu.trim();
      const suffixName = url.split('/').pop();
      const fileSuffix = suffixName.split('.').pop().toLowerCase();

      this.value.spec.url = url;
      if (VM_IMAGE_FILE_FORMAT.includes(fileSuffix)) {
        if (!this.value.spec.displayName) {
          this.$refs.nd.changeNameAndNamespace({
            text:     suffixName,
            selected: this.value.metadata.namespace,
          });
        }
      }
    },

    'value.spec.sourceType'() {
      this.$set(this, 'file', null);
      this.url = '';

      if (this.$refs?.file?.value) {
        this.$refs.file.value = null;
      }
    },
  },

  methods: {
    async saveImage(buttonCb) {
      this.value.spec.displayName = (this.value.spec.displayName || '').trim();

      if (this.value.spec.sourceType === UPLOAD && this.isCreate) {
        try {
          this.value.spec.url = '';

          const file = this.file;

          this.value.metadata.annotations[HCI_ANNOTATIONS.IMAGE_NAME] = file?.name;

          const res = await this.value.save();

          res.uploadImage(file);

          buttonCb(true);
          this.done();
        } catch (e) {
          this.errors = exceptionToErrorsArray(e);
          buttonCb(false);
        }
      } else {
        this.save(buttonCb);
      }
    },

    handleFileUpload() {
      const file = this.$refs.file.files[0];

      this.file = file;

      if (!this.value.spec.displayName) {
        this.$refs.nd.changeNameAndNamespace({
          text:     file?.name,
          selected: this.value.metadata.namespace,
        });
      }
    },

    selectFile() {
      // Clear the value so the user can reselect the same file again
      this.$refs.file.value = null;
      this.$refs.file.click();
    },
  },

};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :can-yaml="showEditAsYaml ? true : false"
    :apply-hooks="applyHooks"
    @finish="saveImage"
  >
    <NameNsDescription
      ref="nd"
      v-model="value"
      :mode="mode"
      :label="t('generic.name')"
      name-key="spec.displayName"
    />

    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
      <Tab name="basic" :label="t('harvester.image.tabs.basics')" :weight="3" class="bordered-table">
        <RadioGroup
          v-if="isCreate"
          v-model="value.spec.sourceType"
          name="model"
          :options="[
            'download',
            'upload',
          ]"
          :labels="[
            t('harvester.image.sourceType.download'),
            t('harvester.image.sourceType.upload'),
          ]"
          :mode="mode"
        />
        <div class="row mb-20 mt-20">
          <div v-if="isCreateEdit" class="col span-12">
            <LabeledInput
              v-if="isEdit"
              v-model="value.spec.sourceType"
              :mode="mode"
              class="mb-20"
              :disabled="isEdit"
              label-key="harvester.image.source"
            />

            <LabeledInput
              v-if="value.spec.sourceType === 'download'"
              v-model="value.spec.url"
              :mode="mode"
              :disabled="isEdit"
              class="labeled-input--tooltip"
              required
              label-key="harvester.image.url"
              :tooltip="t('harvester.image.urlTip', {}, true)"
            />

            <div v-else>
              <button
                v-if="isCreate"
                type="button"
                class="btn role-primary"
                @click="selectFile"
              >
                <span>
                  {{ t('harvester.image.uploadFile') }}
                </span>
                <input
                  v-show="false"
                  id="file"
                  ref="file"
                  type="file"
                  accept=".gz, .qcow, .qcow2, .raw, .img, .xz, .iso"
                  @change="handleFileUpload()"
                />
              </button>

              <div
                v-if="uploadFileName"
                class="fileName mt-5"
              >
                <span class="icon icon-file" />
                {{ uploadFileName }}
              </div>
            </div>
          </div>
          <div
            v-else
            class="col span-12"
          >
            <LabelValue
              :name="t('harvester.image.fileName')"
              :value="imageName"
            />
          </div>
        </div>
      </Tab>

      <Tab name="labels" :label="t('labels.labels.title')" :weight="2" class="bordered-table">
        <KeyValue
          key="labels"
          :value="value.labels"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :pad-left="false"
          :read-allowed="false"
          @input="value.setLabels($event)"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
