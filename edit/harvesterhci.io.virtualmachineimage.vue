<script>
import CruResource from '@/components/CruResource';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabeledInput from '@/components/form/LabeledInput';
import KeyValue from '@/components/form/KeyValue';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import LabelValue from '@/components/LabelValue';
import CreateEditView from '@/mixins/create-edit-view';
import { _EDIT } from '@/config/query-params';
import { IMAGE_FILE_FORMAT } from '@/config/constant';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { exceptionToErrorsArray } from '@/utils/error';

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

    return {
      url:         this.value.spec.url,
      files:       [],
      displayName: '',
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

    isEdit() {
      return this.mode === _EDIT;
    },

    imageName() {
      return this.value?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_NAME] || '-';
    },

    isCreateEdit() {
      return this.isCreate || this.isEdit;
    },
  },

  watch: {
    'value.spec.url'(neu) {
      const url = neu.trim();
      const suffixName = url.split('/').pop();
      const fileSuffiic = suffixName.split('.').pop().toLowerCase();

      this.value.spec.url = url;
      if (IMAGE_FILE_FORMAT.includes(fileSuffiic)) {
        if (!this.value.spec.displayName) {
          this.$refs.nd.changeNameAndNamespace({ text: suffixName });
        }
      }
    },

    'value.spec.displayName'(neu) {
      this.displayName = neu;
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
      this.value.metadata.generateName = 'image-';

      if (this.value.spec.sourceType === UPLOAD && this.isCreate) {
        try {
          this.value.spec.url = '';

          if (!this.value.metadata.annotations) {
            this.value.metadata.annotations = {};
          }

          this.value.metadata.annotations[HCI_ANNOTATIONS.IMAGE_NAME] = this.file?.name;

          const res = await this.value.save({ extend: { isRes: true } });

          const formData = new FormData();

          formData.append('chunk', this.file);

          this.$axios.post(`/v1/harvester/harvesterhci.io.virtualmachineimages/${ res.id }?action=upload&size=${ this.file.size }`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'File-Size':    this.file.size,
            }
          });

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
        this.$refs.nd.changeNameAndNamespace({ text: file?.name });
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
    :can-yaml="false"
    :apply-hooks="applyHooks"
    @finish="saveImage"
  >
    <NameNsDescription
      ref="nd"
      :key="value.spec.displayName"
      v-model="value"
      :mode="mode"
      label="Name"
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
              v-if="value.spec.sourceType === 'download'"
              v-model="value.spec.url"
              :mode="mode"
              :disabled="isEdit"
              class="labeled-input--tooltip"
              required
            >
              <template #label>
                <label class="has-tooltip" :style="{'color':'var(--input-label)'}">
                  {{ t('harvester.image.url') }}
                  <i v-tooltip="t('harvester.image.urlTip', {}, raw=true)" class="icon icon-info" style="font-size: 14px" />
                </label>
              </template>
            </LabeledInput>

            <div v-else>
              <button
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
          @input="value.setLabels"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
