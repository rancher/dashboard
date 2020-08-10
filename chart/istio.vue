<script>
import pickBy from 'lodash/pickBy';
import jsyaml from 'js-yaml';
import Checkbox from '@/components/form/Checkbox';
import KeyValue from '@/components/form/KeyValue';
import YamlEditor from '@/components/YamlEditor';
import { mapGetters } from 'vuex';
import FileSelector from '@/components/form/FileSelector';

export default {
  components: {
    Checkbox,
    FileSelector,
    KeyValue,
    YamlEditor,
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const {
      cni, ingressGateways, egressGateways, istiodRemote, pilot, policy, telemetry,
    } = this.value;

    const initialValues = { ...this.value };

    return {
      cni, ingressGateways, egressGateways, istiodRemote, pilot, policy, telemetry, customAnswers: {}, initialValues
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  watch: {
    customAnswers(neu, old) {
      this.updateCustomAnswers(neu, old);
    },
  },

  methods: {
    valuesChanged(value) {
      try {
        jsyaml.safeLoad(value);

        this.value.overlayFile = value;
      } catch (e) {
      }
    },

    updateCustomAnswers(e) {
      const toReplace = pickBy(this.value, (val, key) => {
        return !this.initialValues[key];
      });

      Object.assign(toReplace, e);

      for (const prop in toReplace) {
        delete this.value[prop];
      }
      this.customAnswers = e;
      Object.assign(this.value, e);
    },

    onFileSelected(value) {
      this.$refs['yaml-editor'].updateValue(value);
    }
  }
};
</script>

<template>
  <div>
    <h2>{{ t('istio.titles.components') }}</h2>
    <div class="row">
      <div class="col span-4">
        <Checkbox v-model="cni.enabled" :label="t('istio.cni')" />
      </div>
      <div class="col span-4">
        <Checkbox v-model="ingressGateways.enabled" :label="t('istio.ingressGateway')" />
      </div>
      <div class="col span-4">
        <Checkbox v-model="egressGateways.enabled" :label="t('istio.egressGateway')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-4">
        <Checkbox v-model="pilot.enabled" :label="t('istio.pilot')" />
      </div>
      <div class="col span-4">
        <Checkbox v-model="policy.enabled" :label="t('istio.policy')" />
      </div>
      <div class="col span-4">
        <Checkbox v-model="telemetry.enabled" :label="t('istio.telemetry')" />
      </div>
    </div>

    <div class="spacer" />
    <h2>{{ t('istio.titles.customAnswers') }}</h2>
    <div class="row">
      <KeyValue :value="customAnswers" mode="create" :as-map="true" @input="updateCustomAnswers" />
    </div>

    <div class="spacer" />
    <h2>{{ t('istio.titles.advanced') }}</h2>
    <div class="custom-overlay">
      <div>
        <span>{{ t('istio.customOverlayFile.label') }}</span><i v-tooltip="t('istio.customOverlayFile.tip')" class="icon icon-info" />
      </div>
      <YamlEditor
        ref="yaml-editor"
        class="yaml-editor mb-10"
        :value="value.overlayFile"
        @onInput="valuesChanged"
      />
      <FileSelector class="role-primary  btn-sm" :label="t('generic.readFromFile')" @selected="onFileSelected" />
    </div>
  </div>
</template>

<style lang='scss'>
  $yaml-height: 200px;

  .custom-overlay {
    &>DIV{
      color: var(--input-label);
      &>*{
        padding: 3px;
      }
    }

    & .yaml-editor{
      flex: 1;
      min-height: $yaml-height;
      & .code-mirror .CodeMirror {
        position: initial;
        height: auto;
        min-height: $yaml-height;
      }
    }
  }
</style>
