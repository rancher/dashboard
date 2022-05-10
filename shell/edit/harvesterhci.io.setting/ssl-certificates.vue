<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FileSelector from '@shell/components/form/FileSelector';

export default {
  name: 'HarvesterSSLCertificates',

  components: { FileSelector },

  mixins: [CreateEditView],

  data() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parseDefaultValue = JSON.parse(this.value.default);
    }

    return {
      parseDefaultValue,
      caFileName:                '',
      publicCertificateFileName: '',
      privateKeyFileName:        ''
    };
  },

  methods: {
    onKeySelectedCa(type, file) {
      const { name, value } = file;

      this.$set(this.parseDefaultValue, type, value);
      this.$set(this, `${ type }FileName`, name);
      const _value = JSON.stringify(this.parseDefaultValue);

      this.$set(this.value, 'value', _value);
    }
  },

  watch: {
    value: {
      handler(neu) {
        const parseDefaultValue = JSON.parse(neu.value);

        this.$set(this, 'parseDefaultValue', parseDefaultValue);
      },
      deep: true
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-12">
        <div class="mb-10">
          {{ t('harvester.setting.sslCertificates.publicCertificate') }}
        </div>

        <div class="chooseFile">
          <FileSelector
            :include-file-name="true"
            class="btn btn-sm bg-primary mr-20"
            label="Choose File"
            @selected="onKeySelectedCa('publicCertificate', $event)"
          />
          <span :class="{ 'text-muted': !publicCertificateFileName }">{{ publicCertificateFileName ? publicCertificateFileName : t('harvester.generic.noFileChosen') }}</span>
        </div>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <div class="mb-10">
          {{ t('harvester.setting.sslCertificates.privateKey') }}
        </div>

        <div class="chooseFile">
          <FileSelector
            :include-file-name="true"
            class="btn btn-sm bg-primary mr-20"
            label="Choose File"
            @selected="onKeySelectedCa('privateKey', $event)"
          />
          <span :class="{ 'text-muted': !privateKeyFileName }">{{ privateKeyFileName ? privateKeyFileName : t('harvester.generic.noFileChosen') }}</span>
        </div>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <div class="mb-10">
          {{ t('harvester.setting.sslCertificates.ca') }}
        </div>

        <div class="chooseFile">
          <FileSelector
            :include-file-name="true"
            class="btn btn-sm bg-primary mr-20"
            label="Choose File"
            @selected="onKeySelectedCa('ca', $event)"
          />
          <span :class="{ 'text-muted': !caFileName }">{{ caFileName ? caFileName : t('harvester.generic.noFileChosen') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chooseFile {
  display: flex;
  align-items: center;
}
</style>
