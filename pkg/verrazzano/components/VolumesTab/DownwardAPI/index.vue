<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import DownwardAPIVolumeFile from '@pkg/components/VolumesTab/DownwardAPI/DownwardAPIVolumeFile';

import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

export default {
  name:       'DownwardAPI',
  components: {
    DownwardAPIVolumeFile,
    ArrayListGrouped,
    LabeledInput,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    showDefaultMode: {
      type:    Boolean,
      default: true
    }
  },
  data() {
    const { items = [] } = this.value;

    const files = items.map((item) => {
      const file = this.clone(item);

      file._id = randomStr(4);

      return file;
    });

    return { files };
  },
  computed: {
    showFileRemove() {
      return !this.isView && this.files.length > 1;
    }
  },
  methods: {
    update() {
      const items = [];

      this.files.forEach((file) => {
        const item = this.clone(file);

        delete item._id;

        items.push(item);
      });

      this.setFieldIfNotEmpty('items', items);
    },
    addFile() {
      this.files.push({ _id: randomStr(4) });
    },
    removeFile(index) {
      this.files.splice(index, 1);
      this.queueUpdate();
    },
    updateFile() {
      this.queueUpdate();
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  }
};
</script>

<template>
  <div>
    <div v-if="showDefaultMode">
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            :value="getField('defaultMode')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'defaultMode')"
            :label="t('verrazzano.common.fields.volumes.downwardApi.defaultMode')"
            @input="setFieldIfNotEmpty('defaultMode', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
    </div>
    <div>
      <ArrayListGrouped
        v-model="files"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.common.buttons.addDownwardApiVolumeFile')"
        @add="addFile()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="showFileRemove"
            type="button"
            class="btn role-link close btn-sm"
            @click="removeFile(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <DownwardAPIVolumeFile
            v-model="props.row.value"
            :mode="mode"
            @input="updateFile()"
          />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style scoped>

</style>
