<script>
import { _EDIT } from '@shell/config/query-params';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector.vue';
import { base64Encode, base64Decode } from '@shell/utils/crypto';

export default {
  props: {
    mode: {
      type:     String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    },
  },

  components: {
    RadioGroup,
    LabeledInput,
    FileSelector,
    Banner,
  },

  data() {
    const defaultTls = {
      key:  this.value.thanos.tls.key,
      cert: this.value.thanos.tls.cert,
      ca:   this.value.thanos.tls.ca,
    };

    const tls = {
      key:  '',
      cert: base64Decode(this.value.thanos.tls.cert),
      ca:   base64Decode(this.value.thanos.tls.ca),
    };

    return {
      defaultTls,
      tls,
    };
  },

  watch: {
    tls: {
      handler(neu) {
        Object.keys(this.tls).forEach((key) => {
          if (this.tls[key]) {
            this.$set(this.value.thanos.tls, key, base64Encode(this.tls[key]));
          } else {
            this.$set(this.value.thanos.tls, key, this.defaultTls[key]);
          }
        });
      },
      deep: true,
    }
  },

  methods: {
    onFileSelectedKey:  createOnSelected('tls.key'),
    onFileSelectedCert: createOnSelected('tls.cert'),
    onFileSelectedCa:   createOnSelected('tls.ca'),
  }
};
</script>

<template>
  <div>
    <h2>{{ t('globalMonitoringPage.tls.header') }}</h2>
    <Banner
      v-if="value.thanos.tls.enabled"
      :closable="true"
      class="cluster-tools-tip"
      color="warning"
      :label="t('globalMonitoringPage.tls.warning')"
    />
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.thanos.tls.enabled"
          name="objectStorageEnabled"
          :mode="mode"
          :labels="[t('generic.yes'), t('generic.no')]"
          :options="[true, false]"
        />
      </div>
    </div>
    <template v-if="value.thanos.tls.enabled">
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="tls.key"
            :mode="mode"
            type="multiline"
            :label="t('globalMonitoringPage.tls.key.label')"
            :placeholder="t('globalMonitoringPage.tls.key.placeholder')"
          />
          <FileSelector
            class="btn btn-sm bg-primary mt-10"
            :label="t('generic.readFromFile')"
            @selected="onFileSelectedKey"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="tls.cert"
            :mode="mode"
            type="multiline"
            :label="t('globalMonitoringPage.tls.cert.label')"
            :placeholder="t('globalMonitoringPage.tls.cert.placeholder')"
          />
          <FileSelector
            class="btn btn-sm bg-primary mt-10"
            :label="t('generic.readFromFile')"
            @selected="onFileSelectedCert"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="tls.ca"
            :mode="mode"
            type="multiline"
            :label="t('globalMonitoringPage.tls.ca.label')"
            :placeholder="t('globalMonitoringPage.tls.ca.placeholder')"
          />
          <FileSelector
            class="btn btn-sm bg-primary mt-10"
            :label="t('generic.readFromFile')"
            @selected="onFileSelectedCa"
          />
        </div>
      </div>
    </template>
  </div>
</template>
