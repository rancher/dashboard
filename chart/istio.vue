<script>
import debounce from 'lodash/debounce';
import jsyaml from 'js-yaml';
import Checkbox from '@/components/form/Checkbox';
import YamlEditor from '@/components/YamlEditor';
import { mapGetters } from 'vuex';
import FileSelector from '@/components/form/FileSelector';
import Tab from '@/components/Tabbed/Tab';
import Banner from '@/components/Banner';
import { SERVICE } from '@/config/types';

const defaultOverlayFile = '#apiVersion: install.istio.io/v1alpha1\n#kind: IstioOperator\n#spec:\n#  components:\n#    ingressGateways:\n#    - enabled: true\n#      name: istio-ingressgateway\n#    - enabled: true\n#      k8s:\n#        resources:\n#          requests:\n#            cpu: 200m\n#        service:\n#          ports:\n#          - name: tcp-citadel-grpc-tls\n#            port: 8060\n#            targetPort: 8060\n#          - name: tcp-dns\n#            port: 5353\n#        serviceAnnotations:\n#          cloud.google.com/load-balancer-type: internal\n#      name: ilb-gateway\n#      namespace: user-ingressgateway-ns\n#    - enabled: true\n#      k8s:\n#        resources:\n#          requests:\n#            cpu: 200m\n#        service:\n#          ports:\n#          - name: tcp-citadel-grpc-tls\n#            port: 8060\n#            targetPort: 8060\n#          - name: tcp-dns\n#            port: 5353\n#        serviceAnnotations:\n#          cloud.google.com/load-balancer-type: internal\n#      name: other-gateway\n#      namespace: istio-system';

export default {
  components: {
    Checkbox,
    FileSelector,
    YamlEditor,
    Tab,
    Banner
  },

  hasTabs: true,

  props:   {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  fetch() {
    this.$store.dispatch('cluster/find', { type: SERVICE, id: 'istio-system/istio-pilot' }).then((svc) => {
      if (svc) {
        this.v1Installed = true;
      }
    });
  },

  data() {
    let overlayFile = this.value.overlayFile;

    if (!overlayFile.length) {
      overlayFile = defaultOverlayFile;
    }

    return { overlayFile, v1Installed: false };
  },

  computed: {
    valuesYaml: {
      get() {
        try {
          const yaml = jsyaml.safeDump(this.value);

          return yaml;
        } catch (e) {
          return null;
        }
      },
      set: debounce(function(neu) {
        try {
          const obj = jsyaml.safeLoad(neu);

          Object.assign(this.value, obj);
        } catch (e) {

        }
      }, 500)
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    v1Installed(neu, old) {
      if (!!neu && !old) {
        this.$emit('warn', this.t('istio.v1Warning', {}, true));
      }
    }
  },

  methods: {
    update() {
      this.$emit('input', this.value);
    },

    valuesChanged(value) {
      try {
        jsyaml.safeLoad(value);
        if (value === defaultOverlayFile) {
          value = '';
        } else {
          this.overlayFile = value;
        }
        this.value.overlayFile = value;
      } catch (e) {
      }
    },

    onFileSelected(value) {
      this.$refs['yaml-editor'].updateValue(value);
    }
  }
};
</script>

<template>
  <div>
    <Tab name="components" :label="t('istio.titles.components') ">
      <div class="row">
        <div class="col span-4">
          <Checkbox v-model="value.cni.enabled" :label="t('istio.cni')" @input="update" />
        </div>
        <div class="col span-4">
          <Checkbox v-model="value.ingressGateways.enabled" :label="t('istio.ingressGateway')" />
        </div>
        <div class="col span-4">
          <Checkbox v-model="value.egressGateways.enabled" :label="t('istio.egressGateway')" />
        </div>
      </div>
      <div class="row">
        <div class="col span-4">
          <Checkbox v-model="value.pilot.enabled" :label="t('istio.pilot')" />
        </div>
        <div class="col span-4">
          <Checkbox v-model="value.policy.enabled" :label="t('istio.policy')" />
        </div>
        <div class="col span-4">
          <Checkbox v-model="value.telemetry.enabled" :label="t('istio.telemetry')" />
        </div>
      </div>
    </Tab>

    <Tab :label="t('istio.customOverlayFile.label')" name="overlay" @active="$refs['yaml-editor'].refresh()">
      <div class="custom-overlay">
        <Banner color="info">
          <span
            v-html="t('istio.customOverlayFile.tip', {}, true)"
          ></span>
        </Banner>
        <YamlEditor
          ref="yaml-editor"
          class="yaml-editor mb-10"
          :value="overlayFile"
          @onInput="valuesChanged"
        />
        <FileSelector class="role-primary  btn-sm" :label="t('generic.readFromFile')" @selected="onFileSelected" />
      </div>
    </Tab>
    <Tab name="values-yaml" :label="t('catalog.install.section.valuesYaml')" @active="$refs.yaml.refresh()">
      <YamlEditor
        ref="yaml"
        v-model="valuesYaml"
        :scrolling="false"
      />
    </Tab>
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
