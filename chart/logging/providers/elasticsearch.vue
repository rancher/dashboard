<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  name:       'ElasticsearchProvider',
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {

      schemes:       ['http', 'https'],
      toUpload:      '',
      values:   { ...this.value.elasticsearch }
    };
  },

  watch: {
    values: {
      deep: true,
      handler() {
        Object.assign(this.value.elasticsearch, this.values);
      }
    }
  },

  methods: {
    fileUpload(field) {
      this.toUpload = field;
      this.$refs.uploader.click();
    },

    fileChange(event) {
      const input = event.target;
      const handles = input.files;
      const names = [];

      if ( handles ) {
        for ( let i = 0 ; i < handles.length ; i++ ) {
          const reader = new FileReader();

          reader.onload = (loaded) => {
            const value = loaded.target.result;

            this.values[this.toUpload] = value;
          };

          reader.onerror = (err) => {
            this.$dispatch('growl/fromError', { title: 'Error reading file', err }, { root: true });
          };

          names[i] = handles[i].name;
          reader.readAsText(handles[i]);
        }

        input.value = '';
      }
    },
  },
};
</script>

<template>
  <div class="elasticsearch">
    <LabeledInput v-model="values.host" :label="t('logging.elasticsearch.host')" />
    <LabeledSelect v-model="values.scheme" :options="schemes" :label="t('logging.elasticsearch.scheme')" />
    <LabeledInput v-model="values.port" :label="t('logging.elasticsearch.port')" />
    <LabeledInput v-model="values.index_name" :label="t('logging.elasticsearch.clusterName')" />
    <LabeledInput v-model="values.user" :label="t('logging.elasticsearch.user')" />
    <LabeledInput v-model="values.password" :label="t('logging.elasticsearch.password')" type="password" />
    <div class="cert row">
      <div class="col span-6">
        <LabeledInput v-model="values.client_cert" type="multiline" :label="t('logging.elasticsearch.clientCert.label')" :placeholder="t('logging.elasticsearch.clientCert.placeholder')" />
        <button type="button" class="btn btn-sm bg-primary mt-10" @click="fileUpload('client_cert')">
          {{ t('secret.certificate.readFromFile') }}
        </button>
      </div>
      <div class="col span-6">
        <LabeledInput v-model="values.client_key" type="multiline" :label="t('logging.elasticsearch.clientKey.label')" :placeholder="t('logging.elasticsearch.clientKey.placeholder')" />
        <button type="button" class="btn btn-sm bg-primary mt-10" @click="fileUpload('client_key')">
          {{ t('secret.certificate.readFromFile') }}
        </button>
      </div>
    </div>
    <LabeledInput v-model="values.client_key_pass" :label="t('logging.elasticsearch.clientKeyPass')" type="password" />
    <input
      ref="uploader"
      type="file"
      class="hide"
      @change="fileChange"
    />
  </div>
</template>

<style lang="scss">
.elasticsearch {
    & > * {
        margin-top: 10px;
    }
}
</style>
