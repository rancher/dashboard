<script>
import CruResource from '@/components/CruResource';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabeledInput from '@/components/form/LabeledInput';
import KeyValue from '@/components/form/KeyValue';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import Cookie from 'js-cookie';
import customValidators from '@/utils/custom-validators';
import { _EDIT } from '@/config/query-params';
import { IMAGE_FILE_FORMAT } from '@/config/constant';
import { HCI_IMAGE_SOURCE } from '@/config/labels-annotations';

export default {
  name: 'EditImage',

  components: {
    Tab,
    Tabbed,
    KeyValue,
    CruResource,
    LabeledInput,
    NameNsDescription,
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
      this.$set(this.value, 'spec', {});
    }

    return {
      url:         this.value.spec.url,
      uploadMode:  'url',
      files:       [],
      displayName: '',
      resource:    '',
      headers:     {},
      fileUrl:     '',
      fileSize:    { 'File-Size': '' }
    };
  },

  computed: {
    uploadFileName() {
      return this.files[0]?.name || '';
    },

    isEdit() {
      return this.mode === _EDIT;
    }
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

    uploadMode(neu) {
      this.$set(this, 'files', []);
      this.url = '';
    }
  },

  methods: {
    inputFile(newFile, oldFile) {
      const file = newFile || oldFile;
      const csrf = Cookie.get('CSRF');
      const header = { 'X-Api-Csrf': csrf, 'File-Size': file.size };

      file.headers = header;
    },

    inputFilter(newFile, oldFile, prevent) {
      this.errors = customValidators.imageUrl(newFile.name, this.$store.getters, [], '', 'file');

      if (!/\.(gz|qcow|qcow2|raw|img|xz|iso)$/i.test(newFile.name.toLowerCase())) {
        return prevent();
      }
    },

    async saveImage(buttonCb) {
      this.value.metadata.generateName = 'image-';

      Object.assign(this.value.metadata.annotations, {
        ...this.value.metadata.annotations,
        [HCI_IMAGE_SOURCE]: this.uploadMode // url or file
      });

      if (this.uploadMode !== 'url') {
        try {
          const res = await this.value.save({ extend: { isRes: true } });

          const fileUrl = `v1/harvesterhci.io.virtualmachineimages/${ res.id }?action=upload`;

          this.files[0].postAction = fileUrl;
          this.$refs.upload.active = true;
          buttonCb(true);
          this.done();
        } catch (err) {
          this.errors = [err?.message];
          buttonCb(false);
        }
      } else {
        this.save(buttonCb);
      }
    }
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
    @apply-hooks="applyHooks"
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
      <Tab name="basic" :label="t('harvester.vmPage.detail.tabs.basics')" :weight="3" class="bordered-table">
        <div class="row mb-20 mt-20">
          <div class="col span-12">
            <LabeledInput
              v-model="value.spec.url"
              :mode="mode"
              :disabled="isEdit"
              class="labeled-input--tooltip"
              required
            >
              <template #label>
                <label class="has-tooltip" :style="{'color':'var(--input-label)'}">
                  {{ t('harvester.imagePage.url') }}
                  <i v-tooltip="t('harvester.imagePage.urlTip', {}, raw=true)" class="icon icon-info" style="font-size: 14px" />
                </label>
              </template>
            </LabeledInput>
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
